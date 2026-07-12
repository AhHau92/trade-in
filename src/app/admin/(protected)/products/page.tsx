'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ImageUpload from '@/components/admin/ImageUpload'

interface Product {
  id: string; 
  name: string; 
  slug: string; 
  condition: string; 
  image: string | null
  order: number; 
  isActive: boolean; 
  brandId: string; 
  categoryId: string
  brand: { 
    name: string; 
    slug: string; 
    categories: { 
      category: { 
        slug: string } 
      }[] }
  category: { name: string }; 
  _count: { variants: number }; 
  createdAt: string;
  variantLabel: string;
}

interface Brand { id: string; name: string }
interface Category { id: string; name: string }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  // const [form, setForm] = useState({ name: '', image: '', order: 0, brandId: '', categoryId: '', condition: 'new' })

  // Pagination & filters
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterBrand, setFilterBrand] = useState('')
  const [filterCondition, setFilterCondition] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const limit = 20
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', image: '', order: 0, brandId: '', categoryId: '', condition: 'new', variantLabel: 'Device Built-In Storage' })

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', page.toString())
    params.set('limit', limit.toString())
    if (search) params.set('search', search)
    if (filterCategory) params.set('categoryId', filterCategory)
    if (filterBrand) params.set('brandId', filterBrand)
    if (filterCondition) params.set('condition', filterCondition)
    if (filterStatus) params.set('status', filterStatus)

    const res = await fetch(`/api/admin/products?${params}`)
    const data = await res.json()
    setProducts(data.products)
    setTotal(data.total)
    setTotalPages(data.totalPages)
    setLoading(false)
  }, [page, search, filterCategory, filterBrand, filterCondition, filterStatus])

  const fetchFilters = async () => {
    const [brandsRes, catsRes] = await Promise.all([fetch('/api/admin/brands'), fetch('/api/admin/categories')])
    setBrands(await brandsRes.json())
    setCategories(await catsRes.json())
  }

  useEffect(() => { fetchFilters() }, [])
  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  const clearFilters = () => {
    setSearch(''); setSearchInput(''); setFilterCategory(''); setFilterBrand(''); setFilterCondition(''); setFilterStatus(''); setPage(1)
  }

  const openCreate = () => {
    setEditing(null); setError('')
    setForm({ name: '', image: '', order: 0, brandId: brands[0]?.id || '', categoryId: categories[0]?.id || '', condition: 'new', variantLabel: 'Device Built-In Storage' })
    setShowModal(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p); setError('')
    setForm({ name: p.name, image: p.image || '', order: p.order, brandId: p.brandId, categoryId: p.categoryId, condition: p.condition, variantLabel: p.variantLabel || 'Device Built-In Storage' })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    let res
    if (editing) {
      res = await fetch(`/api/admin/products/${editing.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, isActive: editing.isActive }),
      })
    } else {
      res = await fetch('/api/admin/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    }

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Something went wrong')
      return
    }

    setShowModal(false); fetchProducts()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product and all its variants?')) return
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error || 'Failed to delete product')
      return
    }
    fetchProducts()
  }

  const toggleActive = async (p: Product) => {
    await fetch(`/api/admin/products/${p.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: p.name, image: p.image, order: p.order, brandId: p.brandId, categoryId: p.categoryId, condition: p.condition, variantLabel: p.variantLabel, isActive: !p.isActive }),
    }); fetchProducts()
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' })

  const hasFilters = search || filterCategory || filterBrand || filterCondition || filterStatus

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products <span className="text-gray-400 text-lg font-normal">({total})</span></h1>
        <div className="flex gap-3">
          <Link href="/admin/products/order" className="border px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm">↕ Reorder</Link>
          <button onClick={openCreate} className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition">+ Add Product</button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <form onSubmit={handleSearch} className="flex gap-3 mb-3">
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" placeholder="Search products..." />
          <button type="submit" className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition">Search</button>
          {hasFilters && <button type="button" onClick={clearFilters} className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Clear</button>}
        </form>
        <div className="flex flex-wrap gap-3">
          <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1) }}
            className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black">
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterBrand} onChange={(e) => { setFilterBrand(e.target.value); setPage(1) }}
            className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black">
            <option value="">All Brands</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={filterCondition} onChange={(e) => { setFilterCondition(e.target.value); setPage(1) }}
            className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black">
            <option value="">All Conditions</option>
            <option value="new">New</option>
            <option value="used">Used</option>
          </select>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
            className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Image</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Category</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Brand</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Condition</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Variants</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Created</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((p) => (
              <tr key={p.id} className={`hover:bg-gray-50 ${!p.isActive ? 'opacity-50' : ''}`}>
                <td className="px-6 py-4">
                  {p.image ? <Image src={p.image} alt={p.name} width={40} height={40} className="w-10 h-10 object-cover rounded-lg" />
                    : <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">No img</div>}
                </td>
                <td className="px-6 py-4 font-medium">{p.name}</td>
                <td className="px-6 py-4 text-gray-500 text-sm">{p.category.name}</td>
                <td className="px-6 py-4 text-gray-500">{p.brand.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.condition === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                    {p.condition === 'new' ? 'New' : 'Used'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">{p._count.variants}</td>
                <td className="px-6 py-4 text-gray-500 text-sm">{formatDate(p.createdAt)}</td>
                <td className="px-6 py-4">
                  <button onClick={() => toggleActive(p)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${p.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${p.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {p.brand.categories[0] && (
                      <Link href={`/${p.brand.categories[0].category.slug}/${p.brand.slug}/${p.slug}/${p.condition}`}
                        target="_blank" className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded hover:bg-gray-200 transition">👁</Link>
                    )}
                    <Link href={`/admin/products/${p.id}`} className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded hover:bg-purple-200 transition">Manage</Link>
                    <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline text-sm">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline text-sm">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && products.length === 0 && (
              <tr><td colSpan={9} className="px-6 py-8 text-center text-gray-400">{hasFilters ? 'No products match your filters' : 'No products yet'}</td></tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 rounded border text-sm disabled:opacity-30 hover:bg-gray-100 transition">Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .map((p, i, arr) => (
                  <span key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && <span className="px-2 text-gray-400">...</span>}
                    <button onClick={() => setPage(p)}
                      className={`px-3 py-1 rounded border text-sm transition ${p === page ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>{p}</button>
                  </span>
                ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1 rounded border text-sm disabled:opacity-30 hover:bg-gray-100 transition">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" required>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <select value={form.brandId} onChange={(e) => setForm({ ...form, brandId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" required>
                  <option value="">Select brand</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" placeholder="e.g. iPhone 17 Pro Max" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Variant Label</label>
                  <input type="text" value={form.variantLabel} onChange={(e) => setForm({ ...form, variantLabel: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" placeholder="e.g. Device Built-In Storage, Color, Size" />
                  <p className="text-xs text-gray-400 mt-1">This label shows above the variant selection on frontend</p>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setForm({ ...form, condition: 'new' })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition ${form.condition === 'new' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
                    🆕 New
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, condition: 'used' })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition ${form.condition === 'used' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-500'}`}>
                    ♻️ Used
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <ImageUpload value={form.image} onChange={(url) => setForm({ ...form, image: url })} folder="trade-in/products" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition">{editing ? 'Save Changes' : 'Create'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}