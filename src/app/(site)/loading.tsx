// Applies to any (site) route that doesn't define its own loading.tsx
// (the product route overrides this with a more detailed skeleton).
export default function SiteLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse">
      <div className="text-center mb-10">
        <div className="h-8 w-64 bg-gray-200 rounded mx-auto mb-3" />
        <div className="h-4 w-48 bg-gray-100 rounded mx-auto" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-2 border-gray-100 rounded-2xl p-6 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-xl mx-auto mb-4" />
            <div className="h-4 w-20 bg-gray-100 rounded mx-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
