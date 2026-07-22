'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProductDetailsForm, { ProductFormState } from '@/components/admin/ProductDetailsForm'

interface Brand { id: string; name: string; slug: string }
interface Category { id: string; name: string; slug: string }

const emptyForm: ProductFormState = {
  name: '', slug: '', image: '', categoryId: '', brandId: '', condition: 'new',
  variantLabel: 'Device Built-In Storage', variantLabel2: '',
  introContent: '', seoContent: '', metaTitle: '', metaDescription: '',
  isActive: true,
}

export default function NewProductPage() {
  const router = useRouter()
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<ProductFormState>(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([fetch('/api/admin/brands'), fetch('/api/admin/categories')]).then(async ([b, c]) => {
      const brandsData = await b.json()
      const catsData = await c.json()
      setBrands(brandsData)
      setCategories(catsData)
      setForm((prev) => ({ ...prev, brandId: prev.brandId || brandsData[0]?.id || '', categoryId: prev.categoryId || catsData[0]?.id || '' }))
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    const res = await fetch('/api/admin/products', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Something went wrong')
      return
    }

    const created = await res.json()
    // Straight to the edit page — that's the only place variants can be
    // added (a variant needs a real productId to attach to), matching the
    // "save the product first, then add variants" flow.
    router.push(`/admin/products/${created.id}`)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="text-gray-400 hover:text-black">← Products</Link>
        <h1 className="text-2xl font-bold">Add New Product</h1>
      </div>

      <ProductDetailsForm
        form={form} setForm={setForm} categories={categories} brands={brands}
        onSubmit={handleSubmit} submitLabel="Create Product" error={error} saving={saving}
      />

      <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 text-sm flex gap-2">
        <span>💡</span>
        <span>Save this product first — you&apos;ll land straight on its page to add variants like 128GB, 256GB, etc.</span>
      </div>
    </div>
  )
}
