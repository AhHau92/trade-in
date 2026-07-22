import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatMoney } from '@/lib/money'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const statusBarColors: Record<string, string> = {
  pending: 'bg-yellow-400',
  confirmed: 'bg-blue-400',
  completed: 'bg-green-400',
  cancelled: 'bg-red-400',
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin/login')

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const [
    categories,
    brands,
    products,
    bookingsTotal,
    pendingCount,
    valueAgg,
    statusGroups,
    recentBookings,
    recentCreatedAt,
    settings,
  ] = await Promise.all([
    prisma.category.count(),
    prisma.brand.count(),
    prisma.product.count(),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'pending' } }),
    prisma.booking.aggregate({ _sum: { finalPriceCents: true }, where: { status: { not: 'cancelled' } } }),
    prisma.booking.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, bookingRef: true, name: true, finalPriceCents: true, status: true, createdAt: true,
        productName: true, variantName: true,
        variant: { select: { name: true, product: { select: { name: true } } } },
      },
    }),
    prisma.booking.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.settings.findUnique({ where: { id: 'default' } }),
  ])

  const currency = settings?.currency || 'SGD'
  const totalValueCents = valueAgg._sum.finalPriceCents || 0

  const stats = [
    { label: 'Categories', value: categories, icon: '📁', color: 'bg-blue-500' },
    { label: 'Brands', value: brands, icon: '🏷️', color: 'bg-green-500' },
    { label: 'Products', value: products, icon: '📱', color: 'bg-purple-500' },
    { label: 'Bookings', value: bookingsTotal, icon: '📅', color: 'bg-orange-500' },
    { label: 'Pending Bookings', value: pendingCount, icon: '⏳', color: 'bg-yellow-500' },
    { label: 'Trade-In Value', value: `${currency} ${formatMoney(totalValueCents)}`, icon: '💰', color: 'bg-teal-500' },
  ]

  const statusOrder = ['pending', 'confirmed', 'completed', 'cancelled']
  const statusCounts = statusOrder.map((s) => ({
    status: s,
    count: statusGroups.find((g) => g.status === s)?._count.status || 0,
  }))
  const statusMax = Math.max(1, ...statusCounts.map((s) => s.count))

  // Build last-7-days trend, bucketed by local day
  const days: { label: string; date: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push({
      label: d.toLocaleDateString('en-SG', { weekday: 'short' }),
      date: d.toDateString(),
      count: 0,
    })
  }
  for (const b of recentCreatedAt) {
    const key = new Date(b.createdAt).toDateString()
    const day = days.find((d) => d.date === key)
    if (day) day.count++
  }
  const trendMax = Math.max(1, ...days.map((d) => d.count))

  const formatDate = (d: Date) => new Date(d).toLocaleDateString('en-SG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6 flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
            </div>
            <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-lg shrink-0`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 7-day trend */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold mb-4">Bookings — Last 7 Days</h2>
          <div className="flex items-end justify-between gap-2 h-40">
            {days.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-xs text-gray-500">{d.count}</span>
                <div className="w-full bg-gray-100 rounded-t-md flex items-end" style={{ height: '100%' }}>
                  <div
                    className="w-full bg-black rounded-t-md transition-all"
                    style={{ height: `${Math.max(4, (d.count / trendMax) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold mb-4">Booking Status</h2>
          <div className="space-y-3">
            {statusCounts.map((s) => (
              <div key={s.status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize text-gray-600">{s.status}</span>
                  <span className="font-medium">{s.count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${statusBarColors[s.status]}`}
                    style={{ width: `${(s.count / statusMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold">Recent Bookings</h2>
          <Link href="/admin/bookings" className="text-sm text-blue-600 hover:underline">View all →</Link>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Ref</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Customer</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Device</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Price</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {recentBookings.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-sm font-medium">{b.bookingRef}</td>
                <td className="px-6 py-4 text-sm">{b.name}</td>
                <td className="px-6 py-4 text-sm">
                  {b.productName || b.variant?.product.name || 'Deleted product'} <span className="text-gray-400">— {b.variantName || b.variant?.name || 'Deleted variant'}</span>
                </td>
                <td className="px-6 py-4 font-medium text-sm">{currency} {formatMoney(b.finalPriceCents)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[b.status] || 'bg-gray-100'}`}>{b.status}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(b.createdAt)}</td>
              </tr>
            ))}
            {recentBookings.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No bookings yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
