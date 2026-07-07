'use client'

import { useState, useEffect } from 'react'

interface Branch { id: string; name: string; address: string; order: number; isActive: boolean }

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Branch | null>(null)
  const [form, setForm] = useState({ name: '', address: '', order: 0 })

  const fetch_ = async () => { const r = await fetch('/api/admin/branches'); setBranches(await r.json()); setLoading(false) }
  useEffect(() => { fetch_() }, [])

  const openCreate = () => { setEditing(null); setForm({ name: '', address: '', order: 0 }); setShowModal(true) }
  const openEdit = (b: Branch) => { setEditing(b); setForm({ name: b.name, address: b.address, order: b.order }); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      await fetch(`/api/admin/branches/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, isActive: editing.isActive }) })
    } else {
      await fetch('/api/admin/branches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    setShowModal(false); fetch_()
  }

  const handleDelete = async (id: string) => { if (!confirm('Delete this branch?')) return; await fetch(`/api/admin/branches/${id}`, { method: 'DELETE' }); fetch_() }

  const toggleActive = async (b: Branch) => {
    await fetch(`/api/admin/branches/${b.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...b, isActive: !b.isActive }) })
    fetch_()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Branches</h1>
        <button onClick={openCreate} className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition">+ Add Branch</button>
      </div>
      {loading ? <p className="text-gray-500">Loading...</p> : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Address</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Order</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {branches.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{b.name}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{b.address}</td>
                  <td className="px-6 py-4 text-gray-500">{b.order}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleActive(b)} className={`px-2 py-1 rounded-full text-xs font-medium ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{b.isActive ? 'Active' : 'Inactive'}</button>
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <button onClick={() => openEdit(b)} className="text-blue-600 hover:underline text-sm">Edit</button>
                    <button onClick={() => handleDelete(b.id)} className="text-red-600 hover:underline text-sm">Delete</button>
                  </td>
                </tr>
              ))}
              {branches.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No branches yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Edit Branch' : 'Add Branch'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" placeholder="e.g. Tanjong Pagar Branch" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" rows={2} placeholder="Full address" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition">{editing ? 'Save' : 'Create'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}