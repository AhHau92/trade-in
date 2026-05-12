import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      brand: { select: { name: true } },
      category: { select: { name: true } },
      variants: {
        orderBy: { order: 'asc' },
        include: {
          questions: {
            include: {
              template: { include: { options: { orderBy: { order: 'asc' } } } },
              overrides: true,
            },
          },
        },
      },
    },
  })

  if (product) {
    product.variants.forEach(v => {
      v.questions.sort((a: any, b: any) => a.template.order - b.template.order)
    })
  }

  return NextResponse.json(product)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: body.name,
      slug,
      condition: body.condition,
      variantLabel: body.variantLabel || 'Device Built-In Storage',
      image: body.image || null,
      order: body.order || 0,
      isActive: body.isActive,
      brandId: body.brandId,
      categoryId: body.categoryId,
    },
  })
  return NextResponse.json(product)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ success: true })
}