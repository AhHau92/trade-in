import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: productId } = await params
  const body = await req.json()
  const variant = await prisma.variant.create({
    data: {
      name: body.name,
      axis2Value: body.axis2Value || null,
      basePriceCents: body.basePriceCents,
      order: body.order || 0,
      isWhatsappOnly: body.isWhatsappOnly || false,
      productId,
    },
  })
  return NextResponse.json(variant)
}