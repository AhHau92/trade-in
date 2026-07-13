'use client'

import { useEffect } from 'react'

// Catches rendering errors for any (site) route that doesn't define its own
// error.tsx (the product route overrides this with a more specific one).
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Storefront error:', error)
  }, [error])

  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
      <p className="text-gray-500 mb-8">Please try again in a moment.</p>
      <button
        onClick={reset}
        className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition"
      >
        Try again
      </button>
    </div>
  )
}
