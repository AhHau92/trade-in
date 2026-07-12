'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Brand { id: string; name: string; slug: string; image: string | null }

export default function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params)
  const [brands, setBrands] = useState<Brand[]>([])
  const [categoryName, setCategoryName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/public/categories/${category}/brands`).then(r => r.json()).then(data => {
      setCategoryName(data.category?.name || '')
      setBrands(data.brands || [])
      setLoading(false)
    })
  }, [category])

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-gray-500 hover:text-black">← Back</Link>

      <div className="text-center mb-10 mt-4">
        <h2 className="text-3xl font-bold">{categoryName}</h2>
        <p className="text-gray-500 mt-2">Select a brand</p>
      </div>

      {loading ? (
        <div className="text-center text-gray-400">Loading...</div>
      ) : (
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
      )}
    </div>
  )
}