'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  slug: string
  image: string | null
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/public/categories').then(r => r.json()).then(data => { setCategories(data); setLoading(false) })
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-black text-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Trade-In</h1>
          <p className="text-gray-400 text-sm">Get the best value for your device</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">What would you like to trade in?</h2>
          <p className="text-gray-500 mt-2">Select a category to get started</p>
        </div>

        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/${cat.slug}`}
                className="group border-2 border-gray-200 rounded-2xl p-6 text-center hover:border-black transition-all hover:shadow-lg"
              >
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-20 h-20 object-contain mx-auto mb-4 group-hover:scale-110 transition-transform" />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-xl mx-auto mb-4 flex items-center justify-center text-2xl">📱</div>
                )}
                <p className="font-semibold text-lg">{cat.name}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}