/**
 * GET /api/cron/automation
 * Called by Vercel Cron or external scheduler to run the automation engine.
 * Schedule: Every hour (0 * * * *)
 */
import { NextRequest, NextResponse } from 'next/server'
import { runAutomationEngine } from '@/services/automation/engine'

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized invocations
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await runAutomationEngine()
    return NextResponse.json({ success: true, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error('[Cron] Automation engine failed:', err)
    return NextResponse.json({ error: 'Automation engine failed' }, { status: 500 })
  }
}
