// Shown automatically by Next.js while the async Server Component in
// page.tsx is fetching the product + settings — no manual `if (loading)`
// state needed in the page itself.
export default function ProductLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-4 w-16 bg-gray-200 rounded mb-4" />

      <div className="bg-gray-50 rounded-2xl p-6 mb-8 mt-4">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-gray-200 rounded-xl" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="h-2 w-48 bg-gray-200 rounded-full" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-5 w-40 bg-gray-200 rounded" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 bg-gray-100 rounded-xl" />
            <div className="h-16 bg-gray-100 rounded-xl" />
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
