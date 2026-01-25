import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient, type Collection, type Document } from 'mongodb';
import { getRequestContext, logError, logInfo, logWarn } from './logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

let cachedClient: MongoClient | null = null;
let ordersIndexesReady = false;

async function getMongoClient() {
  if (cachedClient) return cachedClient;
  cachedClient = new MongoClient(process.env.MONGODB_URI!);
  await cachedClient.connect();
  return cachedClient;
}

async function ensureOrdersIndexes(ordersCollection: Collection<Document>) {
  if (ordersIndexesReady) return;
  await ordersCollection.createIndex({ stripeSessionId: 1 }, { unique: true, sparse: true });
  await ordersCollection.createIndex({ createdAt: -1 });
  await ordersCollection.createIndex({ status: 1, createdAt: -1 });
  ordersIndexesReady = true;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestContext = getRequestContext(req);
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    logError('stripe_webhook_signature_failed', err, requestContext);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    try {
      const client = await getMongoClient();
      const db = client.db('restaurant');
      const ordersCollection = db.collection('orders');
      await ensureOrdersIndexes(ordersCollection);

      // Parse items - handle chunked metadata if needed
      let parsedItems;
      const metadata = session.metadata || {};
      
      if (metadata.orderItemsChunks) {
        // Reconstruct from chunks
        const chunkCount = parseInt(metadata.orderItemsChunks, 10);
        let fullJson = '';
        for (let i = 0; i < chunkCount; i++) {
          fullJson += metadata[`orderItems_${i}`] || '';
        }
        parsedItems = JSON.parse(fullJson);
      } else {
        parsedItems = JSON.parse(metadata.orderItems || '[]');
      }
      
      const totalAmount = session.amount_total ? session.amount_total / 100 : 0;

      // Create order in MongoDB with pending status (awaiting admin approval)
      const existingOrder = await ordersCollection.findOne({ stripeSessionId: session.id });
      if (existingOrder) {
        return res.status(200).json({ received: true, deduped: true });
      }

      const order = {
        stripeSessionId: session.id,
        paymentIntentId: typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id,
        customerEmail: session.customer_email,
        customerName: session.metadata?.customerName,
        customerPhone: session.metadata?.customerPhone,
        guestId: session.metadata?.guestId,
        items: parsedItems,
        totalAmount,
        status: 'pending', // Payment received, awaiting admin approval
        prepTimeMinutes: 15, // Default prep time
        createdAt: new Date(),
        updatedAt: new Date(),
        estimatedReadyAt: null, // Will be set when admin accepts
        statusHistory: [
          { status: 'pending', timestamp: new Date(), note: 'Payment received, awaiting approval' }
        ]
      };

      let createdOrderId: string | null = null;
      try {
        const result = await ordersCollection.insertOne(order);
        createdOrderId = result.insertedId.toString();
        logInfo('stripe_order_created', {
          ...requestContext,
          stripeSessionId: session.id,
          orderId: createdOrderId,
        });
      } catch (dbError: any) {
        // If Stripe retries, unique index may already exist
        if (dbError?.code === 11000) {
          return res.status(200).json({ received: true, deduped: true });
        }
        throw dbError;
      }

      // Send confirmation email (non-blocking)
      if (session.customer_email && process.env.RESEND_API_KEY) {
        try {
          const emailPayload = {
            customerEmail: session.customer_email,
            customerName: session.metadata?.customerName || 'Valued Customer',
            orderId: createdOrderId || session.id,
            items: parsedItems,
            total: totalAmount,
          };

          // Call the email endpoint
          const emailResponse = await fetch(`${process.env.VITE_APP_URL}/api/send-order-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailPayload),
          });

          if (!emailResponse.ok) {
            const responseText = await emailResponse.text();
            logWarn('order_email_send_failed', {
              ...requestContext,
              responseStatus: emailResponse.status,
              responseText,
              customerEmail: session.customer_email,
            });
          } else {
            logInfo('order_email_sent', {
              ...requestContext,
              customerEmail: session.customer_email,
            });
          }
        } catch (emailError) {
          logError('order_email_error', emailError, {
            ...requestContext,
            customerEmail: session.customer_email,
          });
        }
      }
    } catch (dbError) {
      logError('stripe_order_db_error', dbError, requestContext);
    }
  }

  return res.status(200).json({ received: true });
}
