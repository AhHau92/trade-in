import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: variantId } = await params
  const questions = await prisma.variantQuestion.findMany({
    where: { variantId },
    orderBy: { order: 'asc' },
    include: { template: { include: { options: { orderBy: { order: 'asc' } } } } },
  })
  return NextResponse.json(questions)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: variantId } = await params
  const body = await req.json()

  const vq = await prisma.variantQuestion.create({
    data: { variantId, templateId: body.templateId, order: body.order || 0 },
    include: { template: { include: { options: true } } },
  })
  return NextResponse.json(vq)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: variantId } = await params
  const body = await req.json()
  await prisma.variantQuestion.delete({
    where: { variantId_templateId: { variantId, templateId: body.templateId } },
  })
  return NextResponse.json({ success: true })
}