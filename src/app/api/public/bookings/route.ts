import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendBookingNotification } from '@/lib/email'
import { resolveBookingPricing } from '@/lib/bookingPricing'
import { publicBookingSchema, firstZodError } from '@/schemas/booking'
import { readJsonBody } from '@/lib/readJsonBody'

// SECURITY: This endpoint is public (no auth) and previously trusted
// client-submitted finalPriceCents/selectedOptions/productName/variantName
// verbatim, and had no real input validation at all. Every price-affecting
// input is now re-derived from the database via resolveBookingPricing()
// (shared with the /quote endpoint), and every field is validated with Zod
// (src/schemas/booking.ts) before it ever reaches Prisma.

export async function POST(req: NextRequest) {
  const parsedBody = await readJsonBody(req)
  if (!parsedBody.ok) return parsedBody.response

  const parsed = publicBookingSchema.safeParse(parsedBody.body)
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 })
  }
  const data = parsed.data

  const pricing = await resolveBookingPricing({
    variantId: data.variantId,
    appointmentType: data.appointmentType,
    selectedOptions: data.selectedOptions,
  })

  if (!pricing.ok) {
    return NextResponse.json({ error: pricing.error }, { status: pricing.status })
  }

  if (data.appointmentType === 'store') {
    const branch = await prisma.branch.findUnique({ where: { id: data.branchId } })
    if (!branch || !branch.isActive) {
      return NextResponse.json({ error: 'Selected branch is not available' }, { status: 400 })
    }
  }

  // ---- Generate booking reference + create the booking ----
  // The old version did `prisma.booking.count(...)` outside any lock, so two
  // concurrent requests on the same day could read the same count and both
  // generate e.g. TI-20260712-011, then the second insert would 500 on the
  // unique constraint. A per-day counter row, advanced via upsert, fixes
  // that: Postgres serializes concurrent upserts on the same primary key
  // (`date`) via row-level locking, so no two requests can ever be handed
  // the same count.
  //
  // IMPORTANT: the counter upsert and the booking insert are deliberately
  // NOT wrapped in one $transaction. If they were, a bookingRef collision
  // (e.g. against a pre-existing/legacy row) would roll back the counter
  // increment along with the failed insert — so a retry would recompute the
  // exact same doomed number and collide forever. Keeping them as separate
  // statements means a collision only costs a burned counter value (a small
  // gap in the sequence), and each retry is guaranteed to move forward.
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')

  const bookingData = {
    appointmentType: data.appointmentType,
    variantId: pricing.variantId,
    productName: pricing.productName,
    variantName: pricing.variantName,
    finalPriceCents: pricing.finalPriceCents,
    selectedOptions: pricing.resolvedSelections,
    name: data.name,
    email: data.email,
    phone: data.phone,
    postcode: data.postcode,
    branchId: data.appointmentType === 'store' ? data.branchId : null,
    visitDate: data.appointmentType === 'store' ? new Date(`${data.visitDate}T00:00:00`) : null,
    address: data.appointmentType === 'pickup' ? data.address : null,
    collectionDate: data.appointmentType === 'pickup' ? new Date(`${data.collectionDate}T00:00:00`) : null,
    collectionTime: data.appointmentType === 'pickup' ? data.collectionTime : null,
  }

  const createWithFreshRef = async () => {
    const counter = await prisma.dailyBookingCounter.upsert({
      where: { date: dateStr },
      create: { date: dateStr, count: 1 },
      update: { count: { increment: 1 } },
    })
    const bookingRef = `TI-${dateStr}-${String(counter.count).padStart(3, '0')}`
    return prisma.booking.create({
      data: { ...bookingData, bookingRef },
      include: {
        variant: { include: { product: { select: { name: true } } } },
        branch: { select: { name: true } },
      },
    })
  }

  let booking: Awaited<ReturnType<typeof createWithFreshRef>> | undefined
  let lastError: unknown
  const MAX_ATTEMPTS = 10
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      booking = await createWithFreshRef()
      break
    } catch (err: unknown) {
      lastError = err
      if ((err as { code?: string })?.code !== 'P2002') throw err
      // bookingRef collision (e.g. a pre-existing row from before this
      // counter existed) — the counter has already moved forward, so just
      // try again with the next number.
    }
  }
  if (!booking) throw lastError

  // Send email notification
  try {
    const settings = await prisma.settings.findFirst()
    if (settings?.notifyEmail) {
      await sendBookingNotification({
        bookingRef: booking.bookingRef,
        productName: booking.variant.product.name,
        variantName: booking.variant.name,
        finalPriceCents: booking.finalPriceCents,
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
