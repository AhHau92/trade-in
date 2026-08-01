import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About the Demo',
  description:
    'How the device trade-in portfolio demo works, what it demonstrates, and how its sample data should be interpreted.',
}

// Static content page — no client interactivity, so this renders fully
// server-side like the homepage.
export default function AboutUsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
          Portfolio Project
        </p>
        <h1 className="text-3xl font-bold">About This Demo</h1>
        <p className="text-gray-500 mt-2">A realistic product workflow, not a live trade-in business.</p>
      </div>

      <div className="bg-gray-50 rounded-2xl p-8 space-y-4 text-gray-700 leading-relaxed max-w-3xl mx-auto">
        <p>
          This full-stack portfolio project models how a device trade-in service could let a
          customer select a phone or laptop, describe its condition, receive an estimate, and
          book either a store visit or a collection.
        </p>
        <p>
          The public quote is only one side of the system. A protected administration area
          manages categories, brands, products, storage and colour combinations, reusable
          condition questions, branches, prices, bookings, settings, and admin roles.
        </p>
        <p>
          All catalogue entries, product images, branches, and prices are illustrative demo
          data. Estimates are intentionally conservative and are not market valuations or
          commercial offers.
        </p>
      </div>

      <div className="text-center mt-10">
        <Link href="/about/gene" className="text-sm font-medium text-gray-500 hover:text-black transition">
          Read the technical case study →
        </Link>
      </div>
    </div>
  )
}
