import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const category = await prisma.category.update({
    where: { id },
    data: {
      name: body.name,
      slug: body.name.toLowerCase().replace(/\s+/g, '-'),
      image: body.image || null,
      order: body.order || 0,
      isActive: body.isActive,
    },
  })
  return NextResponse.json(category)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.category.delete({ where: { id } })
  return NextResponse.json({ success: true })
}