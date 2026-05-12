import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
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