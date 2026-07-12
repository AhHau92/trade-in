import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const category = await prisma.category.update({
    where: { id },
    data: {
      name: body.name,
      slug: body.name.toLowerCase().replace(/\s+/g, '-'),
      image: body.image || null,
      order: body.order || 0,
      isActive: body.isActive,
    },
  })
  return NextResponse.json(category)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const productCount = await prisma.product.count({ where: { categoryId: id } })
  if (productCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${productCount} product${productCount === 1 ? '' : 's'} still belong to this category. Move or delete them first, or deactivate the category instead.` },
      { status: 400 },
    )
  }

  await prisma.category.delete({ where: { id } })
  return NextResponse.json({ success: true })
}