import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  // body.items = [{ id: 'clxxx', order: 0 }, ...] — mirrors
  // /api/admin/products/reorder's shape, just keyed by id instead of slug
  // since templates aren't grouped like New/Used product pairs.
  await Promise.all(
    (body.items || []).map((item: { id: string; order: number }) =>
      prisma.questionTemplate.update({
        where: { id: item.id },
        data: { order: item.order },
      })
    )
  )

  return NextResponse.json({ success: true })
}
