import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin/login')

  const [categories, brands, products, bookings] = await Promise.all([
    prisma.category.count(),
    prisma.brand.count(),
    prisma.product.count(),
    prisma.booking.count(),
  ])

  const stats = [
    { label: 'Categories', value: categories, color: 'bg-blue-500' },
    { label: 'Brands', value: brands, color: 'bg-green-500' },
    { label: 'Products', value: products, color: 'bg-purple-500' },
    { label: 'Bookings', value: bookings, color: 'bg-orange-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6">
            <div className={`w-10 h-10 ${stat.color} rounded-lg mb-3`} />
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}