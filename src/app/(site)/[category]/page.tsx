import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getCategoryWithBrands } from '@/lib/storefront'

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const result = await getCategoryWithBrands(category)
  if (!result) notFound()
  const { category: categoryData, brands } = result

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-gray-500 hover:text-black">← Back</Link>

      <div className="text-center mb-10 mt-4">
        <h2 className="text-3xl font-bold">{categoryData.name}</h2>
        <p className="text-gray-500 mt-2">Select a brand</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={`/${category}/${brand.slug}`}
            className="group border-2 border-gray-200 rounded-2xl p-6 text-center hover:border-black transition-all hover:shadow-lg"
          >
            {brand.image ? (
              <Image src={brand.image} alt={brand.name} width={80} height={80} className="w-20 h-20 object-contain mx-auto mb-4 group-hover:scale-110 transition-transform" />
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded-xl mx-auto mb-4 flex items-center justify-center text-2xl">🏷️</div>
            )}
            <p className="font-semibold text-lg">{brand.name}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
