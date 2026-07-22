'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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
  variantLabel2: string | null;
  introContent: string | null;
  seoContent: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
}

interface Brand { id: string; name: string }
interface Category { id: string; name: string }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

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
      body: JSON.stringify({ name: p.name, image: p.image, order: p.order, brandId: p.brandId, categoryId: p.categoryId, condition: p.condition, variantLabel: p.variantLabel, variantLabel2: p.variantLabel2, isActive: !p.isActive }),
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
          <Link href="/admin/products/new" className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition">+ Add Product</Link>
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
                    <Link href={`/admin/products/${p.id}`} className="text-blue-600 hover:underline text-sm">Edit</Link>
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
    </div>
  )
}