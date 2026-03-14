/**
 * POST /api/billing/checkout
 * Creates a Stripe Checkout session for plan upgrade.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe/client'
import type { SubscriptionPlan } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: {
      plan: SubscriptionPlan
      organizationId: string
      userEmail: string
    } = await request.json()

    if (!body.plan || !body.organizationId) {
      return NextResponse.json(
        { error: { message: 'Missing required fields', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    // Verify auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    // Verify user belongs to this organization and is admin
    const { data: profile } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (
      !profile ||
      profile.organization_id !== body.organizationId ||
      profile.role !== 'org_admin'
    ) {
      return NextResponse.json(
        { error: { message: 'Forbidden', code: 'FORBIDDEN' } },
        { status: 403 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL!

    const checkoutUrl = await createCheckoutSession({
      organizationId: body.organizationId,
      plan: body.plan,
      customerEmail: body.userEmail,
      successUrl: `${baseUrl}/billing?success=true`,
      cancelUrl: `${baseUrl}/billing`,
    })

    return NextResponse.json({ url: checkoutUrl, error: null })
  } catch (err) {
    console.error('[Checkout] Error:', err)
    return NextResponse.json(
      { error: { message: 'Failed to create checkout session', code: 'SERVER_ERROR' } },
      { status: 500 }
    )
  }
}
