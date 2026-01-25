import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRequestContext, logError } from './logger.ts';

const getStripeClient = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }
  return new Stripe(secretKey, { apiVersion: '2025-12-15.clover' });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestContext = getRequestContext(req);
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body =
      typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    const { items, customerEmail, customerName, customerPhone, guestId } = body;
    const stripe = getStripeClient();

    // Calculate total
    const lineItems = items.map((item: any) => {
      const imageUrl =
        typeof item.image === 'string' && /^https?:\/\//i.test(item.image)
          ? item.image
          : undefined;
      return ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: item.meatType ? `${item.meatType}${item.sauce ? ` with ${item.sauce}` : ''}` : undefined,
          images: imageUrl ? [imageUrl] : undefined,
        },
        unit_amount: Math.round(item.price * 100), // Stripe uses cents
      },
      quantity: item.quantity,
    });
    });

    // Store full item details for order creation
    // Stripe metadata values have 500 char limit, so we store essential data
    const orderItems = items.map((item: any) => ({
      name: item.name,
      qty: item.quantity,
      price: item.price,
      meatType: item.meatType || null,
      sauce: item.sauce || null,
      toppings: item.toppings || null,
    }));

    // If items data is too large, split into chunks
    const orderItemsJson = JSON.stringify(orderItems);
    const metadata: Record<string, string> = {
      customerName,
      customerPhone,
      guestId: guestId || '',
    };

    // Stripe metadata limit is 500 chars per value, split if needed
    if (orderItemsJson.length <= 500) {
      metadata.orderItems = orderItemsJson;
    } else {
      // Split into chunks
      const chunkSize = 490;
      for (let i = 0; i < orderItemsJson.length; i += chunkSize) {
        metadata[`orderItems_${Math.floor(i / chunkSize)}`] = orderItemsJson.slice(i, i + chunkSize);
      }
      metadata.orderItemsChunks = String(Math.ceil(orderItemsJson.length / chunkSize));
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.VITE_APP_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_APP_URL}/menu`,
      customer_email: customerEmail,
      metadata,
    });

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    logError('stripe_checkout_error', error, requestContext);
    return res.status(500).json({ error: error.message });
  }
}
