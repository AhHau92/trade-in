import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

  // Delete existing options and recreate
  await prisma.questionTemplateOption.deleteMany({ where: { templateId: id } })

  const template = await prisma.questionTemplate.update({
    where: { id },
    data: {
      title: body.title,
      order: body.order || 0,
      isActive: body.isActive,
      options: {
        create: (body.options || []).map((opt: any, i: number) => ({
          label: opt.label,
          priceAdjust: opt.priceAdjust || 0,
          isWhatsapp: opt.isWhatsapp || false,
          order: i,
        })),
      },
    },
    include: { options: true },
  })
  return NextResponse.json(template)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.questionTemplate.delete({ where: { id } })
  return NextResponse.json({ success: true })
}