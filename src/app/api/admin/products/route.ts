import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const searchParams = req.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const categoryId = searchParams.get('categoryId') || ''
  const brandId = searchParams.get('brandId') || ''
  const condition = searchParams.get('condition') || ''
  const status = searchParams.get('status') || ''

  const where: Prisma.ProductWhereInput = {}
  if (search) where.name = { contains: search, mode: 'insensitive' }
  if (categoryId) where.categoryId = categoryId
  if (brandId) where.brandId = brandId
  if (condition) where.condition = condition
  if (status === 'active') where.isActive = true
  if (status === 'inactive') where.isActive = false

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        brand: {
          select: { name: true, slug: true, categories: { include: { category: { select: { slug: true } } }, take: 1 } },
        },
        category: { select: { name: true } },
        _count: { select: { variants: true } },
      },
    }),
    prisma.product.count({ where }),
  ])

  return NextResponse.json({ products, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  // Check for duplicate
  const existing = await prisma.product.findUnique({
    where: { slug_condition: { slug, condition: body.condition || 'new' } },
  })

  if (existing) {
    return NextResponse.json(
      { error: `A product with this name already exists as "${body.condition || 'new'}" condition.` },
      { status: 409 }
    )
  }

  const product = await prisma.product.create({
    data: {
      name: body.name,
      slug,
      condition: body.condition || 'new',
      image: body.image || null,
      order: body.order || 0,
      brandId: body.brandId,
      categoryId: body.categoryId,
    },
  })
  return NextResponse.json(product)
}