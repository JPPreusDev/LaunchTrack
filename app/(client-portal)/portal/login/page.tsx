/**
 * White-labeled client portal login page — server component wrapper.
 *
 * Resolves orgSlug from:
 *   1. x-portal-org header (set by middleware for subdomain/custom domain access)
 *   2. ?org= search param (direct URL: /portal/login?org=myagency)
 *
 * Passes orgSlug down to the client component to avoid useSearchParams() issues.
 */
import { headers } from 'next/headers'
import { PortalLoginClient } from './PortalLoginClient'

export default async function PortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>
}) {
  const h = await headers()
  const orgFromHeader = h.get('x-portal-org')
  const { org: orgFromParams } = await searchParams
  const orgSlug = orgFromParams ?? orgFromHeader ?? null

  return <PortalLoginClient orgSlug={orgSlug} />
}
