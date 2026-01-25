import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { getRequestContext, logError, logInfo, logWarn } from './logger.js';

const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  meatType?: string;
  sauce?: string;
}

interface OrderEmailRequest {
  customerEmail: string;
  customerName: string;
  orderId: string;
  items: OrderItem[];
  total: number;
}

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

  if (!process.env.RESEND_API_KEY) {
    logWarn('resend_api_key_missing', requestContext);
    return res.status(500).json({ error: 'Email service not configured' });
  }

  try {
    const { customerEmail, customerName, orderId, items, total }: OrderEmailRequest = req.body;

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          ${item.name}${item.meatType ? ` (${item.meatType})` : ''}${item.sauce ? ` with ${item.sauce}` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🌮 Order Confirmed!</h1>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                ¡Hola <strong>${customerName}</strong>! Thank you for your order.
              </p>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>Order #${orderId.slice(-8).toUpperCase()}</strong>
                </p>
              </div>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                  <tr style="background: #f3f4f6;">
                    <th style="padding: 12px; text-align: left; font-size: 14px; color: #6b7280;">Item</th>
                    <th style="padding: 12px; text-align: center; font-size: 14px; color: #6b7280;">Qty</th>
                    <th style="padding: 12px; text-align: right; font-size: 14px; color: #6b7280;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 16px 12px; text-align: right; font-weight: bold; font-size: 18px;">Total:</td>
                    <td style="padding: 16px 12px; text-align: right; font-weight: bold; font-size: 18px; color: #dc2626;">$${total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
              
              <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0; color: #065f46; font-size: 14px;">
                  🕐 <strong>Estimated pickup time:</strong> 15-20 minutes
                </p>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">
                Questions about your order? Just reply to this email.
              </p>
              
              <p style="font-size: 14px; color: #374151; margin: 0;">
                ¡Gracias y buen provecho! 🎉
              </p>
            </div>
            
            <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px;">
              Taqueria El Sol • Fresh Mexican Food
            </p>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: 'Taqueria El Sol <onboarding@resend.dev>',
      to: [customerEmail],
      subject: `Order Confirmed! #${orderId.slice(-8).toUpperCase()}`,
      html,
    });

    if (error) {
      logError('resend_error', error, requestContext);
      return res.status(500).json({ error: error.message });
    }

    logInfo('order_email_sent', { ...requestContext, messageId: data?.id });
    return res.status(200).json({ success: true, messageId: data?.id });
  } catch (error: any) {
    logError('send_order_email_error', error, requestContext);
    return res.status(500).json({ error: error.message });
  }
}
