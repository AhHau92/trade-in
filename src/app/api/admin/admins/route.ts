import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admins = await prisma.admin.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true } })
  return NextResponse.json(admins)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const hashedPassword = await bcrypt.hash(body.password, 12)
  const admin = await prisma.admin.create({
    data: { name: body.name, email: body.email, password: hashedPassword, role: body.role || 'admin' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })
  return NextResponse.json(admin)
}