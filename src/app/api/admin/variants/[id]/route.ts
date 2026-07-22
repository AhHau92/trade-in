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
    data: {
      name: body.name,
      axis2Value: body.axis2Value || null,
      basePriceCents: body.basePriceCents,
      order: body.order,
      isActive: body.isActive,
      isWhatsappOnly: body.isWhatsappOnly ?? false,
    },
  })
  return NextResponse.json(variant)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Booking.variantId is ON DELETE SET NULL (see schema.prisma), so deleting
  // this variant just detaches any bookings that referenced it — their
  // productName/variantName/branchName snapshots and full history are
  // untouched. No pre-check needed here anymore.
  await prisma.variant.delete({ where: { id } })
  return NextResponse.json({ success: true })
}