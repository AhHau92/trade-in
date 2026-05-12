import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const brands = await prisma.brand.findMany({
    orderBy: { order: 'asc' },
    include: {
      categories: { include: { category: { select: { id: true, name: true } } } },
      _count: { select: { products: true } },
    },
  })
  return NextResponse.json(brands)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const brand = await prisma.brand.create({
    data: {
      name: body.name,
      slug: body.name.toLowerCase().replace(/\s+/g, '-'),
      image: body.image || null,
      order: body.order || 0,
      categories: {
        create: body.categoryIds.map((id: string) => ({ categoryId: id })),
      },
    },
  })
  return NextResponse.json(brand)
}