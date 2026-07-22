import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const booking = await prisma.booking.update({
    where: { id },
    data: { status: body.status },
  })
  return NextResponse.json(booking)
}

// Bookings previously had no delete path at all — status could only be
// changed, never removed. Added so stray test/seed bookings (created while
// developing/QA-ing locally) can be cleared out without leaving permanent
// clutter in a real deployment's booking history.
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.booking.delete({ where: { id } })
  return NextResponse.json({ success: true })
}