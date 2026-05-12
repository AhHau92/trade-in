import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const categories = await prisma.category.findMany({
    orderBy: { order: 'asc' },
    include: { _count: { select: { brands: true } } },
  })
  return NextResponse.json(categories)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const category = await prisma.category.create({
    data: {
      name: body.name,
      slug: body.name.toLowerCase().replace(/\s+/g, '-'),
      image: body.image || null,
      order: body.order || 0,
    },
  })
  return NextResponse.json(category)
}