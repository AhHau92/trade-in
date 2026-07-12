import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, ROOT_ADMIN_EMAIL } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user
  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isRoot: user.email === ROOT_ADMIN_EMAIL,
  })
}
