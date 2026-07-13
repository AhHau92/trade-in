import { NextRequest, NextResponse } from 'next/server'
import { getCategoryWithBrands } from '@/lib/storefront'

export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const result = await getCategoryWithBrands(slug)
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(result)
}
