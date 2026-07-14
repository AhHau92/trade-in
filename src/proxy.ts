import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Renamed from middleware.ts per Next.js 16's file-convention rename
// (the old `middleware.ts` name is deprecated but still works — this is a
// pure rename, no behavior change). This is a lightweight gate: it only
// checks that a valid session JWT exists and redirects to /admin/login if
// not. It intentionally does NOT do role checks or DB lookups here — those
// stay in the actual admin API routes/Server Components, which already call
// getServerSession() themselves for the real authorization decision.
export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request })
  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/dashboard/:path*',
    '/admin/categories/:path*',
    '/admin/brands/:path*',
    '/admin/products/:path*',
    '/admin/bookings/:path*',
    '/admin/settings/:path*',
    '/admin/admins/:path*',
    '/admin/branches/:path*',
    '/admin/templates/:path*',
  ],
}
