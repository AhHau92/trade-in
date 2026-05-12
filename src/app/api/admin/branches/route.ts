import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const branches = await prisma.branch.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json(branches)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const branch = await prisma.branch.create({
    data: { name: body.name, address: body.address, order: body.order || 0 },
  })
  return NextResponse.json(branch)
}