import Link from 'next/link'

// Global fallback for any route that doesn't match a page — distinct from
// the product-specific not-found.tsx, which handles a valid route with an
// invalid slug/condition.
export default function GlobalNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <h1 className="text-2xl font-bold mb-2">Page not found</h1>
      <p className="text-gray-500 mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition">
        Back to Home
      </Link>
    </div>
  )
}
