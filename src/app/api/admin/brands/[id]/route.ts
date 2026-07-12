import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Delete existing category relations then recreate
  await prisma.categoryBrand.deleteMany({ where: { brandId: id } })

  const brand = await prisma.brand.update({
    where: { id },
    data: {
      name: body.name,
      slug: body.name.toLowerCase().replace(/\s+/g, '-'),
      image: body.image || null,
      order: body.order || 0,
      isActive: body.isActive,
      categories: {
        create: body.categoryIds.map((catId: string) => ({ categoryId: catId })),
      },
    },
  })
  return NextResponse.json(brand)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const productCount = await prisma.product.count({ where: { brandId: id } })
  if (productCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${productCount} product${productCount === 1 ? '' : 's'} still belong to this brand. Move or delete them first, or deactivate the brand instead.` },
      { status: 400 },
    )
  }

  await prisma.brand.delete({ where: { id } })
  return NextResponse.json({ success: true })
}