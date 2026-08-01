import Link from 'next/link'
import Image from 'next/image'
import { getStorefrontCategories } from '@/lib/storefront'

// Categories are admin-managed catalogue data. Render this page per request
// so admin changes appear immediately instead of being frozen into the last
// deployment's static build output.
export const dynamic = 'force-dynamic'

// Pure list/navigation page — no client interactivity beyond <Link>, so it's
// rendered entirely server-side. No useEffect fetch, no manual loading state.
export default async function HomePage() {
  const categories = await getStorefrontCategories()

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
          Interactive Full-Stack Demo
        </p>
        <h1 className="text-3xl font-bold">What would you like to trade in?</h1>
        <p className="text-gray-500 mt-2">
          Explore a sample device catalogue and condition-based quote flow.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/${cat.slug}`}
            className="group border-2 border-gray-200 rounded-2xl p-6 text-center hover:border-black transition-all hover:shadow-lg"
          >
            {cat.image ? (
              <Image src={cat.image} alt={cat.name} width={80} height={80} className="w-20 h-20 object-contain mx-auto mb-4 group-hover:scale-110 transition-transform" />
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded-xl mx-auto mb-4 flex items-center justify-center text-2xl">📱</div>
            )}
            <p className="font-semibold text-lg">{cat.name}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 grid gap-4 border-t border-gray-100 pt-8 text-sm text-gray-600 md:grid-cols-3">
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="font-semibold text-gray-900">Verified pricing</p>
          <p className="mt-1">Quotes are recomputed on the server before a booking is accepted.</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="font-semibold text-gray-900">Flexible catalogue</p>
          <p className="mt-1">Products support storage, colour, condition, and reusable questions.</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="font-semibold text-gray-900">Operational workflow</p>
          <p className="mt-1">Bookings, branches, notifications, settings, and roles share one system.</p>
        </div>
      </div>
    </div>
  )
}
