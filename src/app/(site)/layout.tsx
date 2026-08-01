import Header from '@/components/site/Header'
import Footer from '@/components/site/Footer'

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs leading-relaxed text-amber-900">
        <strong>Portfolio demo:</strong> sample devices, imagery, availability, and trade-in
        estimates are illustrative and are not commercial offers.
      </div>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
