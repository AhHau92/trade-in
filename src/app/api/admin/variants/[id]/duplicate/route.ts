import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const original = await prisma.variant.findUnique({
    where: { id },
    include: {
      questions: { include: { overrides: true } },
    },
  })

  if (!original) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const newVariant = await prisma.variant.create({
    data: {
      name: `${original.name} (Copy)`,
      basePrice: original.basePrice,
      order: original.order + 1,
      productId: original.productId,
      questions: {
        create: original.questions.map(q => ({
          order: q.order,
          templateId: q.templateId,
          overrides: {
            create: q.overrides.map(o => ({
              templateOptionId: o.templateOptionId,
              priceAdjust: o.priceAdjust,
              isHidden: o.isHidden,
              isWhatsapp: o.isWhatsapp,
            })),
          },
        })),
      },
    },
  })

  return NextResponse.json(newVariant)
}