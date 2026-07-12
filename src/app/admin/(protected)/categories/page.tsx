'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import ImageUpload from '@/components/admin/ImageUpload'

interface Category {
  id: string
  name: string
  slug: string
  image: string | null
  order: number
  isActive: boolean
  _count: { brands: number }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', image: '', order: 0 })

  const fetchCategories = async () => {
    const res = await fetch('/api/admin/categories')
    const data = await res.json()
    setCategories(data)
    setLoading(false)
  }

  useEffect(() => { fetchCategories() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', image: '', order: 0 })
    setShowModal(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setForm({ name: cat.name, image: cat.image || '', order: cat.order })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      await fetch(`/api/admin/categories/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, isActive: editing.isActive }),
      })
    } else {
      await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    }
    setShowModal(false)
    fetchCategories()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error || 'Failed to delete category')
      return
    }
    fetchCategories()
  }

  const toggleActive = async (cat: Category) => {
    await fetch(`/api/admin/categories/${cat.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cat.name, image: cat.image, order: cat.order, isActive: !cat.isActive }),
    })
    fetchCategories()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <button onClick={openCreate} className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition">
          + Add Category
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Image</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Brands</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Order</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {cat.image ? (
                      <Image src={cat.image} alt={cat.name} width={40} height={40} className="w-10 h-10 object-cover rounded-lg" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">No img</div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium">{cat.name}</td>
                  <td className="px-6 py-4 text-gray-500">{cat._count.brands}</td>
                  <td className="px-6 py-4 text-gray-500">{cat.order}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleActive(cat)} className={`px-2 py-1 rounded-full text-xs font-medium ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <button onClick={() => openEdit(cat)} className="text-blue-600 hover:underline text-sm">Edit</button>
                    <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:underline text-sm">Delete</button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No categories yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Edit Category' : 'Add Category'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <ImageUpload value={form.image} onChange={(url) => setForm({ ...form, image: url })} folder="trade-in/categories" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition">
                  {editing ? 'Save Changes' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}