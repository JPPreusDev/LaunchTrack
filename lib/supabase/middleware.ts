/**
 * Supabase middleware client — session refresh + subdomain/custom-domain portal routing.
 *
 * Routing modes:
 *   myagency.onrampd.com  →  sets x-portal-org header, rewrites / to /portal/login
 *   myagency.com (CNAME'd)    →  same, after DB lookup for verified custom domain
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SYSTEM_SUBDOMAINS = new Set(['www', 'app', 'api', 'studio'])

/**
 * Detects the portal org slug from the incoming hostname.
 * Returns the org slug if this request comes from a portal domain, null otherwise.
 */
async function detectPortalOrg(request: NextRequest): Promise<string | null> {
  const hostname = request.headers.get('host') ?? ''
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'localhost:3000'

  // Step A: subdomain of appDomain → O(1), no network call
  const escapedDomain = appDomain.replace(/\./g, '\\.')
  const subdomainRegex = new RegExp(`^([^.]+)\\.${escapedDomain}$`)
  const subdomainMatch = hostname.match(subdomainRegex)
  if (subdomainMatch && !SYSTEM_SUBDOMAINS.has(subdomainMatch[1])) {
    return subdomainMatch[1]
  }

  // Step B: custom domain → 1 Supabase REST fetch (only for non-appDomain hosts)
  if (hostname !== appDomain && hostname !== `www.${appDomain}`) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
      const res = await fetch(
        `${supabaseUrl}/rest/v1/organizations?custom_domain=eq.${encodeURIComponent(hostname)}&custom_domain_verified=eq.true&select=slug`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        }
      )
      if (res.ok) {
        const data: Array<{ slug: string }> = await res.json()
        if (data.length > 0) return data[0].slug
      }
    } catch {
      // Fail open — don't block requests if the lookup fails
    }
  }

  return null
}

export async function updateSession(request: NextRequest) {
  const portalOrgSlug = await detectPortalOrg(request)

  // Build request headers — forward portal slug to server components via x-portal-org
  const requestHeaders = new Headers(request.headers)
  if (portalOrgSlug) {
    requestHeaders.set('x-portal-org', portalOrgSlug)
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: object }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Preserve custom request headers when recreating the response
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const publicRoutes = [
    '/login',
    '/register',
    '/invite',
    '/forgot-password',
    '/reset-password',
    '/portal',
    '/api/webhooks',
    '/api/integrations',
    '/api/contact',
    '/api/intake-forms',
    '/api/csat',
    '/api/portal/resend-magic-link',
    // Marketing site routes (no auth required)
    '/features',
    '/pricing',
    '/use-cases',
    '/how-it-works',
    '/integrations',
    '/about',
    '/contact',
    '/changelog',
    '/legal',
  ]

  // Root path is the marketing homepage when not on a portal domain
  const isMarketingRoot = pathname === '/' && !portalOrgSlug
  const isPublicRoute = isMarketingRoot || publicRoutes.some((route) => pathname.startsWith(route))

  if (!user && !isPublicRoute) {
    if (portalOrgSlug && pathname === '/') {
      // Portal domain root — rewrite to /portal/login so the URL stays clean
      const url = request.nextUrl.clone()
      url.pathname = '/portal/login'
      const rewriteResponse = NextResponse.rewrite(url, {
        request: { headers: requestHeaders },
      })
      // Forward any session cookies set during the getUser() call
      supabaseResponse.cookies.getAll().forEach((c) =>
        rewriteResponse.cookies.set(c.name, c.value)
      )
      return rewriteResponse
    }

    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Authenticated user on a portal domain: keep them in the portal, not the agency dashboard
  if (user && portalOrgSlug && (pathname === '/portal/login' || pathname === '/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/portal/dashboard'
    return NextResponse.redirect(url)
  }

  // Authenticated user on normal auth pages: send to appropriate dashboard
  if (user && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
