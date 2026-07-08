'use client'

import { useState, useEffect } from 'react'

interface Admin { id: string; name: string; email: string; role: string; createdAt: string }
interface Me { id: string; name: string; email: string; role: string; isRoot: boolean }

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin' })

  const [passwordTarget, setPasswordTarget] = useState<Admin | null>(null)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', password: '', confirmPassword: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const [roleUpdatingId, setRoleUpdatingId] = useState<string | null>(null)

  const fetch_ = async () => {
    const [adminsRes, meRes] = await Promise.all([
      fetch('/api/admin/admins'),
      fetch('/api/admin/me'),
    ])
    setAdmins(await adminsRes.json())
    setMe(await meRes.json())
    setLoading(false)
  }
  useEffect(() => { fetch_() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/admin/admins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setShowModal(false); setForm({ name: '', email: '', password: '', role: 'admin' }); fetch_()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this admin?')) return
    await fetch(`/api/admin/admins/${id}`, { method: 'DELETE' })
    fetch_()
  }

  const openPasswordModal = (admin: Admin) => {
    setPasswordTarget(admin)
    setPasswordForm({ currentPassword: '', password: '', confirmPassword: '' })
    setPasswordError('')
    setPasswordSuccess('')
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordTarget) return
    setPasswordError('')

    if (passwordForm.password !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    if (passwordForm.password.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }

    setSavingPassword(true)
    const isSelf = me?.id === passwordTarget.id
    const res = await fetch(`/api/admin/admins/${passwordTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: passwordForm.password,
        ...(isSelf ? { currentPassword: passwordForm.currentPassword } : {}),
      }),
    })
    const data = await res.json()
    setSavingPassword(false)

    if (!res.ok) {
      setPasswordError(data.error || 'Something went wrong')
      return
    }

    setPasswordSuccess('Password updated successfully')
    setPasswordForm({ currentPassword: '', password: '', confirmPassword: '' })
  }

  const canChangePassword = (admin: Admin) => me?.id === admin.id || !!me?.isRoot
  const canChangeRole = (admin: Admin) => !!me?.isRoot && me.id !== admin.id
  const canDelete = (admin: Admin) => !!me?.isRoot && me.id !== admin.id

  const handleRoleChange = async (admin: Admin, newRole: string) => {
    if (newRole === admin.role) return
    if (!confirm(`Change ${admin.name}'s role to "${newRole}"?`)) return

    setRoleUpdatingId(admin.id)
    const res = await fetch(`/api/admin/admins/${admin.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    const data = await res.json()
    setRoleUpdatingId(null)

    if (!res.ok) {
      alert(data.error || 'Something went wrong')
      return
    }
    fetch_()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Users</h1>
        <button onClick={() => setShowModal(true)} className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition">+ Add Admin</button>
      </div>
      {loading ? <p className="text-gray-500">Loading...</p> : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Email</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Role</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {admins.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{a.name}{me?.id === a.id && <span className="ml-2 text-xs text-gray-400">(you)</span>}</td>
                  <td className="px-6 py-4 text-gray-500">{a.email}</td>
                  <td className="px-6 py-4">
                    {canChangeRole(a) ? (
                      <select
                        value={a.role}
                        disabled={roleUpdatingId === a.id}
                        onChange={(e) => handleRoleChange(a, e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-medium border-0 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 ${a.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}
                      >
                        <option value="admin">admin</option>
                        <option value="superadmin">superadmin</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${a.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{a.role}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 space-x-3">
                    {canChangePassword(a) && (
                      <button onClick={() => openPasswordModal(a)} className="text-black hover:underline text-sm">Change Password</button>
                    )}
                    {canDelete(a) && <button onClick={() => handleDelete(a.id)} className="text-red-600 hover:underline text-sm">Delete</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Add Admin</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" required minLength={6} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black">
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition">Create</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {passwordTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-1">Change Password</h2>
            <p className="text-sm text-gray-500 mb-4">{passwordTarget.name} ({passwordTarget.email})</p>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {me?.id === passwordTarget.id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input type="password" value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" required />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" required minLength={6} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input type="password" value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" required minLength={6} />
              </div>
              {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
              {passwordSuccess && <p className="text-sm text-green-600">{passwordSuccess}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={savingPassword} className="flex-1 bg-black text-white py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition">
                  {savingPassword ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={() => setPasswordTarget(null)} className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition">Close</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
