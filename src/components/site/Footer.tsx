import Link from 'next/link'

const quickLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About the Demo' },
  { href: '/about/gene', label: 'Project Case Study' },
  { href: '/admin/login', label: 'Admin Login' },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-16 bg-black text-gray-400">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <h3 className="mb-2 text-lg font-bold text-white">Device Trade-In Demo</h3>
          <p className="text-sm">
            A full-stack portfolio project covering catalogue management, verified quotes,
            and booking workflows.
          </p>
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
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Demo Notice</h4>
          <p className="text-sm">
            This is not a real trade-in business. Products, imagery, branches, and prices are
            illustrative portfolio data.
          </p>
        </div>
      </div>

      <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-500">
        © {year} Gene Ee Chun Hau · Portfolio demonstration
      </div>
    </footer>
  )
}
