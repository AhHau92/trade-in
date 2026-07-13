import { NextRequest, NextResponse } from 'next/server'
import { getBrandWithProducts } from '@/lib/storefront'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const categorySlug = req.nextUrl.searchParams.get('category') || undefined

  const result = await getBrandWithProducts(slug, categorySlug)
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(result)
}
