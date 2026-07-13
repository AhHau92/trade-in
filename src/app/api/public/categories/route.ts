import { NextResponse } from 'next/server'
import { getStorefrontCategories } from '@/lib/storefront'

export async function GET() {
  const categories = await getStorefrontCategories()
  return NextResponse.json(categories)
}
