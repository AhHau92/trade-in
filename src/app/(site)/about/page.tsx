import Link from 'next/link'

export const metadata = {
  title: 'About Us',
}

// Static content page — no client interactivity, so this renders fully
// server-side like the homepage.
export default function AboutUsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold">About Us</h1>
        <p className="text-gray-500 mt-2">What Trade-In is, and how it works.</p>
      </div>

      <div className="bg-gray-50 rounded-2xl p-8 space-y-4 text-gray-700 leading-relaxed max-w-3xl mx-auto">
        <p>
          Trade-In is a simple way to turn your old phone or MacBook into cash. Select your
          device, tell us its condition, and get an instant trade-in estimate — no guesswork,
          no back-and-forth quotes.
        </p>
        <p>
          Once you&apos;re happy with the estimate, you can book a slot to bring your device in
          for a final check and get paid on the spot. We currently support phones and MacBooks,
          with more device categories on the way.
        </p>
        <p>
          Our goal is straightforward: make trading in a device fast, transparent, and
          hassle-free, whether it&apos;s your first time or your tenth.
        </p>
      </div>

      <div className="text-center mt-10">
        <Link href="/about/gene" className="text-sm font-medium text-gray-500 hover:text-black transition">
          Curious who built this? Meet Gene →
        </Link>
      </div>
    </div>
  )
}
