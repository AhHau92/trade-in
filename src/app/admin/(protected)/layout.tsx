import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin/login')

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar user={session.user} />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}