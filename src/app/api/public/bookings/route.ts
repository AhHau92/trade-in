import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  const count = await prisma.booking.count({ where: { createdAt: { gte: new Date(today.setHours(0, 0, 0, 0)) } } })
  const bookingRef = `TI-${dateStr}-${String(count + 1).padStart(3, '0')}`

  const booking = await prisma.booking.create({
    data: {
      bookingRef,
      appointmentType: body.appointmentType,
      variantId: body.variantId,
      finalPrice: body.finalPrice,
      selectedOptions: body.selectedOptions,
      name: body.name,
      email: body.email,
      phone: body.phone,
      postcode: body.postcode,
      branchId: body.branchId || null,
      visitDate: body.visitDate ? new Date(body.visitDate) : null,
      address: body.address || null,
      collectionDate: body.collectionDate ? new Date(body.collectionDate) : null,
      collectionTime: body.collectionTime || null,
    },
  })

  return NextResponse.json(booking)
}