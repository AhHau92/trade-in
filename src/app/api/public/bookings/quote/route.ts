import { NextRequest, NextResponse } from 'next/server'
import { resolveBookingPricing } from '@/lib/bookingPricing'

// Price-preview endpoint: validates the customer's selections and returns
// the authoritative server price WITHOUT creating a booking. The booking
// page calls this right before submitting so it can show the customer a
// "price has changed" confirmation if the server price differs from what
// they saw while browsing, instead of either silently booking at a
// different price or hard-rejecting a legitimate customer.
export async function POST(req: NextRequest) {
  const body = await req.json()

  const result = await resolveBookingPricing({
    variantId: body.variantId,
    appointmentType: body.appointmentType,
    selectedOptions: body.selectedOptions,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({
    finalPrice: result.finalPrice,
    productName: result.productName,
    variantName: result.variantName,
    currency: result.currency,
  })
}
