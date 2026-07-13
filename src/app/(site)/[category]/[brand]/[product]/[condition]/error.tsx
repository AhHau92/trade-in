'use client'

import { useEffect } from 'react'

// Error boundaries must be Client Components. Catches anything that throws
// during rendering of this route segment (e.g. the database query in
// page.tsx failing) instead of crashing the whole app with a blank screen.
export default function ProductError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Product page error:', error)
  }, [error])

  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
      <p className="text-gray-500 mb-8">
        We couldn&apos;t load this product right now. Please try again.
      </p>
      <button
        onClick={reset}
        className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition"
      >
        Try again
      </button>
    </div>
  )
}
