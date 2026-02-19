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

    // POST - Cancel order with auto-refund (within 30 seconds)
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
      const withinWindow = Date.now() - createdAt <= 30 * 1000;
      if (!withinWindow) {
        return res.status(400).json({ error: 'Cancellation window expired' });
      }

      let refundId: string | null = null;
      let refundAmount = 0;
      let stripeFee = 0;
      let originalCharge = 0;

      try {
        if (typeof order.stripeSessionId === 'string' && order.stripeSessionId.startsWith('test_')) {
          refundId = 'test_refund';
          refundAmount = order.totalAmount || 0;
        } else {
          const paymentIntentId = order.paymentIntentId;
          if (!paymentIntentId) {
            return res.status(500).json({ error: 'Payment intent not found for refund' });
          }
          const stripe = getStripeClient();

          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          const chargeId = typeof paymentIntent.latest_charge === 'string'
            ? paymentIntent.latest_charge
            : (paymentIntent.latest_charge as any)?.id;

          if (!chargeId) {
            return res.status(500).json({ error: 'Could not find charge for refund' });
          }

          const charge = await stripe.charges.retrieve(chargeId, {
            expand: ['balance_transaction'],
          });

          if (charge.refunded) {
            return res.status(400).json({ error: 'This order has already been refunded' });
          }

          const balanceTxn = charge.balance_transaction as Stripe.BalanceTransaction;
          originalCharge = charge.amount / 100;
          stripeFee = (balanceTxn?.fee || 0) / 100;
          const refundCents = charge.amount - (balanceTxn?.fee || 0);
          refundAmount = refundCents / 100;

          const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: refundCents,
          });
          refundId = refund.id;
        }
      } catch (refundError: any) {
        logError('customer_cancel_refund_error', refundError, requestContext);
        return res.status(500).json({ error: `Refund failed: ${refundError.message}. Order was not cancelled — please try again or call us at (314) 771-8648.` });
      }

      await ordersCollection.updateOne(
        { _id: order._id },
        {
          $set: {
            status: 'cancelled',
            refundId,
            refundAmount,
            stripeFee,
            originalCharge,
            refundedAt: new Date(),
            updatedAt: new Date(),
          },
          $push: {
            statusHistory: {
              status: 'cancelled',
              timestamp: new Date(),
              note: `Customer cancelled within 30 seconds — $${refundAmount.toFixed(2)} refunded (Stripe fee $${stripeFee.toFixed(2)} deducted)`,
            },
          },
        } as any
      );

      // Send cancellation email to owner
      if (process.env.RESEND_API_KEY) {
        try {
          const ownerEmail = process.env.OWNER_EMAIL;
          if (ownerEmail) {
            const { Resend } = await import('resend');
            const resend = new Resend(process.env.RESEND_API_KEY);

            const itemsHtml = (order.items || []).map((item: any) => `
              <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">
                  ${item.name}${item.meatType ? ` <span style="color: #6b7280;">(${item.meatType})</span>` : ''}${item.sauce ? ` <span style="color: #6b7280;">with ${item.sauce}</span>` : ''}
                </td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.qty || item.quantity || 1}</td>
              </tr>
            `).join('');

            const orderId = order._id.toString();
            const cancelHtml = `
              <!DOCTYPE html>
              <html>
                <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Order Cancelled by Customer</h1>
                    </div>
                    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
                        <p style="margin: 0; color: #92400e; font-size: 14px;">
                          <strong>Order #${orderId.slice(-8).toUpperCase()}</strong> &bull; Customer cancelled within 30 seconds of placing the order
                        </p>
                      </div>

                      <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 16px;">Customer Details</h3>
                      <table style="width: 100%; margin-bottom: 24px; font-size: 14px;">
                        <tr>
                          <td style="padding: 6px 0; color: #6b7280; width: 100px;">Name:</td>
                          <td style="padding: 6px 0; color: #111827; font-weight: 600;">${order.customerName || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #6b7280;">Email:</td>
                          <td style="padding: 6px 0; color: #111827;">${order.customerEmail || 'Not provided'}</td>
                        </tr>
                      </table>

                      <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 16px;">Cancelled Items</h3>
                      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                        <thead>
                          <tr style="background: #f3f4f6;">
                            <th style="padding: 8px 12px; text-align: left; font-size: 13px; color: #6b7280;">Item</th>
                            <th style="padding: 8px 12px; text-align: center; font-size: 13px; color: #6b7280;">Qty</th>
                          </tr>
                        </thead>
                        <tbody>${itemsHtml}</tbody>
                      </table>

                      <div style="background: #fef2f2; padding: 16px; border-radius: 8px;">
                        <h3 style="margin: 0 0 12px 0; color: #991b1b; font-size: 16px;">Refund Summary</h3>
                        <table style="width: 100%; font-size: 14px;">
                          <tr>
                            <td style="padding: 4px 0; color: #6b7280;">Original Charge:</td>
                            <td style="padding: 4px 0; text-align: right; color: #111827;">$${originalCharge.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td style="padding: 4px 0; color: #6b7280;">Stripe Fee (deducted):</td>
                            <td style="padding: 4px 0; text-align: right; color: #dc2626;">-$${stripeFee.toFixed(2)}</td>
                          </tr>
                          <tr style="border-top: 2px solid #fca5a5;">
                            <td style="padding: 8px 0 4px; font-weight: bold; color: #111827;">Refunded to Customer:</td>
                            <td style="padding: 8px 0 4px; text-align: right; font-weight: bold; font-size: 18px; color: #16a34a;">$${refundAmount.toFixed(2)}</td>
                          </tr>
                        </table>
                      </div>
                    </div>
                    <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px;">
                      Taqueria Hectorito • Order Cancellation Notice
                    </p>
                  </div>
                </body>
              </html>
            `;

            await resend.emails.send({
              from: 'Taqueria Hectorito Orders <onboarding@resend.dev>',
              to: [ownerEmail],
              subject: `⚠️ Order #${orderId.slice(-8).toUpperCase()} Cancelled by Customer — $${refundAmount.toFixed(2)} Refunded`,
              html: cancelHtml,
            });
          }
        } catch (emailErr) {
          logError('customer_cancel_email_error', emailErr, requestContext);
        }
      }

      return res.status(200).json({ success: true, refundId, refundAmount, stripeFee });
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

        // Auto-refund the full Stripe charge amount (includes taxes) when staff cancels/rejects
        if (status === 'cancelled' && currentOrder && !currentOrder.refundId) {
          const paymentIntentId = currentOrder.paymentIntentId;
          if (paymentIntentId) {
            try {
              if (typeof currentOrder.stripeSessionId === 'string' && currentOrder.stripeSessionId.startsWith('test_')) {
                updateData.refundId = 'test_refund';
                updateData.refundAmount = currentOrder.totalAmount || 0;
                updateData.stripeFee = 0;
              } else {
                const stripe = getStripeClient();

                const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
                const chargeId = typeof paymentIntent.latest_charge === 'string'
                  ? paymentIntent.latest_charge
                  : (paymentIntent.latest_charge as any)?.id;

                if (!chargeId) {
                  return res.status(500).json({ error: 'Could not find charge for refund' });
                }

                const charge = await stripe.charges.retrieve(chargeId, {
                  expand: ['balance_transaction'],
                });

                if (charge.refunded) {
                  return res.status(400).json({ error: 'This order has already been refunded' });
                }

                const balanceTxn = charge.balance_transaction as Stripe.BalanceTransaction;
                const totalCharged = charge.amount;
                const stripeFee = balanceTxn?.fee || 0;
                const refundAmount = totalCharged - stripeFee;

                const refund = await stripe.refunds.create({
                  payment_intent: paymentIntentId,
                  amount: refundAmount,
                });

                updateData.refundId = refund.id;
                updateData.refundAmount = refundAmount / 100;
                updateData.stripeFee = stripeFee / 100;
                updateData.originalCharge = totalCharged / 100;
              }
              updateData.refundedAt = new Date();
            } catch (refundError: any) {
              logError('staff_refund_error', refundError, requestContext);
              return res.status(500).json({ error: `Refund failed: ${refundError.message}. Order was not rejected — please try again or call (314) 771-8648.` });
            }
          }
        }
      }

      if (prepTimeMinutes) {
        updateData.prepTimeMinutes = prepTimeMinutes;
        updateData.estimatedReadyAt = new Date(Date.now() + prepTimeMinutes * 60 * 1000);
      }

      // Use $set and $push separately
      const updateQuery: any = { $set: updateData };
      if (status) {
        const note = status === 'cancelled' && updateData.refundId
          ? `Rejected by staff — $${updateData.refundAmount?.toFixed(2)} refunded (Stripe fee $${updateData.stripeFee?.toFixed(2)} deducted)`
          : undefined;
        updateQuery.$push = { statusHistory: { status, timestamp: new Date(), ...(note && { note }) } };
      }
      const result = await ordersCollection.updateOne(
        { _id: new ObjectId(orderId) },
        updateQuery
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Send cancellation/refund email to owner
      if (status === 'cancelled' && updateData.refundId && process.env.RESEND_API_KEY) {
        try {
          const ownerEmail = process.env.OWNER_EMAIL;
          if (ownerEmail) {
            const { Resend } = await import('resend');
            const resend = new Resend(process.env.RESEND_API_KEY);

            const itemsHtml = (currentOrder?.items || []).map((item: any) => `
              <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">
                  ${item.name}${item.meatType ? ` <span style="color: #6b7280;">(${item.meatType})</span>` : ''}${item.sauce ? ` <span style="color: #6b7280;">with ${item.sauce}</span>` : ''}
                </td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.qty || item.quantity || 1}</td>
              </tr>
            `).join('');

            const cancelHtml = `
              <!DOCTYPE html>
              <html>
                <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 28px;">❌ Order Rejected &amp; Refunded</h1>
                    </div>
                    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
                        <p style="margin: 0; color: #991b1b; font-size: 14px;">
                          <strong>Order #${orderId.slice(-8).toUpperCase()}</strong> &bull; ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}
                        </p>
                      </div>

                      <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 16px;">Customer Details</h3>
                      <table style="width: 100%; margin-bottom: 24px; font-size: 14px;">
                        <tr>
                          <td style="padding: 6px 0; color: #6b7280; width: 100px;">Name:</td>
                          <td style="padding: 6px 0; color: #111827; font-weight: 600;">${currentOrder?.customerName || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #6b7280;">Email:</td>
                          <td style="padding: 6px 0; color: #111827;">${currentOrder?.customerEmail || 'Not provided'}</td>
                        </tr>
                      </table>

                      <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 16px;">Order Items</h3>
                      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                        <thead>
                          <tr style="background: #f3f4f6;">
                            <th style="padding: 8px 12px; text-align: left; font-size: 13px; color: #6b7280;">Item</th>
                            <th style="padding: 8px 12px; text-align: center; font-size: 13px; color: #6b7280;">Qty</th>
                          </tr>
                        </thead>
                        <tbody>${itemsHtml}</tbody>
                      </table>

                      <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                        <h3 style="margin: 0 0 12px 0; color: #991b1b; font-size: 16px;">Refund Summary</h3>
                        <table style="width: 100%; font-size: 14px;">
                          <tr>
                            <td style="padding: 4px 0; color: #6b7280;">Original Charge:</td>
                            <td style="padding: 4px 0; text-align: right; color: #111827;">$${(updateData.originalCharge || currentOrder?.totalAmount || 0).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td style="padding: 4px 0; color: #6b7280;">Stripe Fee (deducted):</td>
                            <td style="padding: 4px 0; text-align: right; color: #dc2626;">-$${(updateData.stripeFee || 0).toFixed(2)}</td>
                          </tr>
                          <tr style="border-top: 2px solid #fca5a5;">
                            <td style="padding: 8px 0 4px; font-weight: bold; color: #111827;">Refunded to Customer:</td>
                            <td style="padding: 8px 0 4px; text-align: right; font-weight: bold; font-size: 18px; color: #16a34a;">$${(updateData.refundAmount || 0).toFixed(2)}</td>
                          </tr>
                        </table>
                      </div>
                    </div>
                    <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px;">
                      Taqueria Hectorito • Order Cancellation Notice
                    </p>
                  </div>
                </body>
              </html>
            `;

            await resend.emails.send({
              from: 'Taqueria Hectorito Orders <onboarding@resend.dev>',
              to: [ownerEmail],
              subject: `❌ Order #${orderId.slice(-8).toUpperCase()} Rejected — $${(updateData.refundAmount || 0).toFixed(2)} Refunded`,
              html: cancelHtml,
            });
          }
        } catch (emailErr) {
          logError('cancellation_email_error', emailErr, requestContext);
        }
      }

      return res.status(200).json({
        success: true,
        ...(updateData.refundId && {
          refundId: updateData.refundId,
          refundAmount: updateData.refundAmount,
          stripeFee: updateData.stripeFee,
          originalCharge: updateData.originalCharge,
        }),
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    logError('orders_api_error', error, requestContext);
    return res.status(500).json({ error: error.message });
  }
}
