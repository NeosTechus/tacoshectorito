import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient, ObjectId, type Collection, type Document } from 'mongodb';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';
import { getRequestContext, logError } from './logger.js';

let cachedClient: MongoClient | null = null;
let ordersIndexesReady = false;

async function getMongoClient() {
  if (cachedClient) return cachedClient;
  cachedClient = new MongoClient(process.env.MONGODB_URI!);
  await cachedClient.connect();
  return cachedClient;
}

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }
  return new Stripe(secretKey, { apiVersion: '2025-12-15.clover' });
}

async function ensureOrdersIndexes(ordersCollection: Collection<Document>) {
  if (ordersIndexesReady) return;
  await ordersCollection.createIndex({ stripeSessionId: 1 }, { unique: true, sparse: true });
  await ordersCollection.createIndex({ createdAt: -1 });
  await ordersCollection.createIndex({ status: 1, createdAt: -1 });
  ordersIndexesReady = true;
}

function requireStaffAuth(req: VercelRequest) {
  const authHeader = typeof req.headers.authorization === 'string'
    ? req.headers.authorization
    : '';
  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Missing authorization token');
  }
  const token = authHeader.replace('Bearer ', '');
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  if (decoded?.type !== 'admin' && decoded?.type !== 'chef') {
    throw new Error('Unauthorized');
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestContext = getRequestContext(req);
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const body = (() => {
    if (typeof req.body === 'string') {
      if (!req.body.trim()) return {};
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
    return req.body ?? {};
  })();

  try {
    const client = await getMongoClient();
    const db = client.db('restaurant');
    const ordersCollection = db.collection('orders');
    await ensureOrdersIndexes(ordersCollection);

    // GET - Fetch orders by guestId, email, orderId, or all for admin
    if (req.method === 'GET') {
      const { guestId, email, orderId, sessionId, admin } = req.query;

      let query: any = {};
      
      // Admin mode - fetch all orders
      if (admin === 'true') {
        requireStaffAuth(req);
        // In production, add proper admin authentication here
        const orders = await ordersCollection
          .find({})
          .sort({ createdAt: -1 })
          .limit(500)
          .toArray();
        return res.status(200).json({ orders });
      }
      
      if (orderId) {
        query._id = new ObjectId(orderId as string);
      } else if (sessionId) {
        query.stripeSessionId = sessionId;
      } else if (guestId) {
        query.guestId = guestId;
      } else if (email) {
        query.customerEmail = email;
      } else {
        return res.status(400).json({ error: 'Must provide guestId, email, orderId, or sessionId' });
      }

      const orders = await ordersCollection
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json({ orders });
    }

    // POST - Cancel order with auto-refund (within 2 minutes)
    if (req.method === 'POST' && body?.action === 'cancel') {
      const { sessionId, customerEmail } = body;
      if (!sessionId || !customerEmail) {
        return res.status(400).json({ error: 'sessionId and customerEmail are required' });
      }

      const order = await ordersCollection.findOne({ stripeSessionId: sessionId });
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      if ((order.customerEmail || '').toLowerCase() !== String(customerEmail).toLowerCase()) {
        return res.status(403).json({ error: 'Email does not match order' });
      }
      if (order.status !== 'pending') {
        return res.status(400).json({ error: 'Order cannot be cancelled after acceptance' });
      }

      const createdAt = new Date(order.createdAt as any).getTime();
      const withinWindow = Date.now() - createdAt <= 2 * 60 * 1000;
      if (!withinWindow) {
        return res.status(400).json({ error: 'Cancellation window expired' });
      }

      let refundId: string | null = null;
      if (typeof order.stripeSessionId === 'string' && order.stripeSessionId.startsWith('test_')) {
        refundId = 'test_refund';
      } else {
        const paymentIntentId = order.paymentIntentId;
        if (!paymentIntentId) {
          return res.status(500).json({ error: 'Payment intent not found for refund' });
        }
        const stripe = getStripeClient();
        const refund = await stripe.refunds.create({ payment_intent: paymentIntentId });
        refundId = refund.id;
      }

      await ordersCollection.updateOne(
        { _id: order._id },
        {
          $set: {
            status: 'cancelled',
            refundId,
            refundedAt: new Date(),
            updatedAt: new Date(),
          },
          $push: {
            statusHistory: {
              status: 'cancelled',
              timestamp: new Date(),
              note: 'Customer cancelled within 2 minutes',
            } as any,
          },
        }
      );

      return res.status(200).json({ success: true, refundId });
    }

    // POST - Create a dev/test order (local development only)
    if (req.method === 'POST') {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Not allowed in production' });
      }

      const devHeader = req.headers['x-dev-order'];
      if (devHeader !== 'true') {
        return res.status(403).json({ error: 'Missing dev header' });
      }

      const {
        items,
        customerEmail,
        customerName,
        customerPhone,
        guestId,
        totalAmount,
      } = body;

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items are required' });
      }

      const normalizedItems = items.map((item: any) => ({
        name: item.name,
        qty: item.qty ?? item.quantity ?? 1,
        price: item.price,
        meatType: item.meatType ?? null,
        sauce: item.sauce ?? null,
        toppings: item.toppings ?? null,
      }));

      const stripeSessionId = `test_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 9)}`;

      const order = {
        stripeSessionId,
        customerEmail: customerEmail || '',
        customerName: customerName || '',
        customerPhone: customerPhone || '',
        guestId: guestId || null,
        items: normalizedItems,
        totalAmount: totalAmount || 0,
        status: 'pending',
        prepTimeMinutes: 15,
        createdAt: new Date(),
        updatedAt: new Date(),
        estimatedReadyAt: null,
        statusHistory: [
          { status: 'pending', timestamp: new Date(), note: 'Test order created' }
        ]
      };

      const result = await ordersCollection.insertOne(order);
      return res.status(201).json({
        orderId: result.insertedId.toString(),
        stripeSessionId,
      });
    }

    // PUT - Update order status (for admin use)
    if (req.method === 'PUT') {
      requireStaffAuth(req);
      const { orderId, status, prepTimeMinutes } = body;

      if (!orderId) {
        return res.status(400).json({ error: 'orderId is required' });
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      // Get current order to check status transition
      const currentOrder = await ordersCollection.findOne({ _id: new ObjectId(orderId) });

      if (status) {
        updateData.status = status;
        
        // When transitioning from pending to received (admin accepts order), set the estimated time
        if (currentOrder?.status === 'pending' && status === 'received') {
          const prepTime = prepTimeMinutes || currentOrder.prepTimeMinutes || 15;
          updateData.estimatedReadyAt = new Date(Date.now() + prepTime * 60 * 1000);
          updateData.prepTimeMinutes = prepTime;
        }
      }

      if (prepTimeMinutes) {
        updateData.prepTimeMinutes = prepTimeMinutes;
        updateData.estimatedReadyAt = new Date(Date.now() + prepTimeMinutes * 60 * 1000);
      }

      // Use $set and $push separately
      const result = await ordersCollection.updateOne(
        { _id: new ObjectId(orderId) },
        { 
          $set: updateData,
          ...(status && { $push: { statusHistory: { status, timestamp: new Date() } } })
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    logError('orders_api_error', error, requestContext);
    return res.status(500).json({ error: error.message });
  }
}
