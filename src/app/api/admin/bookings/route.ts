import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const searchParams = req.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status') || ''
  const search = searchParams.get('search') || ''

  const where: any = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { bookingRef: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        variant: { include: { product: { select: { name: true } } } },
        branch: { select: { name: true } },
      },
    }),
    prisma.booking.count({ where }),
  ])

  return NextResponse.json({ bookings, total, page, limit, totalPages: Math.ceil(total / limit) })
}
