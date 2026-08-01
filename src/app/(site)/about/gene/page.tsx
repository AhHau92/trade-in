import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Technical Case Study',
  description:
    'The architecture, engineering decisions, and product thinking behind Gene Ee Chun Hau’s full-stack device trade-in platform.',
}

const techStack = [
  {
    label: 'Frontend',
    detail: 'React, Next.js, JavaScript, responsive UI development',
  },
  {
    label: 'Backend',
    detail: 'Next.js Route Handlers, server-verified pricing, NextAuth, Zod',
  },
  {
    label: 'Database',
    detail: 'PostgreSQL on Neon, Prisma ORM, relational data modelling',
  },
  {
    label: 'Operations',
    detail: 'Cloudinary uploads, Resend notifications, Vercel deployment',
  },
  {
    label: 'Admin Experience',
    detail: 'Reusable question templates, drag-to-reorder catalogue, role-based access',
  },
]

const engineeringDecisions = [
  {
    title: 'Server-authoritative pricing',
    detail:
      'The browser submits selected variant and option IDs, never a trusted price. The server resolves the quote again before creating a booking.',
  },
  {
    title: 'Money stored as integer cents',
    detail:
      'Prices and adjustments use integer cents across the database and application boundary, avoiding floating-point rounding errors.',
  },
  {
    title: 'Stable booking references',
    detail:
      'A per-day PostgreSQL counter creates readable booking references without the race condition caused by COUNT(*) + 1.',
  },
  {
    title: 'Historical booking snapshots',
    detail:
      'Bookings preserve product, variant, branch, and price snapshots even when catalogue records are renamed or removed later.',
  },
]

// Static content page — no client interactivity, so this renders fully
// server-side like the homepage.
export default function AboutGenePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
          Technical Case Study
        </p>
        <h1 className="text-3xl font-bold">Device Trade-In Platform</h1>
        <p className="mt-4 text-xl md:text-2xl font-semibold max-w-2xl mx-auto">
          I turn complex workflows into simple digital experiences.
        </p>
        <p className="mt-2 text-gray-500 text-sm">
          Full-Stack Developer · Automation Builder · Product-Minded Problem Solver
        </p>
      </div>

      <div className="space-y-4 text-gray-700 leading-relaxed max-w-3xl mx-auto">
        <p className="text-lg font-semibold text-black">I build systems, not just screens.</p>
        <p>Hi, I&apos;m Gene, a web developer based in Singapore.</p>
        <p>
          I enjoy turning complicated business processes into digital products that feel
          simple, clear, and easy to use. My work spans both frontend experience and backend
          logic, from designing responsive interfaces to building APIs, authentication systems,
          admin dashboards, databases, and workflow automation.
        </p>
        <p>This trade-in platform is one example of how I approach development.</p>
        <p>
          Instead of building only a visual prototype, I designed it as a complete working
          system where customers can select their device, configure its condition, receive a
          trade-in estimate, and submit a booking. On the administrative side, staff can manage
          products, pricing, bookings, users, and operational data through a dedicated
          dashboard.
        </p>
      </div>

      <section className="mt-14" aria-labelledby="admin-workflow">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            Full operational workflow
          </p>
          <h2 id="admin-workflow" className="mt-2 text-2xl font-bold text-black">
            The admin experience behind the storefront
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Staff can monitor trade-in activity, maintain the product catalogue, and manage
            bookings from one protected dashboard. All names and records shown below are
            fictional portfolio data.
          </p>
        </div>

        <figure className="mt-7 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <Image
            src="/demo/admin/dashboard.png"
            alt="Trade-In Admin dashboard showing catalogue, booking, and trade-in value metrics"
            width={1440}
            height={1000}
            className="h-auto w-full"
            sizes="(max-width: 1024px) 100vw, 1024px"
          />
          <figcaption className="border-t border-gray-100 px-5 py-4 text-sm text-gray-600">
            Operational overview with recent bookings, status breakdowns, and trade-in value.
          </figcaption>
        </figure>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <Image
              src="/demo/admin/products.png"
              alt="Product management table with category, brand, condition, variants, and status controls"
              width={1440}
              height={1048}
              className="h-auto w-full"
              sizes="(max-width: 768px) 100vw, 512px"
            />
            <figcaption className="border-t border-gray-100 px-5 py-4 text-sm text-gray-600">
              Catalogue management across products, variants, conditions, and availability.
            </figcaption>
          </figure>

          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <Image
              src="/demo/admin/bookings.png"
              alt="Booking management table with fictional customers and multiple trade-in statuses"
              width={1440}
              height={1000}
              className="h-auto w-full"
              sizes="(max-width: 768px) 100vw, 512px"
            />
            <figcaption className="border-t border-gray-100 px-5 py-4 text-sm text-gray-600">
              Booking operations with pickup methods, values, and lifecycle status tracking.
            </figcaption>
          </figure>
        </div>
      </section>

      <div className="mt-12 max-w-3xl mx-auto">
        <h2 className="text-lg font-bold mb-4">Key Engineering Decisions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {engineeringDecisions.map((item) => (
            <div key={item.title} className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 max-w-3xl mx-auto">
        <h2 className="text-lg font-bold mb-4">What I Work With</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {techStack.map((item) => (
            <div key={item.label} className="border-2 border-gray-200 rounded-xl p-4">
              <p className="font-semibold">{item.label}</p>
              <p className="text-sm text-gray-500 mt-1">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 max-w-3xl mx-auto space-y-4 text-gray-700 leading-relaxed">
        <h2 className="text-lg font-bold text-black">How I Think</h2>
        <p>I believe good software should do more than look polished.</p>
        <p>
          It should solve a real problem, reduce repetitive work, handle edge cases, and remain
          understandable to the people who use it every day.
        </p>
        <p>
          My experience working directly with retail operations has taught me to think beyond
          code. I consider how products are created, how prices are updated, how staff use the
          system, where errors may happen, and how a workflow can be made faster without
          sacrificing reliability.
        </p>
        <p>
          That balance between design, engineering, and real-world usability is what I try to
          bring into every project.
        </p>
      </div>

      <div className="mt-12 max-w-3xl mx-auto space-y-4 text-gray-700 leading-relaxed">
        <h2 className="text-lg font-bold text-black">Currently</h2>
        <p>
          I&apos;m continuing to deepen my experience in full-stack development, system design,
          automation, and application security while building products that connect strong
          visual design with practical business value.
        </p>
        <p>
          I&apos;m especially interested in frontend and full-stack opportunities where I can
          build thoughtful interfaces, reliable systems, and products people genuinely enjoy
          using.
        </p>
      </div>

      <div className="text-center mt-12">
        <Link href="/about" className="text-sm font-medium text-gray-500 hover:text-black transition">
          ← Back to About the Demo
        </Link>
      </div>
    </div>
  )
}
