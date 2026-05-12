import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  if (id === (session.user as any).id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })

  await prisma.admin.delete({ where: { id } })
  return NextResponse.json({ success: true })
}