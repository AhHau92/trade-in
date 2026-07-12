'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { formatMoney, formatSignedMoney, dollarsToCents, centsToDollarsInput } from '@/lib/money'

interface TemplateOption { id: string; label: string; priceAdjustCents: number; isWhatsapp: boolean; order: number }
interface Template { id: string; title: string; options: TemplateOption[] }
interface Override { id: string; templateOptionId: string; priceAdjustCents: number; isHidden: boolean; isWhatsapp: boolean }
interface VariantQuestion { id: string; order: number; templateId: string; template: Template; overrides: Override[] }
interface Variant { id: string; name: string; basePriceCents: number; order: number; isActive: boolean; questions: VariantQuestion[] }
interface Product { id: string; name: string; brand: { name: string }; variants: Variant[] }

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [product, setProduct] = useState<Product | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  const [showVariantModal, setShowVariantModal] = useState(false)
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null)
  const [variantForm, setVariantForm] = useState({ name: '', basePriceCents: 0, order: 0 })

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignVariantId, setAssignVariantId] = useState<string | null>(null)

  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [editingVQ, setEditingVQ] = useState<VariantQuestion | null>(null)
  const [overrideForm, setOverrideForm] = useState<{ templateOptionId: string; priceAdjustCents: number; isHidden: boolean; isWhatsapp: boolean }[]>([])

  const fetchAll = async () => {
    const [productRes, templatesRes] = await Promise.all([
      fetch(`/api/admin/products/${id}`),
      fetch('/api/admin/templates'),
    ])
    setProduct(await productRes.json())
    setTemplates(await templatesRes.json())
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchAll is redefined every render; only re-run when `id` changes, not on every render
  useEffect(() => { fetchAll() }, [id])

  const openCreateVariant = () => { setEditingVariant(null); setVariantForm({ name: '', basePriceCents: 0, order: 0 }); setShowVariantModal(true) }
  const openEditVariant = (v: Variant) => { setEditingVariant(v); setVariantForm({ name: v.name, basePriceCents: v.basePriceCents, order: v.order }); setShowVariantModal(true) }

  const handleVariantSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingVariant) {
      await fetch(`/api/admin/variants/${editingVariant.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...variantForm, isActive: editingVariant.isActive }) })
    } else {
      await fetch(`/api/admin/products/${id}/variants`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(variantForm) })
    }
    setShowVariantModal(false); fetchAll()
  }

  const deleteVariant = async (variantId: string) => {
    if (!confirm('Delete this variant?')) return
    const res = await fetch(`/api/admin/variants/${variantId}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error || 'Failed to delete variant')
      return
    }
    fetchAll()
  }

  const toggleVariantActive = async (variant: Variant) => {
    await fetch(`/api/admin/variants/${variant.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: variant.name, basePriceCents: variant.basePriceCents, order: variant.order, isActive: !variant.isActive }),
    })
    fetchAll()
  }

  const duplicateVariant = async (variantId: string) => {
    await fetch(`/api/admin/variants/${variantId}/duplicate`, { method: 'POST' })
    fetchAll()
  }

  const openAssignTemplate = (variantId: string) => { setAssignVariantId(variantId); setShowAssignModal(true) }

  const assignTemplate = async (templateId: string, variantId: string) => {
    await fetch(`/api/admin/variants/${variantId}/questions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ templateId }) })
    setShowAssignModal(false); fetchAll()
  }

  const removeTemplate = async (variantId: string, templateId: string) => {
    if (!confirm('Remove this question?')) return
    await fetch(`/api/admin/variants/${variantId}/questions`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ templateId }) })
    fetchAll()
  }

  const openOverrides = (vq: VariantQuestion) => {
    setEditingVQ(vq)
    const form = vq.template.options.map(opt => {
      const existing = vq.overrides.find(o => o.templateOptionId === opt.id)
      return {
        templateOptionId: opt.id,
        priceAdjustCents: existing ? existing.priceAdjustCents : opt.priceAdjustCents,
        isHidden: existing ? existing.isHidden : false,
        isWhatsapp: existing ? existing.isWhatsapp : opt.isWhatsapp,
      }
    })
    setOverrideForm(form)
    setShowOverrideModal(true)
  }

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingVQ) return
    await fetch(`/api/admin/variant-questions/${editingVQ.id}/overrides`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overrides: overrideForm }),
    })
    setShowOverrideModal(false); fetchAll()
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>
  if (!product) return <div className="p-8 text-red-500">Product not found</div>

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="text-gray-400 hover:text-black">← Products</Link>
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <span className="text-gray-400 text-sm">({product.brand.name})</span>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Variants</h2>
        <button onClick={openCreateVariant} className="bg-black text-white px-3 py-1.5 rounded-lg text-sm hover:bg-gray-800 transition">+ Add Variant</button>
      </div>

      <div className="space-y-4">
        {product.variants.map((variant) => (
          <div key={variant.id} className={`bg-white rounded-xl shadow-sm overflow-hidden ${!variant.isActive ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="font-semibold">{variant.name}</span>
                <span className="text-green-600 font-medium">SGD {formatMoney(variant.basePriceCents)}</span>
                <button onClick={() => toggleVariantActive(variant)}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${variant.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {variant.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openAssignTemplate(variant.id)} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition">+ Assign Question</button>
                <button onClick={() => duplicateVariant(variant.id)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition">📋 Duplicate</button>
                <button onClick={() => openEditVariant(variant)} className="text-xs text-blue-600 hover:underline">Edit</button>
                <button onClick={() => deleteVariant(variant.id)} className="text-xs text-red-600 hover:underline">Delete</button>
              </div>
            </div>

            <div className="divide-y">
              {variant.questions.map((vq) => (
                <div key={vq.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-sm">❓ {vq.template.title}</span>
                    <div className="flex gap-2">
                      <button onClick={() => openOverrides(vq)} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200 transition">✏️ Customize Options</button>
                      <button onClick={() => removeTemplate(variant.id, vq.templateId)} className="text-xs text-red-500 hover:underline">Remove</button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-4">
                    {vq.template.options.map((opt) => {
                      const override = vq.overrides.find(o => o.templateOptionId === opt.id)
                      const isHidden = override?.isHidden || false
                      const priceCents = override ? override.priceAdjustCents : opt.priceAdjustCents
                      const isWA = override ? override.isWhatsapp : opt.isWhatsapp

                      if (isHidden) return (
                        <div key={opt.id} className="flex items-center gap-1 bg-gray-50 rounded-lg px-3 py-1.5 text-sm line-through text-gray-300">
                          <span>{opt.label}</span><span className="text-xs">(hidden)</span>
                        </div>
                      )

                      return (
                        <div key={opt.id} className="flex items-center gap-1 bg-gray-100 rounded-lg px-3 py-1.5 text-sm">
                          <span>{opt.label}</span>
                          {isWA ? (
                            <span className="text-green-600 font-medium ml-1">→ WhatsApp</span>
                          ) : (
                            <span className={`font-medium ml-1 ${priceCents < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                              {formatSignedMoney(priceCents)}
                            </span>
                          )}
                          {override && <span className="text-yellow-500 text-xs ml-1">★</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
              {variant.questions.length === 0 && (
                <div className="px-6 py-4 text-gray-400 text-sm">No questions assigned</div>
              )}
            </div>
          </div>
        ))}
        {product.variants.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm px-6 py-8 text-center text-gray-400">No variants yet</div>
        )}
      </div>

      {/* Variant Modal */}
      {showVariantModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">{editingVariant ? 'Edit Variant' : 'Add Variant'}</h2>
            <form onSubmit={handleVariantSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={variantForm.name} onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" placeholder="e.g. 512GB" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Base Price (SGD)</label>
                <input type="number" step="0.01" value={centsToDollarsInput(variantForm.basePriceCents)} onChange={(e) => setVariantForm({ ...variantForm, basePriceCents: dollarsToCents(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <input type="number" value={variantForm.order} onChange={(e) => setVariantForm({ ...variantForm, order: parseInt(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition">{editingVariant ? 'Save' : 'Create'}</button>
                <button type="button" onClick={() => setShowVariantModal(false)} className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Template Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Assign Question Template</h2>
            {templates.length === 0 ? (
              <div className="text-center py-4"><p className="text-gray-500 mb-3">No templates yet.</p>
                <Link href="/admin/templates" className="text-blue-600 hover:underline text-sm">Go create question templates first →</Link></div>
            ) : (
              <div className="space-y-2">
                {templates.map((t) => {
                  const variant = product.variants.find(v => v.id === assignVariantId)
                  const alreadyAssigned = variant?.questions.some(vq => vq.templateId === t.id)
                  return (
                    <button key={t.id} onClick={() => !alreadyAssigned && assignTemplate(t.id, assignVariantId!)} disabled={alreadyAssigned}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition ${alreadyAssigned ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'hover:border-black hover:bg-gray-50'}`}>
                      <p className="font-medium text-sm">{t.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t.options.length} options</p>
                      {alreadyAssigned && <span className="text-xs text-green-600">✓ Already assigned</span>}
                    </button>
                  )
                })}
              </div>
            )}
            <button onClick={() => setShowAssignModal(false)} className="w-full mt-4 border py-2 rounded-lg hover:bg-gray-50 transition text-sm">Close</button>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {showOverrideModal && editingVQ && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-1">Customize: {editingVQ.template.title}</h2>
            <p className="text-sm text-gray-500 mb-4">Override pricing and visibility for this specific variant</p>
            <form onSubmit={handleOverrideSubmit} className="space-y-3">
              {editingVQ.template.options.map((opt, i) => (
                <div key={opt.id} className={`border rounded-lg p-3 ${overrideForm[i]?.isHidden ? 'opacity-50 bg-gray-50' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{opt.label}</span>
                    <span className="text-xs text-gray-400">Default: {opt.isWhatsapp ? 'WhatsApp' : formatMoney(opt.priceAdjustCents)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input type="checkbox" checked={overrideForm[i]?.isHidden || false}
                        onChange={(e) => { const f = [...overrideForm]; f[i] = { ...f[i], isHidden: e.target.checked }; setOverrideForm(f) }} className="w-3.5 h-3.5" />
                      Hidden
                    </label>
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input type="checkbox" checked={overrideForm[i]?.isWhatsapp || false}
                        onChange={(e) => { const f = [...overrideForm]; f[i] = { ...f[i], isWhatsapp: e.target.checked }; setOverrideForm(f) }} className="w-3.5 h-3.5" />
                      WhatsApp
                    </label>
                    {!overrideForm[i]?.isHidden && !overrideForm[i]?.isWhatsapp && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Price:</span>
                        <input type="number" step="0.01" value={centsToDollarsInput(overrideForm[i]?.priceAdjustCents || 0)}
                          onChange={(e) => { const f = [...overrideForm]; f[i] = { ...f[i], priceAdjustCents: dollarsToCents(e.target.value) }; setOverrideForm(f) }}
                          className="w-24 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-black" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition">Save Overrides</button>
                <button type="button" onClick={() => setShowOverrideModal(false)} className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}