// src/services/stripeService.js
// Stripe Checkout integration for NOTARYFIX.
//
// Uses the Stripe REST API directly from the browser (no backend required).
// The secret key is stored only in the user's browser localStorage via app
// Settings → Payments. It is never sent to any server other than Stripe directly.
//
// SECURITY NOTE: This is designed for a single-operator notary tool where the
// Stripe account belongs to the same person running the app.
// Never share your secret key or use this pattern in a multi-user environment.

const STRIPE_API = 'https://api.stripe.com/v1';

/**
 * Creates a Stripe Checkout Session for a given invoice.
 * Returns the Stripe-hosted checkout URL to redirect the client to.
 *
 * @param {Object} invoice  - { id, client, amount, due, notes }
 * @param {Object} settings - { stripeSecretKey, businessName }
 * @returns {Promise<string>} The Stripe-hosted checkout page URL
 */
export async function createStripeCheckoutSession(invoice, settings) {
  const secretKey = settings?.stripeSecretKey?.trim();

  if (!secretKey) {
    throw new Error(
      'Stripe secret key not configured. Go to Settings → Payments to add it.'
    );
  }
  if (!secretKey.startsWith('sk_')) {
    throw new Error(
      'Invalid Stripe secret key format. Keys start with sk_live_ or sk_test_.'
    );
  }

  const amount = Math.round(Number(invoice.amount || 0) * 100); // Stripe uses cents
  if (amount <= 0) {
    throw new Error(
      'Invoice amount must be greater than $0 to create a Stripe checkout.'
    );
  }

  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://app.notaryfix.com';

  const invoiceId = encodeURIComponent(invoice.id);
  const clientName = invoice.client || 'Client';
  const productName = `Notary Services — ${clientName}`;
  const productDesc = invoice.notes || `Invoice #${invoice.id}`;

  const params = new URLSearchParams({
    'payment_method_types[]': 'card',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': String(amount),
    'line_items[0][price_data][product_data][name]': productName,
    'line_items[0][price_data][product_data][description]': productDesc,
    'line_items[0][quantity]': '1',
    mode: 'payment',
    client_reference_id: invoice.id,
    'success_url': `${origin}/pay/${invoiceId}?stripe_success=1`,
    'cancel_url': `${origin}/pay/${invoiceId}`,
    'metadata[invoice_id]': invoice.id,
    'metadata[app]': 'notaryfix',
  });

  const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message || `Stripe API error ${res.status}`
    );
  }

  const session = await res.json();
  return session.url;
}

/**
 * Returns true when the user has fully configured Stripe in settings.
 * Requires stripeEnabled flag AND a valid-looking secret key.
 */
export function isStripeConfigured(settings) {
  return !!(
    settings?.stripeEnabled &&
    settings?.stripeSecretKey?.trim().startsWith('sk_')
  );
}
