import Link from 'next/link'

const quickLinks = [
  { href: '/', label: 'Home' },
  { href: '/booking', label: 'My Booking' },
  { href: '/admin/login', label: 'Admin Login' },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-16 bg-black text-gray-400">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <h3 className="mb-2 text-lg font-bold text-white">Trade-In</h3>
          <p className="text-sm">Get the best value for your device, fast and hassle-free.</p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Contact Us</h4>
          <ul className="space-y-2 text-sm">
            {/* TODO: replace with real contact details */}
            <li>📧 contact@tradein.com</li>
            <li>📞 +60 12-345 6789</li>
            <li className="flex gap-3 pt-1">
              <a href="#" className="transition hover:text-white">Facebook</a>
              <a href="#" className="transition hover:text-white">Instagram</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-500">
        © {year} Trade-In. All rights reserved.
      </div>
    </footer>
  )
}
