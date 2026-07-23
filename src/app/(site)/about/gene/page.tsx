import Link from 'next/link'

export const metadata = {
  title: 'About Gene',
}

const techStack = [
  {
    label: 'Frontend',
    detail: 'React, Next.js, JavaScript, responsive UI development',
  },
  {
    label: 'Backend',
    detail: 'Node.js, APIs, authentication, role-based access control',
  },
  {
    label: 'Database',
    detail: 'MongoDB and data structure design',
  },
  {
    label: 'Automation',
    detail: 'Python, web scraping, scheduled workflows, and data processing',
  },
  {
    label: 'Web Platforms',
    detail: 'WordPress, WooCommerce, PHP, and third-party system integrations',
  },
]

// Static content page — no client interactivity, so this renders fully
// server-side like the homepage.
export default function AboutGenePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold">About Gene</h1>
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
          ← Back to About Us
        </Link>
      </div>
    </div>
  )
}
