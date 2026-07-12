import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const variant = await prisma.variant.update({
    where: { id },
    data: { name: body.name, basePriceCents: body.basePriceCents, order: body.order, isActive: body.isActive },
  })
  return NextResponse.json(variant)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const bookingCount = await prisma.booking.count({ where: { variantId: id } })
  if (bookingCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${bookingCount} booking${bookingCount === 1 ? '' : 's'} reference this variant. Deactivate it instead if you don't want it shown.` },
      { status: 400 },
    )
  }

  await prisma.variant.delete({ where: { id } })
  return NextResponse.json({ success: true })
}