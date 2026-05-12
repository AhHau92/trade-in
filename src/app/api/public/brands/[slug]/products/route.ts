import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const categorySlug = req.nextUrl.searchParams.get('category')

  const brand = await prisma.brand.findUnique({ where: { slug } })
  if (!brand) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const where: any = { isActive: true, brandId: brand.id }
  if (categorySlug) {
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } })
    if (category) where.categoryId = category.id
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, name: true, slug: true, image: true, condition: true },
  })

  return NextResponse.json({ brand: { id: brand.id, name: brand.name, slug: brand.slug }, products })
}