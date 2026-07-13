import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProductForStorefront, getStorefrontSettings } from '@/lib/storefront'
import QuoteBuilder from '@/components/site/QuoteBuilder'

// Server Component: product + settings are fetched directly from the
// database at request time (no client-side fetch waterfall, no manual
// loading state) and streamed down as the initial HTML. Only the
// interactive selection state lives client-side, in <QuoteBuilder>.
export default async function ProductPage({
  params,
}: {
  params: Promise<{ category: string; brand: string; product: string; condition: string }>
}) {
  const { category, brand, product: productSlug, condition } = await params

  const [product, settings] = await Promise.all([
    getProductForStorefront(productSlug, condition),
    getStorefrontSettings(),
  ])

  // Triggers this route segment's not-found.tsx instead of rendering a
  // broken page — no more `if (!productData) return <p>Product not
  // found</p>` scattered through JSX.
  if (!product) notFound()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href={`/${category}/${brand}`} className="text-sm text-gray-500 hover:text-black">← Back</Link>
      <QuoteBuilder product={product} settings={settings} condition={condition} />
    </div>
  )
}
