import { NextRequest, NextResponse } from 'next/server'
import { getProductForStorefront } from '@/lib/storefront'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const condition = req.nextUrl.searchParams.get('condition') || 'new'

  const product = await getProductForStorefront(slug, condition)
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(product)
}
