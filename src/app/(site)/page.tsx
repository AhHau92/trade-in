import Link from 'next/link'
import Image from 'next/image'
import { getStorefrontCategories } from '@/lib/storefront'

// Pure list/navigation page — no client interactivity beyond <Link>, so it's
// rendered entirely server-side. No useEffect fetch, no manual loading state.
export default async function HomePage() {
  const categories = await getStorefrontCategories()

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold">What would you like to trade in?</h2>
        <p className="text-gray-500 mt-2">Select a category to get started</p>
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
    </div>
  )
}
