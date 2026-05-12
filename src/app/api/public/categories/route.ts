import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    select: { id: true, name: true, slug: true, image: true },
  })
  return NextResponse.json(categories)
}