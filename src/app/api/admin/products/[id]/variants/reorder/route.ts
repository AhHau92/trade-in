import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // productId isn't strictly needed for the update (variant ids are already
  // unique), but keeping it in the route mirrors how variants are scoped
  // everywhere else (e.g. POST .../products/[id]/variants) and guards
  // against a stray request reordering variants that don't belong to the
  // product the admin currently has open.
  const { id: productId } = await params
  const body = await req.json()
  const items: { id: string; order: number }[] = body.items || []

  const owned = await prisma.variant.findMany({
    where: { id: { in: items.map((i) => i.id) }, productId },
    select: { id: true },
  })
  const ownedIds = new Set(owned.map((v) => v.id))

  await Promise.all(
    items
      .filter((item) => ownedIds.has(item.id))
      .map((item) => prisma.variant.update({ where: { id: item.id }, data: { order: item.order } }))
  )

  return NextResponse.json({ success: true })
}
