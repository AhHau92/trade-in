'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import ImageUpload from '@/components/admin/ImageUpload'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Category {
  id: string
  name: string
  slug: string
  image: string | null
  order: number
  isActive: boolean
  _count: { brands: number }
}

// One row, made draggable via dnd-kit — same pattern used for products
// (/admin/products/order) and question templates (/admin/templates).
function SortableCategoryRow({
  category, index, onEdit, onDelete, onToggleActive,
}: {
  category: Category
  index: number
  onEdit: (c: Category) => void
  onDelete: (id: string) => void
  onToggleActive: (c: Category) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  }

  return (
    <tr ref={setNodeRef} style={style} className={`hover:bg-gray-50 ${isDragging ? 'shadow-lg bg-white' : ''}`}>
      <td className="px-3 py-4 w-8">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-black px-1">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="3" r="1.5" /><circle cx="11" cy="3" r="1.5" />
            <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
            <circle cx="5" cy="13" r="1.5" /><circle cx="11" cy="13" r="1.5" />
          </svg>
        </button>
      </td>
      <td className="px-6 py-4">
        {category.image ? (
          <Image src={category.image} alt={category.name} width={40} height={40} className="w-10 h-10 object-cover rounded-lg" />
        ) : (
          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">No img</div>
        )}
      </td>
      <td className="px-6 py-4 font-medium">{category.name}</td>
      <td className="px-6 py-4 text-gray-500">{category._count.brands}</td>
      <td className="px-6 py-4 text-gray-400 text-sm">{index + 1}</td>
      <td className="px-6 py-4">
        <button onClick={() => onToggleActive(category)} className={`px-2 py-1 rounded-full text-xs font-medium ${category.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {category.isActive ? 'Active' : 'Inactive'}
        </button>
      </td>
      <td className="px-6 py-4 space-x-2">
        <button onClick={() => onEdit(category)} className="text-blue-600 hover:underline text-sm">Edit</button>
        <button onClick={() => onDelete(category.id)} className="text-red-600 hover:underline text-sm">Delete</button>
      </td>
    </tr>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', image: '', order: 0 })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const fetchCategories = async () => {
    const res = await fetch('/api/admin/categories')
    const data = await res.json()
    setCategories(data)
    setLoading(false)
  }

  useEffect(() => { fetchCategories() }, [])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    let reordered: Category[] = []
    setCategories((items) => {
      const oldIndex = items.findIndex((c) => c.id === active.id)
      const newIndex = items.findIndex((c) => c.id === over.id)
      reordered = arrayMove(items, oldIndex, newIndex)
      return reordered
    })

    fetch('/api/admin/categories/reorder', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: reordered.map((c, i) => ({ id: c.id, order: i })) }),
    })
  }

  const openCreate = () => {
    setEditing(null)
    // New categories go to the end of the current drag order.
    setForm({ name: '', image: '', order: categories.length })
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

      {!loading && categories.length > 0 && (
        <p className="text-sm text-gray-500 mb-3">Drag the ⠿ handle to reorder — this is the order categories appear in on the storefront.</p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* DndContext/SortableContext must wrap the whole <table> rather than
              sit between <thead> and <tbody> — either component can render its
              own (non-table) DOM nodes, and a <div> directly inside <table> is
              invalid HTML that triggers a hydration error. Only <tbody> itself
              needs to be inside <table>. */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="w-8"></th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Image</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Brands</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Order</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {categories.map((cat, index) => (
                    <SortableCategoryRow key={cat.id} category={cat} index={index}
                      onEdit={openEdit} onDelete={handleDelete} onToggleActive={toggleActive} />
                  ))}
                  {categories.length === 0 && (
                    <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No categories yet</td></tr>
                  )}
                </tbody>
              </table>
            </SortableContext>
          </DndContext>
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
              {/* Order is no longer typed in by hand — drag the ⠿ handle on the
                  list to reorder categories instead. */}

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