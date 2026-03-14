/**
 * POST /api/webhooks/stripe
 * Handles Stripe subscription webhook events.
 */
import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent, PLAN_FROM_PRICE_ID } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = constructWebhookEvent(body, signature)
  } catch (err) {
    console.error('[Stripe Webhook] Invalid signature:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const organizationId = session.metadata?.organization_id
        const plan = session.metadata?.plan

        if (!organizationId || !plan) break

        await supabase
          .from('organizations')
          .update({
            plan,
            subscription_status: 'active',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq('id', organizationId)

        console.log(`[Stripe] Checkout complete for org ${organizationId}, plan: ${plan}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const organizationId = subscription.metadata?.organization_id

        if (!organizationId) break

        const priceId = subscription.items.data[0]?.price.id
        const plan = PLAN_FROM_PRICE_ID[priceId] ?? 'starter'

        await supabase
          .from('organizations')
          .update({
            plan,
            subscription_status: subscription.status,
          })
          .eq('id', organizationId)

        await supabase
          .from('subscriptions')
          .upsert({
            organization_id: organizationId,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            plan,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .match({ stripe_subscription_id: subscription.id })

        console.log(`[Stripe] Subscription updated for org ${organizationId}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const organizationId = subscription.metadata?.organization_id

        if (!organizationId) break

        await supabase
          .from('organizations')
          .update({
            subscription_status: 'canceled',
            plan: 'starter',
          })
          .eq('id', organizationId)

        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        console.log(`[Stripe] Subscription canceled for org ${organizationId}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await supabase
          .from('organizations')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', customerId)

        console.log(`[Stripe] Payment failed for customer ${customerId}`)
        break
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event: ${event.type}`)
    }
  } catch (err) {
    console.error('[Stripe Webhook] Handler error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
