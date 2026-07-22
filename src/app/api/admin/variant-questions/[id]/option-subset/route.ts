import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Configures which of a template's options this specific variant-question
// actually offers (e.g. a variant that only offers 5 of a template's 200
// colour options). Body: { optionsConfigured: boolean, optionIds: string[] }.
// optionsConfigured: false resets to "show all" (legacy behavior) and clears
// any stored subset rows — optionIds is ignored in that case.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: variantQuestionId } = await params
  const body = await req.json()
  const optionsConfigured = Boolean(body.optionsConfigured)
  const optionIds: string[] = optionsConfigured && Array.isArray(body.optionIds) ? body.optionIds : []

  await prisma.$transaction([
    prisma.variantQuestionOption.deleteMany({ where: { variantQuestionId } }),
    ...optionIds.map((optionId, i) =>
      prisma.variantQuestionOption.create({
        data: { variantQuestionId, templateOptionId: optionId, order: i },
      }),
    ),
    prisma.variantQuestion.update({
      where: { id: variantQuestionId },
      data: { optionsConfigured },
    }),
  ])

  const updated = await prisma.variantQuestion.findUnique({
    where: { id: variantQuestionId },
    include: { options: true },
  })
  return NextResponse.json(updated)
}
