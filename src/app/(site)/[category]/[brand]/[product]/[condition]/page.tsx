import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getProductForStorefront, getStorefrontSettings } from '@/lib/storefront'
import QuoteBuilder from '@/components/site/QuoteBuilder'
import TradeInSteps from '@/components/site/TradeInSteps'

type ProductPageParams = { category: string; brand: string; product: string; condition: string }

// Feeds <title>/<meta name="description">. Falls back to name-derived
// defaults so products created before metaTitle/metaDescription existed
// (or where the admin just left them blank) still get sane tags instead of
// Next's generic default.
export async function generateMetadata({
  params,
}: {
  params: Promise<ProductPageParams>
}): Promise<Metadata> {
  const { product: productSlug, condition } = await params
  const product = await getProductForStorefront(productSlug, condition)
  if (!product) return {}

  const conditionLabel = condition === 'new' ? 'New' : 'Used'
  const title = product.metaTitle?.trim() || `${product.name} (${conditionLabel}) Trade-In Value`
  const description = product.metaDescription?.trim()
    || `Get an instant trade-in quote for your ${conditionLabel.toLowerCase()} ${product.name}. Compare storage options and get paid fast.`

  return { title, description }
}

// Server Component: product + settings are fetched directly from the
// database at request time (no client-side fetch waterfall, no manual
// loading state) and streamed down as the initial HTML. Only the
// interactive selection state lives client-side, in <QuoteBuilder>.
export default async function ProductPage({
  params,
}: {
  params: Promise<ProductPageParams>
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
      <Link href={`/${category}/${brand}`} className="text-sm text-gray-500 hover:text-black transition-colors inline-flex items-center gap-1">
        <span aria-hidden>←</span> Back
      </Link>

      <div className="mt-6">
        <TradeInSteps current={3} />
      </div>

      {product.introContent && (
        // Admin-authored via the rich text editor in /admin/products — now
        // stored as HTML (bold/italic/lists/links), not plain text, so this
        // renders it instead of escaping it. Content is admin-only input.
        <div className="mt-5 text-gray-600 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-blue-600 [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: product.introContent }} />
      )}

      <QuoteBuilder product={product} settings={settings} condition={condition} />

      {product.seoContent && (
        <div className="mt-12 pt-8 border-t border-gray-100 text-sm text-gray-500 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-blue-600 [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: product.seoContent }} />
      )}
    </div>
  )
}
