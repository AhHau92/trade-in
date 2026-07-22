'use client'

import { useEffect, useState } from 'react'
import ImageUpload from '@/components/admin/ImageUpload'
import RichTextEditor from '@/components/admin/RichTextEditor'
import { slugify, slugifyLive } from '@/lib/slug'

// Shared "Product Details" form, used by both the Add Product page and the
// Edit Product page — previously these lived in two different places (a
// cramped modal on the list page for create/edit, vs. a completely separate
// page for managing variants), which is exactly the "can't tell where to add
// a product" confusion this consolidates. One form, one set of fields,
// reused wherever a product needs editing.
export interface ProductFormState {
  name: string
  slug: string
  image: string
  categoryId: string
  brandId: string
  condition: string
  variantLabel: string
  variantLabel2: string
  introContent: string
  seoContent: string
  metaTitle: string
  metaDescription: string
  isActive: boolean
}

interface Category { id: string; name: string; slug: string }
interface Brand { id: string; name: string; slug: string }

export default function ProductDetailsForm({
  form, setForm, categories, brands, onSubmit, submitLabel, error, saving,
}: {
  form: ProductFormState
  setForm: (updater: (prev: ProductFormState) => ProductFormState) => void
  categories: Category[]
  brands: Brand[]
  onSubmit: (e: React.FormEvent) => void
  submitLabel: string
  error: string
  saving?: boolean
}) {
  const set = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  // Live-follow the name into the slug (like a WordPress permalink editor)
  // until the admin directly edits the slug field — at that point they've
  // shown intent to control it manually, so typing in Name should stop
  // overwriting it. Starting state: for an existing product (slug already
  // has a value on mount) treat it as already "manually set" so opening the
  // edit page and tweaking the name doesn't silently change its live slug.
  const [slugTouched, setSlugTouched] = useState(() => !!form.slug)

  useEffect(() => {
    if (!slugTouched && form.name) set('slug', slugify(form.name))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the name changes
  }, [form.name, slugTouched])

  const selectedCategory = categories.find((c) => c.id === form.categoryId)
  const selectedBrand = brands.find((b) => b.id === form.brandId)
  const urlPreview = `/${selectedCategory?.slug || '…'}/${selectedBrand?.slug || '…'}/${form.slug || '…'}/${form.condition}`

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
      <h2 className="text-lg font-semibold">Product Details</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" placeholder="e.g. iPhone 17 Pro Max" required />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
        <div className="flex gap-2">
          <input type="text" value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugifyLive(e.target.value)) }}
            onBlur={(e) => set('slug', slugify(e.target.value))}
            className="flex-1 border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black" placeholder="iphone-17-pro-max" />
          <button type="button" onClick={() => { setSlugTouched(false); set('slug', slugify(form.name)) }}
            className="shrink-0 border px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition" title="Regenerate slug from the name, and resume auto-following it as the name changes">
            🔄 Sync from name
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1 font-mono">URL: {urlPreview}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" required>
            <option value="">Select category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
          <select value={form.brandId} onChange={(e) => set('brandId', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" required>
            <option value="">Select brand</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
        <div className="flex gap-3">
          <button type="button" onClick={() => set('condition', 'new')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition ${form.condition === 'new' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
            🆕 New
          </button>
          <button type="button" onClick={() => set('condition', 'used')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition ${form.condition === 'used' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-500'}`}>
            ♻️ Used
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Variant Label <span className="text-gray-400 font-normal">(Axis 1)</span></label>
          <input type="text" value={form.variantLabel} onChange={(e) => set('variantLabel', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" placeholder="e.g. Built-In Storage, Colour, Size" />
          <p className="text-xs text-gray-400 mt-1">Shown above the first variant selector on the storefront.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Second Axis Label <span className="text-gray-400 font-normal">(optional)</span></label>
          <input type="text" value={form.variantLabel2} onChange={(e) => set('variantLabel2', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" placeholder="e.g. Colour — leave blank for single-axis" />
          <p className="text-xs text-gray-400 mt-1">
            Only set this if base price also depends on a second attribute, e.g. <strong>256GB + Black</strong> is its own price.
            Each variant will then have both an Axis 1 and Axis 2 value.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
        <ImageUpload value={form.image} onChange={(url) => set('image', url)} folder="trade-in/products" />
      </div>

      <details className="border rounded-lg px-3 py-2 group">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 select-none">Content &amp; SEO (optional)</summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intro content</label>
            <RichTextEditor value={form.introContent} onChange={(html) => set('introContent', html)}
              placeholder="Shown above the quote builder, e.g. why trade in with us" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SEO content</label>
            <RichTextEditor value={form.seoContent} onChange={(html) => set('seoContent', html)}
              placeholder="Long-form copy shown below the quote builder, for SEO" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta title</label>
            <input type="text" value={form.metaTitle} onChange={(e) => set('metaTitle', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" placeholder={`Defaults to "${form.name || 'Product name'} Trade-In Value"`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta description</label>
            <textarea value={form.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" placeholder="Defaults to a generic trade-in description" />
          </div>
        </div>
      </details>

      <label className="flex items-center gap-2 text-sm cursor-pointer border-t pt-4">
        <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="w-4 h-4" />
        Active <span className="text-gray-400">(visible on storefront)</span>
      </label>

      <div className="pt-2">
        <button type="submit" disabled={saving}
          className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-50">
          {saving ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
