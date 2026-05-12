import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      brands: {
        include: {
          brand: {
            select: { id: true, name: true, slug: true, image: true, isActive: true },
          },
        },
      },
    },
  })

  if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const brands = category.brands
    .map(cb => cb.brand)
    .filter(b => b.isActive)

  return NextResponse.json({ category: { id: category.id, name: category.name, slug: category.slug }, brands })
}