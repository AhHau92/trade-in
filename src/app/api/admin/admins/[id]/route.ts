import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, ROOT_ADMIN_EMAIL } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Deleting any admin (regular or superadmin) is reserved for the root
// admin account, same as role management and password resets.
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.email !== ROOT_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Only the root admin can delete admins' }, { status: 401 })
  }
  const sessionUser = session.user

  const { id } = await params
  if (id === sessionUser.id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })

  const target = await prisma.admin.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'Admin not found' }, { status: 404 })

  if (target.role === 'superadmin') {
    const superadminCount = await prisma.admin.count({ where: { role: 'superadmin' } })
    if (superadminCount <= 1) {
      return NextResponse.json({ error: 'Cannot delete the last superadmin' }, { status: 400 })
    }
  }

  await prisma.admin.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

// Update an admin: password change and/or role change.
//
// Password: anyone can change their own password (must supply
// currentPassword). Resetting someone ELSE's password (no currentPassword
// required) is reserved for the root admin account (ROOT_ADMIN_EMAIL),
// same as role management.
//
// Role: only the root admin account (ROOT_ADMIN_EMAIL) can change roles —
// other superadmins have full access to everything else, but role
// management is reserved for the root account. Nobody can change their
// own role (avoids accidental self-lockout), and the last remaining
// superadmin cannot be demoted.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const sessionUser = session.user
  const isSelf = id === sessionUser.id

  const body = await req.json()
  const { password, currentPassword, role } = body

  const target = await prisma.admin.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'Admin not found' }, { status: 404 })

  if (role) {
    if (sessionUser.email !== ROOT_ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Only the root admin can change roles' }, { status: 401 })
    }
    if (isSelf) {
      return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 })
    }
    if (!['admin', 'superadmin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    if (target.role === 'superadmin' && role !== 'superadmin') {
      const superadminCount = await prisma.admin.count({ where: { role: 'superadmin' } })
      if (superadminCount <= 1) {
        return NextResponse.json({ error: 'Cannot remove the last superadmin' }, { status: 400 })
      }
    }

    await prisma.admin.update({ where: { id }, data: { role } })
  }

  if (password) {
    if (!isSelf && sessionUser.email !== ROOT_ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Only the root admin can reset another admin\'s password' }, { status: 401 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }
    if (isSelf) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required' }, { status: 400 })
      }
      const isValid = await bcrypt.compare(currentPassword, target.password)
      if (!isValid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    await prisma.admin.update({ where: { id }, data: { password: hashedPassword } })
  }

  if (!role && !password) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}