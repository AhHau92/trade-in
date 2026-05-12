import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: variantQuestionId } = await params
  const body = await req.json()

  // Delete existing overrides and recreate
  await prisma.variantQuestionOverride.deleteMany({ where: { variantQuestionId } })

  const overrides = await Promise.all(
    body.overrides.map((o: any) =>
      prisma.variantQuestionOverride.create({
        data: {
          variantQuestionId,
          templateOptionId: o.templateOptionId,
          priceAdjust: o.priceAdjust,
          isHidden: o.isHidden || false,
          isWhatsapp: o.isWhatsapp || false,
        },
      })
    )
  )

  return NextResponse.json(overrides)
}