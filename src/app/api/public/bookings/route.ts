import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendBookingNotification } from '@/lib/email'
import { resolveBookingPricing } from '@/lib/bookingPricing'

// SECURITY: This endpoint is public (no auth) and previously trusted
// client-submitted finalPrice/selectedOptions/productName/variantName
// verbatim. A customer could edit those values in DevTools and get any
// price they wanted. Every price-affecting input is now re-derived from
// the database via resolveBookingPricing() (shared with the /quote
// endpoint); the client only tells us WHICH variant/options/appointment
// type it wants, never what they're worth.

export async function POST(req: NextRequest) {
  const body = await req.json()

  for (const field of ['name', 'email', 'phone', 'postcode']) {
    if (!body[field] || typeof body[field] !== 'string') {
      return NextResponse.json({ error: `Missing ${field}` }, { status: 400 })
    }
  }
  if (body.appointmentType === 'store' && !body.branchId) {
    return NextResponse.json({ error: 'Missing branchId for store visit' }, { status: 400 })
  }

  const pricing = await resolveBookingPricing({
    variantId: body.variantId,
    appointmentType: body.appointmentType,
    selectedOptions: body.selectedOptions,
  })

  if (!pricing.ok) {
    return NextResponse.json({ error: pricing.error }, { status: pricing.status })
  }

  // ---- Generate booking reference ----
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const count = await prisma.booking.count({ where: { createdAt: { gte: startOfDay } } })
  const bookingRef = `TI-${dateStr}-${String(count + 1).padStart(3, '0')}`

  const booking = await prisma.booking.create({
    data: {
      bookingRef,
      appointmentType: body.appointmentType,
      variantId: pricing.variantId,
      productName: pricing.productName,
      variantName: pricing.variantName,
      finalPrice: pricing.finalPrice,
      selectedOptions: pricing.resolvedSelections,
      name: body.name,
      email: body.email,
      phone: body.phone,
      postcode: body.postcode,
      branchId: body.appointmentType === 'store' ? (body.branchId || null) : null,
      visitDate: body.appointmentType === 'store' && body.visitDate ? new Date(body.visitDate) : null,
      address: body.appointmentType === 'pickup' ? (body.address || null) : null,
      collectionDate: body.appointmentType === 'pickup' && body.collectionDate ? new Date(body.collectionDate) : null,
      collectionTime: body.appointmentType === 'pickup' ? (body.collectionTime || null) : null,
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
        selectedOptions: booking.selectedOptions,
      }, settings.notifyEmail)
    }
  } catch (error) {
    console.error('Email send failed:', error)
  }

  return NextResponse.json(booking)
}
