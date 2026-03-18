/**
 * Stripe client and helpers for Rampify billing.
 */
import Stripe from 'stripe'
import { type SubscriptionPlan } from '@/types'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
})

export const PRICE_IDS: Record<SubscriptionPlan, string> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID!,
  growth: process.env.STRIPE_GROWTH_PRICE_ID!,
  scale: process.env.STRIPE_SCALE_PRICE_ID!,
}

export const PLAN_FROM_PRICE_ID: Record<string, SubscriptionPlan> = {
  [process.env.STRIPE_STARTER_PRICE_ID!]: 'starter',
  [process.env.STRIPE_GROWTH_PRICE_ID!]: 'growth',
  [process.env.STRIPE_SCALE_PRICE_ID!]: 'scale',
}

/**
 * Create a Stripe checkout session for a subscription.
 */
export async function createCheckoutSession({
  organizationId,
  plan,
  customerEmail,
  successUrl,
  cancelUrl,
}: {
  organizationId: string
  plan: SubscriptionPlan
  customerEmail: string
  successUrl: string
  cancelUrl: string
}): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: PRICE_IDS[plan],
        quantity: 1,
      },
    ],
    customer_email: customerEmail,
    metadata: {
      organization_id: organizationId,
      plan,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        organization_id: organizationId,
        plan,
      },
    },
  })

  return session.url!
}

/**
 * Create a Stripe billing portal session for managing subscriptions.
 */
export async function createBillingPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string
  returnUrl: string
}): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session.url
}

/**
 * Validate Stripe webhook signature.
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
}
