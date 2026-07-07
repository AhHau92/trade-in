'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'

interface Product { id: string; name: string; slug: string; image: string | null; condition: string }

export default function BrandPage({ params }: { params: Promise<{ category: string; brand: string }> }) {
  const { category, brand } = use(params)
  const [products, setProducts] = useState<Product[]>([])
  const [brandName, setBrandName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/public/brands/${brand}/products?category=${category}`).then(r => r.json()).then(data => {
      setBrandName(data.brand?.name || '')
      setProducts(data.products || [])
      setLoading(false)
    })
  }, [brand, category])

  // Group products by name, preserving API order
  const groupedMap = new Map<string, Product[]>()
  products.forEach((p) => {
    if (!groupedMap.has(p.name)) groupedMap.set(p.name, [])
    groupedMap.get(p.name)!.push(p)
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <Link href={`/${category}`} className="text-sm text-gray-500 hover:text-black">← Back</Link>

      <div className="text-center mb-10 mt-4">
        <h2 className="text-3xl font-bold">{brandName}</h2>
        <p className="text-gray-500 mt-2">Select your device</p>
      </div>

      {loading ? (
        <div className="text-center text-gray-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from(groupedMap.entries()).map(([name, variants]) => (
            <div key={name} className="border-2 border-gray-200 rounded-2xl p-6 text-center hover:shadow-lg transition-all">
              {variants[0].image ? (
                <img src={variants[0].image} alt={name} className="w-20 h-20 object-contain mx-auto mb-4" />
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-xl mx-auto mb-4 flex items-center justify-center text-2xl">📱</div>
              )}
              <p className="font-semibold mb-3">{name}</p>
              <div className="flex justify-center gap-2">
                {variants.sort((a, b) => a.condition === 'new' ? -1 : 1).map((p) => (
                  <Link key={p.id} href={`/${category}/${brand}/${p.slug}/${p.condition}`}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium border-2 transition ${
                      p.condition === 'new' ? 'border-blue-500 text-blue-700 hover:bg-blue-50' : 'border-orange-500 text-orange-700 hover:bg-orange-50'
                    }`}>
                    {p.condition === 'new' ? '🆕 New' : '♻️ Used'}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}