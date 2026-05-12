import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let settings = await prisma.settings.findFirst()
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: 'default', pickupFee: 10, currency: 'SGD', whatsappNumber: '' } })
  }
  return NextResponse.json(settings)
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const settings = await prisma.settings.upsert({
    where: { id: 'default' },
    update: { pickupFee: body.pickupFee, currency: body.currency, whatsappNumber: body.whatsappNumber },
    create: { id: 'default', pickupFee: body.pickupFee, currency: body.currency, whatsappNumber: body.whatsappNumber },
  })
  return NextResponse.json(settings)
}