import { NextRequest, NextResponse } from 'next/server'
import { resolveBookingPricing } from '@/lib/bookingPricing'
import { bookingQuoteSchema, firstZodError } from '@/schemas/booking'
import { readJsonBody } from '@/lib/readJsonBody'

// Price-preview endpoint: validates the customer's selections and returns
// the authoritative server price WITHOUT creating a booking. The booking
// page calls this right before submitting so it can show the customer a
// "price has changed" confirmation if the server price differs from what
// they saw while browsing, instead of either silently booking at a
// different price or hard-rejecting a legitimate customer.
export async function POST(req: NextRequest) {
  const parsedBody = await readJsonBody(req)
  if (!parsedBody.ok) return parsedBody.response

  const parsed = bookingQuoteSchema.safeParse(parsedBody.body)
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 })
  }

  const result = await resolveBookingPricing({
    variantId: parsed.data.variantId,
    appointmentType: parsed.data.appointmentType,
    selectedOptions: parsed.data.selectedOptions,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({
    finalPriceCents: result.finalPriceCents,
    productName: result.productName,
    variantName: result.variantName,
    currency: result.currency,
  })
}
