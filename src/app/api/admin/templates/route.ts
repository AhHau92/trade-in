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

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const templates = await prisma.questionTemplate.findMany({
    orderBy: { order: 'asc' },
    include: { options: { orderBy: { order: 'asc' } }, _count: { select: { variants: true } } },
  })
  return NextResponse.json(templates)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const template = await prisma.questionTemplate.create({
    data: {
      title: body.title,
      order: body.order || 0,
      type: body.type === 'multi' ? 'multi' : 'single',
      helpText: body.helpText || null,
      options: {
        create: (body.options || []).map((opt: IncomingTemplateOption, i: number) => ({
          label: opt.label,
          priceAdjustCents: opt.priceAdjustCents || 0,
          isWhatsapp: opt.isWhatsapp || false,
          imageUrl: opt.imageUrl || null,
          description: opt.description || null,
          defaultChecked: opt.defaultChecked || false,
          order: i,
        })),
      },
    },
    include: { options: true },
  })
  return NextResponse.json(template)
}