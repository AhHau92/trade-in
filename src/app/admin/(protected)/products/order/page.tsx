'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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

interface ProductGroup {
  slug: string
  name: string
  image: string | null
  categoryName: string
  brandName: string
  conditions: string[]
  order: number
}

function SortableItem({ group, index }: { group: ProductGroup; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.slug })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 px-6 py-3 bg-white border-b ${isDragging ? 'shadow-lg opacity-90 rounded-lg' : 'hover:bg-gray-50'}`}
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-black px-1">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="3" r="1.5" /><circle cx="11" cy="3" r="1.5" />
          <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="13" r="1.5" /><circle cx="11" cy="13" r="1.5" />
        </svg>
      </button>
      <span className="text-gray-400 text-sm w-8 text-center">{index + 1}</span>
      {group.image ? (
        <Image src={group.image} alt={group.name} width={40} height={40} className="w-10 h-10 object-cover rounded-lg" />
      ) : (
        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">No img</div>
      )}
      <div className="flex-1">
        <p className="font-medium">{group.name}</p>
        <p className="text-xs text-gray-400">{group.categoryName} → {group.brandName}</p>
      </div>
      <div className="flex gap-1">
        {group.conditions.sort((a) => a === 'new' ? -1 : 1).map((c) => (
          <span key={c} className={`px-2 py-0.5 rounded-full text-xs font-medium ${c === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
            {c === 'new' ? 'New' : 'Used'}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function ProductOrderPage() {
  const [groups, setGroups] = useState<ProductGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterBrand, setFilterBrand] = useState('')
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const fetchAll = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('limit', '1000')
    if (filterCategory) params.set('categoryId', filterCategory)
    if (filterBrand) params.set('brandId', filterBrand)

    const [productsRes, catsRes, brandsRes] = await Promise.all([
      fetch(`/api/admin/products?${params}`),
      fetch('/api/admin/categories'),
      fetch('/api/admin/brands'),
    ])

    const data = await productsRes.json()
    setCategories(await catsRes.json())
    setBrands(await brandsRes.json())

    const grouped: Record<string, ProductGroup> = {}
    for (const p of data.products) {
      if (!grouped[p.slug]) {
        grouped[p.slug] = {
          slug: p.slug, name: p.name, image: p.image,
          categoryName: p.category.name, brandName: p.brand.name,
          conditions: [], order: p.order,
        }
      }
      if (!grouped[p.slug].conditions.includes(p.condition)) {
        grouped[p.slug].conditions.push(p.condition)
      }
    }

    setGroups(Object.values(grouped).sort((a, b) => a.order - b.order))
    setLoading(false)
    setHasChanges(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchAll is redefined every render; only re-run when filters change, not on every render
  useEffect(() => { fetchAll() }, [filterCategory, filterBrand])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setGroups((items) => {
      const oldIndex = items.findIndex((i) => i.slug === active.id)
      const newIndex = items.findIndex((i) => i.slug === over.id)
      return arrayMove(items, oldIndex, newIndex)
    })
    setHasChanges(true)
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/admin/products/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: groups.map((g, i) => ({ slug: g.slug, order: i })),
      }),
    })
    setSaving(false)
    setSaved(true)
    setHasChanges(false)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="text-gray-400 hover:text-black">← Products</Link>
          <h1 className="text-2xl font-bold">Product Order</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className={`px-6 py-2 rounded-lg transition ${
            hasChanges
              ? 'bg-black text-white hover:bg-gray-800'
              : saved
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Order'}
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black">
          <option value="">All Brands</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Drag to reorder. Same-name products (New/Used) share the same position.
      </p>

      {loading ? <p className="text-gray-500">Loading...</p> : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={groups.map(g => g.slug)} strategy={verticalListSortingStrategy}>
              {groups.map((group, index) => (
                <SortableItem key={group.slug} group={group} index={index} />
              ))}
            </SortableContext>
          </DndContext>
          {groups.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-400">No products to reorder</div>
          )}
        </div>
      )}
    </div>
  )
}