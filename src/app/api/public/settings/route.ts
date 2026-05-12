import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  let settings = await prisma.settings.findFirst()
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: 'default', pickupFee: 10, currency: 'SGD', whatsappNumber: '' } })
  }
  return NextResponse.json({ pickupFee: settings.pickupFee, currency: settings.currency, whatsappNumber: settings.whatsappNumber })
}