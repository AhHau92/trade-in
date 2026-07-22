'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { formatMoney, formatSignedMoney, dollarsToCents, centsToDollarsInput } from '@/lib/money'
import ProductDetailsForm, { ProductFormState } from '@/components/admin/ProductDetailsForm'
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

interface TemplateOption { id: string; label: string; priceAdjustCents: number; isWhatsapp: boolean; order: number; imageUrl?: string | null; description?: string | null; defaultChecked?: boolean }
interface Template { id: string; title: string; type?: string; helpText?: string | null; options: TemplateOption[] }
interface Override { id: string; templateOptionId: string; priceAdjustCents: number; isHidden: boolean; isWhatsapp: boolean }
interface SubsetEntry { id: string; templateOptionId: string; order: number }
interface VariantQuestion { id: string; order: number; templateId: string; template: Template; overrides: Override[]; optionsConfigured: boolean; options: SubsetEntry[] }
interface Variant { id: string; name: string; axis2Value: string | null; basePriceCents: number; order: number; isActive: boolean; isWhatsappOnly: boolean; questions: VariantQuestion[] }
interface Product {
  id: string; name: string; slug: string; condition: string; image: string | null
  variantLabel: string; variantLabel2: string | null; isActive: boolean
  introContent: string | null; seoContent: string | null; metaTitle: string | null; metaDescription: string | null
  categoryId: string; brandId: string
  brand: { name: string; slug: string }; category: { name: string; slug: string }
  variants: Variant[]
}
interface Category { id: string; name: string; slug: string }
interface Brand { id: string; name: string; slug: string }

const toFormState = (p: Product): ProductFormState => ({
  name: p.name, slug: p.slug, image: p.image || '', categoryId: p.categoryId, brandId: p.brandId, condition: p.condition,
  variantLabel: p.variantLabel || 'Device Built-In Storage', variantLabel2: p.variantLabel2 || '',
  introContent: p.introContent || '', seoContent: p.seoContent || '', metaTitle: p.metaTitle || '', metaDescription: p.metaDescription || '',
  isActive: p.isActive,
})

