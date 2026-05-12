import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const condition = req.nextUrl.searchParams.get('condition') || 'new'

  const product = await prisma.product.findUnique({
    where: { slug_condition: { slug, condition } },
    include: {
      brand: { select: { name: true, slug: true } },
      variants: {
        where: { isActive: true },
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

  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  product.variants.forEach(v => {
    v.questions.sort((a: any, b: any) => a.template.order - b.template.order)
  })

  return NextResponse.json(product)
}