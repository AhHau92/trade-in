import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { slugify } from '@/lib/slug'

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
          select: {
            name: true, slug: true,
            // orderBy here isn't just cosmetic like the badge-list cases
            // elsewhere — `take: 1` means whichever join row Postgres
            // returns first becomes THE category used to build this
            // product's storefront preview link, so without an explicit
            // order that pick was arbitrary (and could silently point the
            // "View" link at the wrong category for a multi-category brand).
            categories: { orderBy: { category: { order: 'asc' } }, include: { category: { select: { slug: true } } }, take: 1 },
          },
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
  // The slug field is now editable in the admin form (with a "sync from
  // name" button) — if the admin supplied one, clean and use it; otherwise
  // fall back to deriving it from the name like before.
  const slug = body.slug ? slugify(body.slug) : slugify(body.name)

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

  // The Add Product form doesn't expose an order field (product order is
  // managed on the dedicated /admin/products/order drag page), so it never
  // sends one — this used to fall through to a hardcoded 0. That silently
  // put every newly created product ahead of a brand's existing lineup
  // (both on that reorder page and in the storefront's per-brand product
  // list) instead of appending it at the end. Default to one past the
  // current global max instead, so a new product always sorts after every
  // existing one until an admin deliberately drags it elsewhere.
  let order = body.order
  if (order === undefined || order === null) {
    const { _max } = await prisma.product.aggregate({ _max: { order: true } })
    order = (_max.order ?? -1) + 1
  }

  const product = await prisma.product.create({
    data: {
      name: body.name,
      slug,
      condition: body.condition || 'new',
      image: body.image || null,
      order,
      isActive: body.isActive ?? true,
      brandId: body.brandId,
      categoryId: body.categoryId,
      variantLabel: body.variantLabel || 'Device Built-In Storage',
      variantLabel2: body.variantLabel2 || null,
      introContent: body.introContent || null,
      seoContent: body.seoContent || null,
      metaTitle: body.metaTitle || null,
      metaDescription: body.metaDescription || null,
    },
  })
  return NextResponse.json(product)
}