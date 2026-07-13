import Link from 'next/link'

// Rendered when page.tsx calls notFound() — e.g. the slug/condition
// combination doesn't exist, or the product was deactivated.
export default function ProductNotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-4">📱</div>
      <h2 className="text-2xl font-bold mb-2">Product not found</h2>
      <p className="text-gray-500 mb-8">
        This device isn&apos;t available, or the link may be out of date.
      </p>
      <Link href="/" className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition">
        Back to Home
      </Link>
    </div>
  )
}
