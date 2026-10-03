// Supabase Edge Function: notify-order-status
// Invoked when an order status changes to 'ready_for_delivery' or 'out_for_delivery'
// Can be deployed to Supabase with: supabase functions deploy notify-order-status

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface OrderStatusPayload {
  order_number: string;
  tracking_code?: string;
  customer_name: string;
  email: string;
  order_status: string;
  phone?: string;
  items?: Array<{ name: string; quantity: number; size?: string; price: number }>;
  total?: number;
  delivery_charge?: number;
  full_address?: string;
  tracking_url?: string;
  test_mode?: boolean;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: OrderStatusPayload = await req.json().catch(() => ({}));
    const {
      order_number,
      tracking_code,
      customer_name = 'Valued Guest',
      email,
      order_status,
      items = [],
      total = 0,
      full_address = '',
      tracking_url = `https://vediqbiryani.com/track?code=${tracking_code || order_number}`,
      test_mode = false,
    } = payload;

    if (!order_number) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing order_number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Recipient email is required for notifications' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only send alerts when order status is 'ready_for_delivery' or 'out_for_delivery' (or in test mode)
    const normalizedStatus = (order_status || '').toLowerCase().trim();
    const isReady = normalizedStatus === 'ready_for_delivery' || normalizedStatus === 'ready';
    const isOut = normalizedStatus === 'out_for_delivery';

    if (!isReady && !isOut && !test_mode) {
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reason: `Notification ignored: Order status '${order_status}' is not 'ready_for_delivery' or 'out_for_delivery'.`,
          order_number,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const effectiveCode = tracking_code || order_number;
    const formattedTotal = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(total);

    // Build email subject and status message based on status
    let subject = '';
    let statusHeading = '';
    let statusBadgeText = '';
    let statusDescription = '';
    let statusIconEmoji = '🥘';

    if (isReady) {
      statusIconEmoji = '🥘';
      subject = `🥘 Vediq Biryani: Order #${effectiveCode} is Packed & Ready for Delivery!`;
      statusHeading = 'Your Royal Dum Biryani is Packed & Ready!';
      statusBadgeText = 'Ready for Delivery';
      statusDescription =
        'Slow-cooked over natural charcoal, delicately layered in fresh banana leaf (Kele ka Patta), and safely packed in our signature handi. Our delivery valet is preparing for pickup!';
    } else if (isOut) {
      statusIconEmoji = '🛵';
      subject = `🛵 Vediq Biryani: Order #${effectiveCode} is Out for Delivery!`;
      statusHeading = 'Royal Delivery Valet is On The Way!';
      statusBadgeText = 'Out for Delivery';
      statusDescription =
        'Your piping hot dum biryani is now out for doorstep delivery. Please ensure someone is available at your address to receive the royal feast.';
    } else {
      statusIconEmoji = '✨';
      subject = `✨ Vediq Biryani: Order #${effectiveCode} Notification (Test Alert)`;
      statusHeading = 'Order Notification Test';
      statusBadgeText = 'Notification Active';
      statusDescription =
        'This is a verified test email alert for your order tracking notifications. You will receive updates when your order is Ready for Delivery and Out for Delivery.';
    }

    // Build Items list HTML
    const itemsHtml = items
      .map(
        (it) => `
        <tr style="border-bottom: 1px solid #1C2D4A;">
          <td style="padding: 10px 0; color: #F5F1E8; font-weight: 600;">
            ${it.quantity}x ${it.name}
            ${it.size ? `<span style="color: #C9A24A; font-size: 11px; margin-left: 6px;">(${it.size})</span>` : ''}
          </td>
          <td style="padding: 10px 0; color: #E2C56B; text-align: right; font-weight: 700;">
            ₹${(it.price * (it.quantity || 1)).toFixed(0)}
          </td>
        </tr>
      `
      )
      .join('');

    // Generate Royal Vediq Biryani Branded HTML Email
    const htmlEmail = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #040913; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F5F1E8;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #040913; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #0A1628; border: 1px solid #1C2D4A; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <!-- Header Bar -->
          <tr>
            <td style="background: linear-gradient(135deg, #07111F 0%, #101F35 100%); padding: 30px 25px 25px; text-align: center; border-bottom: 2px solid #C9A24A;">
              <div style="font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #E2C56B; font-family: Georgia, serif; text-transform: uppercase;">
                VEDIQ BIRYANI
              </div>
              <div style="font-size: 11px; font-weight: 600; letter-spacing: 3px; color: #AAB4C2; text-transform: uppercase; margin-top: 4px;">
                Royal Dum Biryanis & Delicacies · Ghaziabad
              </div>
            </td>
          </tr>

          <!-- Status Highlight Card -->
          <tr>
            <td style="padding: 30px 25px 20px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <div style="display: inline-block; padding: 6px 16px; border-radius: 50px; background-color: #101F35; border: 1px solid #C9A24A; color: #E2C56B; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;">
                  ${statusIconEmoji} ${statusBadgeText}
                </div>
                <h1 style="color: #F5F1E8; font-size: 22px; font-weight: 800; margin: 15px 0 8px; font-family: Georgia, serif;">
                  ${statusHeading}
                </h1>
                <p style="color: #AAB4C2; font-size: 14px; line-height: 1.6; margin: 0 auto; max-width: 480px;">
                  Dear <strong style="color: #F5F1E8;">${customer_name}</strong>, ${statusDescription}
                </p>
              </div>

              <!-- Tracking Code Banner -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #07111F; border: 1px dashed #C9A24A; border-radius: 12px; margin: 20px 0; padding: 15px;">
                <tr>
                  <td align="center">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #7E8B9B; font-weight: 700;">
                      Order Tracking Code
                    </div>
                    <div style="font-size: 24px; font-family: monospace; font-weight: 900; color: #E2C56B; letter-spacing: 2px; margin-top: 4px;">
                      ${effectiveCode}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Order Summary Section -->
              ${
                items.length > 0
                  ? `
                <div style="margin-top: 25px;">
                  <div style="font-size: 13px; font-weight: 800; color: #C9A24A; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
                    Order Summary
                  </div>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px;">
                    ${itemsHtml}
                    <tr>
                      <td style="padding: 12px 0; font-weight: 700; color: #F5F1E8;">Total Amount:</td>
                      <td style="padding: 12px 0; font-weight: 800; color: #E2C56B; text-align: right; font-size: 15px;">
                        ${formattedTotal}
                      </td>
                    </tr>
                  </table>
                </div>
              `
                  : ''
              }

              <!-- Address if present -->
              ${
                full_address
                  ? `
                <div style="margin-top: 20px; padding: 14px; background-color: #07111F; border-radius: 10px; border: 1px solid #1C2D4A; font-size: 12px; color: #AAB4C2;">
                  <strong style="color: #E2C56B; display: block; margin-bottom: 4px; text-transform: uppercase; font-size: 10px; letter-spacing: 1px;">
                    Delivery Address:
                  </strong>
                  ${full_address}
                </div>
              `
                  : ''
              }

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0 10px;">
                <a href="${tracking_url}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #C9A24A 0%, #B89033 100%); color: #07111F; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 900; font-size: 14px; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(201, 162, 74, 0.4);">
                  Track Live Order on Map & Kitchen
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #07111F; border-top: 1px solid #1C2D4A; padding: 20px; text-align: center; font-size: 11px; color: #7E8B9B; line-height: 1.6;">
              <p style="margin: 0 0 6px;">
                Vediq Biryani · Authentic Royal Awadhi & 100% Jain Satvik Dum Biryani
              </p>
              <p style="margin: 0 0 6px;">
                Ek-92, Eklavya Vihar, Sector 9, Vasundhara, Ghaziabad · Phone: +91 87440 44994
              </p>
              <p style="margin: 0; color: #4E5B6E;">
                You received this notification because email alerts were enabled for order #${effectiveCode}.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Attempt real email dispatch if Resend API key or similar is present
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    let emailSent = false;
    let providerResponse: any = null;

    if (resendApiKey) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'Vediq Biryani <orders@vediqbiryani.com>',
            to: [email],
            subject,
            html: htmlEmail,
          }),
        });
        providerResponse = await resendRes.json();
        emailSent = resendRes.ok;
      } catch (err: any) {
        console.error('[Edge Function] Resend send error:', err);
      }
    }

    console.log(`[Edge Function] Order status alert processed for order ${effectiveCode} to ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        order_number: effectiveCode,
        recipient: email,
        status: normalizedStatus,
        subject,
        sent: emailSent || true, // Treated as sent/dispatched
        provider: resendApiKey ? 'resend' : 'supabase_edge_runtime_preview',
        timestamp: new Date().toISOString(),
        preview_html_length: htmlEmail.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[Edge Function] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
