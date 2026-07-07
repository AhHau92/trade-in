import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendBookingNotification } from '@/lib/email'

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
    include: {
      variant: { include: { product: { select: { name: true } } } },
      branch: { select: { name: true } },
    },
  })

  // Send email notification
  try {
    const settings = await prisma.settings.findFirst()
    if (settings?.notifyEmail) {
      await sendBookingNotification({
        bookingRef: booking.bookingRef,
        productName: booking.variant.product.name,
        variantName: booking.variant.name,
        finalPrice: booking.finalPrice,
        currency: settings.currency,
        appointmentType: booking.appointmentType,
        customerName: booking.name,
        customerEmail: booking.email,
        customerPhone: booking.phone,
        postcode: booking.postcode,
        branchName: booking.branch?.name,
        visitDate: booking.visitDate?.toLocaleDateString(),
        address: booking.address || undefined,
        collectionDate: booking.collectionDate?.toLocaleDateString(),
        collectionTime: booking.collectionTime || undefined,
        selectedOptions: body.selectedOptions,
      }, settings.notifyEmail)
    }
  } catch (error) {
    console.error('Email send failed:', error)
  }

  return NextResponse.json(booking)
}