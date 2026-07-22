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

interface Brand {
  id: string
  name: string
  slug: string
  image: string | null
  order: number
  isActive: boolean
  categories: { category: { id: string; name: string } }[]
  _count: { products: number }
}

interface Category {
  id: string
  name: string
}

// One row, made draggable via dnd-kit — same pattern used for products,
// categories, and question templates.
function SortableBrandRow({
  brand, index, onEdit, onDelete, onToggleActive,
}: {
  brand: Brand
  index: number
  onEdit: (b: Brand) => void
  onDelete: (id: string) => void
  onToggleActive: (b: Brand) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: brand.id })

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
        {brand.image ? (
          <Image src={brand.image} alt={brand.name} width={40} height={40} className="w-10 h-10 object-cover rounded-lg" />
        ) : (
          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">No img</div>
        )}
      </td>
      <td className="px-6 py-4 font-medium">{brand.name}</td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {brand.categories.map(c => (
            <span key={c.category.id} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
              {c.category.name}
            </span>
          ))}
        </div>
      </td>
      <td className="px-6 py-4 text-gray-500">{brand._count.products}</td>
      <td className="px-6 py-4 text-gray-400 text-sm">{index + 1}</td>
      <td className="px-6 py-4">
        <button onClick={() => onToggleActive(brand)} className={`px-2 py-1 rounded-full text-xs font-medium ${brand.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {brand.isActive ? 'Active' : 'Inactive'}
        </button>
      </td>
      <td className="px-6 py-4 space-x-2">
        <button onClick={() => onEdit(brand)} className="text-blue-600 hover:underline text-sm">Edit</button>
        <button onClick={() => onDelete(brand.id)} className="text-red-600 hover:underline text-sm">Delete</button>
      </td>
    </tr>
  )
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Brand | null>(null)
  const [form, setForm] = useState({ name: '', image: '', order: 0, categoryIds: [] as string[] })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const fetchAll = async () => {
    const [brandsRes, catsRes] = await Promise.all([
      fetch('/api/admin/brands'),
      fetch('/api/admin/categories'),
    ])
    setBrands(await brandsRes.json())
    setCategories(await catsRes.json())
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    let reordered: Brand[] = []
    setBrands((items) => {
      const oldIndex = items.findIndex((b) => b.id === active.id)
      const newIndex = items.findIndex((b) => b.id === over.id)
      reordered = arrayMove(items, oldIndex, newIndex)
      return reordered
    })

    fetch('/api/admin/brands/reorder', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: reordered.map((b, i) => ({ id: b.id, order: i })) }),
    })
  }

  const openCreate = () => {
    setEditing(null)
    // New brands go to the end of the current drag order.
    setForm({ name: '', image: '', order: brands.length, categoryIds: [] })
    setShowModal(true)
  }

  const openEdit = (brand: Brand) => {
    setEditing(brand)
    setForm({
      name: brand.name,
      image: brand.image || '',
      order: brand.order,
      categoryIds: brand.categories.map(c => c.category.id),
    })
    setShowModal(true)
  }

  const toggleCategory = (id: string) => {
    setForm(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter(c => c !== id)
        : [...prev.categoryIds, id],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      await fetch(`/api/admin/brands/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, isActive: editing.isActive }),
      })
    } else {
      await fetch('/api/admin/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    }
    setShowModal(false)
    fetchAll()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this brand?')) return
    const res = await fetch(`/api/admin/brands/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error || 'Failed to delete brand')
      return
    }
    fetchAll()
  }

  const toggleActive = async (brand: Brand) => {
    await fetch(`/api/admin/brands/${brand.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: brand.name,
        image: brand.image,
        order: brand.order,
        isActive: !brand.isActive,
        categoryIds: brand.categories.map(c => c.category.id),
      }),
    })
    fetchAll()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Brands</h1>
        <button onClick={openCreate} className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition">
          + Add Brand
        </button>
      </div>

      {!loading && brands.length > 0 && (
        <p className="text-sm text-gray-500 mb-3">Drag the ⠿ handle to reorder — this is the order brands appear in on the storefront.</p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* DndContext/SortableContext must wrap the whole <table> rather than
              sit between <thead> and <tbody> — a <div> directly inside <table>
              is invalid HTML and triggers a hydration error. Only <tbody>
              itself needs to be inside <table>. */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={brands.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="w-8"></th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Image</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Categories</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Products</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Order</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {brands.map((brand, index) => (
                    <SortableBrandRow key={brand.id} brand={brand} index={index}
                      onEdit={openEdit} onDelete={handleDelete} onToggleActive={toggleActive} />
                  ))}
                  {brands.length === 0 && (
                    <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-400">No brands yet</td></tr>
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
            <h2 className="text-lg font-bold mb-4">{editing ? 'Edit Brand' : 'Add Brand'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                        form.categoryIds.includes(cat.id)
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
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
                <ImageUpload value={form.image} onChange={(url) => setForm({ ...form, image: url })} folder="trade-in/brands" />
              </div>
              {/* Order is no longer typed in by hand — drag the ⠿ handle on the
                  list to reorder brands instead. */}

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