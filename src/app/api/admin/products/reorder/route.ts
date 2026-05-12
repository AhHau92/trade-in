import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  // body.items = [{ slug: 'iphone-17-pro-max', order: 0 }, ...]
  // Update all products with same slug to same order
  await Promise.all(
    body.items.map((item: { slug: string; order: number }) =>
      prisma.product.updateMany({
        where: { slug: item.slug },
        data: { order: item.order },
      })
    )
  )

  return NextResponse.json({ success: true })
}