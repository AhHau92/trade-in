import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type IncomingTemplateOption = {
  id?: string
  label: string
  priceAdjustCents?: number
  isWhatsapp?: boolean
  imageUrl?: string
  description?: string
  defaultChecked?: boolean
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const template = await prisma.questionTemplate.findUnique({
    where: { id },
    include: { options: { orderBy: { order: 'asc' } } },
  })
  return NextResponse.json(template)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const incomingOptions: IncomingTemplateOption[] = body.options || []

  // Incrementally sync options instead of delete-all-then-recreate. Recreating
  // options assigns them brand-new IDs, which cascade-deletes any
  // VariantQuestionOverride rows pointing at the old IDs — i.e. every save
  // (including just flipping isActive) silently wiped per-variant price
  // overrides. Updating options in place keeps their IDs stable, only
  // deleting options the admin actually removed.
  const existingOptions = await prisma.questionTemplateOption.findMany({
    where: { templateId: id },
    select: { id: true },
  })
  const existingIds = new Set(existingOptions.map((o) => o.id))
  const incomingIds = new Set(incomingOptions.filter((o) => o.id).map((o) => o.id))
  const idsToDelete = [...existingIds].filter((eid) => !incomingIds.has(eid))

  await prisma.$transaction([
    ...(idsToDelete.length > 0
      ? [prisma.questionTemplateOption.deleteMany({ where: { id: { in: idsToDelete } } })]
      : []),
    ...incomingOptions.map((opt, i) =>
      opt.id && existingIds.has(opt.id)
        ? prisma.questionTemplateOption.update({
            where: { id: opt.id },
            data: {
              label: opt.label,
              priceAdjustCents: opt.priceAdjustCents || 0,
              isWhatsapp: opt.isWhatsapp || false,
              imageUrl: opt.imageUrl || null,
              description: opt.description || null,
              defaultChecked: opt.defaultChecked || false,
              order: i,
            },
          })
        : prisma.questionTemplateOption.create({
            data: {
              label: opt.label,
              priceAdjustCents: opt.priceAdjustCents || 0,
              isWhatsapp: opt.isWhatsapp || false,
              imageUrl: opt.imageUrl || null,
              description: opt.description || null,
              defaultChecked: opt.defaultChecked || false,
              order: i,
              templateId: id,
            },
          }),
    ),
    prisma.questionTemplate.update({
      where: { id },
      data: {
        title: body.title,
        order: body.order || 0,
        isActive: body.isActive,
        type: body.type === 'multi' ? 'multi' : 'single',
        helpText: body.helpText || null,
      },
    }),
  ])

  const template = await prisma.questionTemplate.findUnique({
    where: { id },
    include: { options: { orderBy: { order: 'asc' } } },
  })
  return NextResponse.json(template)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const usageCount = await prisma.variantQuestion.count({ where: { templateId: id } })
  if (usageCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: this template is assigned to ${usageCount} product variant${usageCount === 1 ? '' : 's'}. Remove it from those variants first, or deactivate the template instead.` },
      { status: 400 },
    )
  }

  await prisma.questionTemplate.delete({ where: { id } })
  return NextResponse.json({ success: true })
}