// One variant card, made draggable via dnd-kit — same pattern used for
// products/categories/brands/templates. Everything below the drag
// handle/index is unchanged from the plain (non-sortable) version.
function SortableVariantCard({
  variant, index, onAssignTemplate, onDuplicate, onEdit, onDelete, onToggleActive, onConfigureOptions, onCustomizeOptions, onRemoveTemplate,
}: {
  variant: Variant
  index: number
  onAssignTemplate: (variantId: string) => void
  onDuplicate: (variantId: string) => void
  onEdit: (v: Variant) => void
  onDelete: (variantId: string) => void
  onToggleActive: (v: Variant) => void
  onConfigureOptions: (vq: VariantQuestion) => void
  onCustomizeOptions: (vq: VariantQuestion) => void
  onRemoveTemplate: (variantId: string, templateId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: variant.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style}
      className={`bg-white rounded-xl shadow-sm overflow-hidden ${!variant.isActive ? 'opacity-60' : ''} ${isDragging ? 'shadow-lg' : ''}`}>
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-black px-1 -ml-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="3" r="1.5" /><circle cx="11" cy="3" r="1.5" />
              <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="13" r="1.5" /><circle cx="11" cy="13" r="1.5" />
            </svg>
          </button>
          <span className="text-gray-400 text-sm">{index + 1}</span>
          <span className="font-semibold">{variant.name}{variant.axis2Value ? ` / ${variant.axis2Value}` : ''}</span>
          {variant.isWhatsappOnly ? (
            <span className="text-green-600 font-medium text-sm">💬 WhatsApp only</span>
          ) : (
            <span className="text-green-600 font-medium">SGD {formatMoney(variant.basePriceCents)}</span>
          )}
          <button onClick={() => onToggleActive(variant)}
            className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${variant.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {variant.isActive ? 'Active' : 'Inactive'}
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onAssignTemplate(variant.id)} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition">+ Assign Question</button>
          <button onClick={() => onDuplicate(variant.id)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition">📋 Duplicate</button>
          <button onClick={() => onEdit(variant)} className="text-xs text-blue-600 hover:underline">Edit</button>
          <button onClick={() => onDelete(variant.id)} className="text-xs text-red-600 hover:underline">Delete</button>
        </div>
      </div>

      <div className="divide-y">
        {variant.questions.map((vq) => (
          <div key={vq.id} className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-sm">
                ❓ {vq.template.title}
                {vq.template.type === 'multi' && <span className="ml-2 text-xs font-normal text-indigo-500">(multi-select)</span>}
                {vq.optionsConfigured ? (
                  <span className="ml-2 text-xs font-normal text-orange-500">({vq.options.length} of {vq.template.options.length} shown)</span>
                ) : (
                  <span className="ml-2 text-xs font-normal text-gray-400">(all options shown)</span>
                )}
              </span>
              <div className="flex gap-2">
                <button onClick={() => onConfigureOptions(vq)} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200 transition">🎛️ Configure Options</button>
                <button onClick={() => onCustomizeOptions(vq)} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200 transition">✏️ Customize Options</button>
                <button onClick={() => onRemoveTemplate(variant.id, vq.templateId)} className="text-xs text-red-500 hover:underline">Remove</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 ml-4">
              {(vq.optionsConfigured ? vq.template.options.filter(o => vq.options.some(so => so.templateOptionId === o.id)) : vq.template.options).map((opt) => {
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
  )
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [product, setProduct] = useState<Product | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)

  // Product Details form — lives on this same page now instead of a modal on
  // the list page, so editing a product's own fields and managing its
  // variants are no longer two disconnected places.
  const [detailsForm, setDetailsForm] = useState<ProductFormState | null>(null)
  const [detailsError, setDetailsError] = useState('')
  const [detailsSaving, setDetailsSaving] = useState(false)

  const [showVariantModal, setShowVariantModal] = useState(false)
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null)
  // templateIds lets the create/edit variant modal double as a lightweight
  // "assign questions" step too — checking templates here is diffed against
  // what's already assigned (edit) or just applied after creation (create),
  // so admins don't have to open the separate "+ Assign Question" flow for
  // the common case of wiring up questions right when they add a variant.
  const [variantForm, setVariantForm] = useState({ name: '', axis2Value: '', basePriceCents: 0, order: 0, isWhatsappOnly: false, templateIds: new Set<string>() })

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignVariantId, setAssignVariantId] = useState<string | null>(null)

  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [editingVQ, setEditingVQ] = useState<VariantQuestion | null>(null)
  const [overrideForm, setOverrideForm] = useState<{ templateOptionId: string; priceAdjustCents: number; isHidden: boolean; isWhatsapp: boolean }[]>([])

  const [showSubsetModal, setShowSubsetModal] = useState(false)
  const [editingSubsetVQ, setEditingSubsetVQ] = useState<VariantQuestion | null>(null)
  const [subsetForm, setSubsetForm] = useState<{ configured: boolean; selectedIds: Set<string> }>({ configured: false, selectedIds: new Set() })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const fetchAll = async () => {
    const [productRes, templatesRes, categoriesRes, brandsRes] = await Promise.all([
      fetch(`/api/admin/products/${id}`),
      fetch('/api/admin/templates'),
      fetch('/api/admin/categories'),
      fetch('/api/admin/brands'),
    ])
    const productData: Product = await productRes.json()
    setProduct(productData)
    setDetailsForm(toFormState(productData))
    setTemplates(await templatesRes.json())
    setCategories(await categoriesRes.json())
    setBrands(await brandsRes.json())
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchAll is redefined every render; only re-run when `id` changes, not on every render
  useEffect(() => { fetchAll() }, [id])

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!detailsForm) return
    setDetailsError('')
    setDetailsSaving(true)
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(detailsForm),
    })
    setDetailsSaving(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setDetailsError(data.error || 'Something went wrong')
      return
    }
    fetchAll()
  }

  const handleVariantDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !product) return

    let reordered: Variant[] = []
    setProduct((prev) => {
      if (!prev) return prev
      const oldIndex = prev.variants.findIndex((v) => v.id === active.id)
      const newIndex = prev.variants.findIndex((v) => v.id === over.id)
      reordered = arrayMove(prev.variants, oldIndex, newIndex)
      return { ...prev, variants: reordered }
    })

    fetch(`/api/admin/products/${id}/variants/reorder`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: reordered.map((v, i) => ({ id: v.id, order: i })) }),
    })
  }

  const openCreateVariant = () => { setEditingVariant(null); setVariantForm({ name: '', axis2Value: '', basePriceCents: 0, order: product?.variants.length || 0, isWhatsappOnly: false, templateIds: new Set() }); setShowVariantModal(true) }
  const openEditVariant = (v: Variant) => { setEditingVariant(v); setVariantForm({ name: v.name, axis2Value: v.axis2Value || '', basePriceCents: v.basePriceCents, order: v.order, isWhatsappOnly: v.isWhatsappOnly, templateIds: new Set(v.questions.map(q => q.templateId)) }); setShowVariantModal(true) }

  const toggleVariantTemplate = (templateId: string) => {
    setVariantForm((prev) => {
      const next = new Set(prev.templateIds)
      if (next.has(templateId)) next.delete(templateId); else next.add(templateId)
      return { ...prev, templateIds: next }
    })
  }

  // Applies the checked/unchecked template set from the modal to a variant —
  // shared by both create (against a brand-new, question-less variant) and
  // edit (diffed against whatever was already assigned).
  const syncVariantTemplates = async (variantId: string, prevIds: Set<string>) => {
    const nextIds = variantForm.templateIds
    const toAdd = [...nextIds].filter((tid) => !prevIds.has(tid))
    const toRemove = [...prevIds].filter((tid) => !nextIds.has(tid))
    await Promise.all([
      ...toAdd.map((templateId) => fetch(`/api/admin/variants/${variantId}/questions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ templateId }),
      })),
      ...toRemove.map((templateId) => fetch(`/api/admin/variants/${variantId}/questions`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ templateId }),
      })),
    ])
  }

  const handleVariantSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { templateIds, ...variantFields } = variantForm
    if (editingVariant) {
      await fetch(`/api/admin/variants/${editingVariant.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...variantFields, isActive: editingVariant.isActive }) })
      await syncVariantTemplates(editingVariant.id, new Set(editingVariant.questions.map(q => q.templateId)))
    } else {
      const res = await fetch(`/api/admin/products/${id}/variants`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(variantFields) })
      const created = await res.json()
      if (templateIds.size > 0) await syncVariantTemplates(created.id, new Set())
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
      body: JSON.stringify({ name: variant.name, axis2Value: variant.axis2Value, basePriceCents: variant.basePriceCents, order: variant.order, isActive: !variant.isActive, isWhatsappOnly: variant.isWhatsappOnly }),
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

  const openSubset = (vq: VariantQuestion) => {
    setEditingSubsetVQ(vq)
    setSubsetForm({
      configured: vq.optionsConfigured,
      // Unconfigured (legacy/"show all") starts with everything checked so
      // turning "custom subset" on doesn't silently hide options the admin
      // never actively deselected.
      selectedIds: vq.optionsConfigured
        ? new Set(vq.options.map(o => o.templateOptionId))
        : new Set(vq.template.options.map(o => o.id)),
    })
    setShowSubsetModal(true)
  }

  const toggleSubsetOption = (optionId: string) => {
    setSubsetForm(prev => {
      const next = new Set(prev.selectedIds)
      if (next.has(optionId)) next.delete(optionId); else next.add(optionId)
      return { ...prev, selectedIds: next }
    })
  }

  const handleSubsetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSubsetVQ) return
    await fetch(`/api/admin/variant-questions/${editingSubsetVQ.id}/option-subset`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionsConfigured: subsetForm.configured, optionIds: Array.from(subsetForm.selectedIds) }),
    })
    setShowSubsetModal(false); fetchAll()
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>
  if (!product || !detailsForm) return <div className="p-8 text-red-500">Product not found</div>

  const viewOnSiteUrl = `/${product.category.slug}/${product.brand.slug}/${product.slug}/${product.condition}`

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="text-gray-400 hover:text-black">← Products</Link>
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <span className="text-gray-400 text-sm">({product.brand.name})</span>
        <Link href={viewOnSiteUrl} target="_blank" className="ml-auto text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition">
          👁 View on Site
        </Link>
      </div>

      <div className="mb-8">
        <ProductDetailsForm
          form={detailsForm} setForm={(updater) => setDetailsForm((prev) => (prev ? updater(prev) : prev))}
          categories={categories} brands={brands}
          onSubmit={handleDetailsSubmit} submitLabel="Save Changes" error={detailsError} saving={detailsSaving}
        />
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Variants</h2>
        <button onClick={openCreateVariant} className="bg-black text-white px-3 py-1.5 rounded-lg text-sm hover:bg-gray-800 transition">+ Add Variant</button>
      </div>

      {product.variants.length > 0 && (
        <p className="text-sm text-gray-500 mb-3">Drag the ⠿ handle to reorder — this is the order variants appear in on the storefront.</p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleVariantDragEnd}>
        <SortableContext items={product.variants.map((v) => v.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {product.variants.map((variant, index) => (
              <SortableVariantCard key={variant.id} variant={variant} index={index}
                onAssignTemplate={openAssignTemplate} onDuplicate={duplicateVariant} onEdit={openEditVariant}
                onDelete={deleteVariant} onToggleActive={toggleVariantActive}
                onConfigureOptions={openSubset} onCustomizeOptions={openOverrides} onRemoveTemplate={removeTemplate} />
            ))}
            {product.variants.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm px-6 py-8 text-center text-gray-400">No variants yet</div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Variant Modal */}
      {showVariantModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">{editingVariant ? 'Edit Variant' : 'Add Variant'}</h2>
            <form onSubmit={handleVariantSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{product.variantLabel || 'Name'}</label>
                <input type="text" value={variantForm.name} onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" placeholder="e.g. 512GB" required /></div>
              {product.variantLabel2 && (
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{product.variantLabel2}</label>
                  <input type="text" value={variantForm.axis2Value} onChange={(e) => setVariantForm({ ...variantForm, axis2Value: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" placeholder="e.g. Black" required /></div>
              )}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Base Price (SGD)</label>
                <input type="number" step="0.01" value={centsToDollarsInput(variantForm.basePriceCents)} onChange={(e) => setVariantForm({ ...variantForm, basePriceCents: dollarsToCents(e.target.value) })}
                  disabled={variantForm.isWhatsappOnly}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-100 disabled:text-gray-400" required={!variantForm.isWhatsappOnly} /></div>
              {/* Order is no longer typed in by hand — drag the ⠿ handle on the
                  Variants list to reorder instead. */}
              <label className="flex items-start gap-2 text-sm cursor-pointer border rounded-lg p-3 bg-gray-50">
                <input type="checkbox" checked={variantForm.isWhatsappOnly}
                  onChange={(e) => setVariantForm({ ...variantForm, isWhatsappOnly: e.target.checked })} className="w-3.5 h-3.5 mt-0.5" />
                <span>
                  <span className="font-medium">WhatsApp only</span>
                  <p className="text-xs text-gray-400 mt-0.5">Skip the condition questions and price — the storefront sends customers straight to WhatsApp for this variant.</p>
                </span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Templates</label>
                <div className="border rounded-lg max-h-40 overflow-y-auto divide-y">
                  {templates.length === 0 ? (
                    <p className="text-xs text-gray-400 px-3 py-2">
                      No templates yet — <Link href="/admin/templates" className="text-blue-600 hover:underline">create one first</Link>.
                    </p>
                  ) : (
                    templates.map((t) => (
                      <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer px-3 py-1.5 hover:bg-gray-50">
                        <input type="checkbox" checked={variantForm.templateIds.has(t.id)}
                          onChange={() => toggleVariantTemplate(t.id)} className="w-3.5 h-3.5" />
                        {t.title} <span className="text-xs text-gray-400">({t.options.length} options)</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">Pick which condition questions this variant uses — you can fine-tune pricing per option afterwards.</p>
              </div>

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

      {/* Option Subset Modal */}
      {showSubsetModal && editingSubsetVQ && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-1">Configure Options: {editingSubsetVQ.template.title}</h2>
            <p className="text-sm text-gray-500 mb-4">Pick which of this question&apos;s options this variant actually offers.</p>
            <form onSubmit={handleSubsetSubmit} className="space-y-3">
              <label className="flex items-start gap-2 text-sm cursor-pointer border rounded-lg p-3 bg-gray-50">
                <input type="checkbox" checked={subsetForm.configured}
                  onChange={(e) => setSubsetForm(prev => ({ ...prev, configured: e.target.checked }))} className="w-3.5 h-3.5 mt-0.5" />
                <span>
                  <span className="font-medium">Use a custom subset</span>
                  <p className="text-xs text-gray-400 mt-0.5">Off = show every option on this template (default). On = only the options checked below are offered for this variant.</p>
                </span>
              </label>

              <div className={`space-y-1 ${!subsetForm.configured ? 'opacity-40 pointer-events-none' : ''}`}>
                {editingSubsetVQ.template.options.map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 text-sm cursor-pointer px-2 py-1.5 rounded hover:bg-gray-50">
                    <input type="checkbox" checked={subsetForm.selectedIds.has(opt.id)}
                      onChange={() => toggleSubsetOption(opt.id)} className="w-3.5 h-3.5" />
                    {opt.label}
                  </label>
                ))}
                {editingSubsetVQ.template.options.length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-2">This template has no options yet</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition">Save</button>
                <button type="button" onClick={() => setShowSubsetModal(false)} className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}