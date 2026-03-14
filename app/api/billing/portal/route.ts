/**
 * POST /api/billing/portal
 * Creates a Stripe Billing Portal session.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createBillingPortalSession } from '@/lib/stripe/client'

export async function POST(request: NextRequest) {
  try {
    const { customerId }: { customerId: string } = await request.json()

    if (!customerId) {
      return NextResponse.json(
        { error: { message: 'Missing customerId', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL!

    const portalUrl = await createBillingPortalSession({
      customerId,
      returnUrl: `${baseUrl}/billing`,
    })

    return NextResponse.json({ url: portalUrl, error: null })
  } catch (err) {
    console.error('[BillingPortal] Error:', err)
    return NextResponse.json(
      { error: { message: 'Failed to open billing portal', code: 'SERVER_ERROR' } },
      { status: 500 }
    )
  }
}
