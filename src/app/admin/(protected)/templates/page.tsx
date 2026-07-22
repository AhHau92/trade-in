'use client'

import { useState, useEffect } from 'react'
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

interface TemplateOption {
  id?: string
  label: string
  priceAdjustCents: number
  isWhatsapp: boolean
  order: number
  imageUrl?: string
  description?: string
  defaultChecked?: boolean
}

interface Template {
  id: string
  title: string
  order: number
  isActive: boolean
  type?: string
  helpText?: string | null
  options: TemplateOption[]
  _count: { variants: number }
}

// One template card, made draggable via dnd-kit — same pattern as the
// product reorder page's SortableItem, just inline on this list instead of
// a separate /order route since this list is short and has no filters to
// justify a dedicated page.
function SortableTemplateCard({
  template, index, onEdit, onDelete, onToggleActive,
}: {
  template: Template
  index: number
  onEdit: (t: Template) => void
  onDelete: (id: string) => void
  onToggleActive: (t: Template) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: template.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style}
      className={`bg-white rounded-xl shadow-sm overflow-hidden ${isDragging ? 'shadow-lg opacity-90' : ''}`}>
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-black px-1 -ml-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="3" r="1.5" /><circle cx="11" cy="3" r="1.5" />
              <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="13" r="1.5" /><circle cx="11" cy="13" r="1.5" />
            </svg>
          </button>
          <span className="text-gray-400 text-sm w-5 text-center">{index + 1}</span>
          <span className="font-semibold">{template.title}</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
            {template.type === 'multi' ? 'Multi-select' : 'Single-select'}
          </span>
          <span className="text-gray-400 text-sm">Used in {template._count.variants} variant(s)</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${template.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {template.isActive ? 'Active' : 'Inactive'}
          </span>
          <button
            onClick={() => onToggleActive(template)}
            title={template.isActive ? 'Deactivate' : 'Activate'}
            aria-label={template.isActive ? 'Deactivate' : 'Activate'}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${template.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${template.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEdit(template)} className="text-sm text-blue-600 hover:underline">Edit</button>
          <button onClick={() => onDelete(template.id)} className="text-sm text-red-600 hover:underline">Delete</button>
        </div>
      </div>
      <div className="px-6 py-4 flex flex-wrap gap-2">
        {/* Pricing/WhatsApp is no longer configured at the template level — it's
            set per product via each variant's "Customize Options" override, so
            this list just shows the option labels themselves. */}
        {template.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-1 bg-gray-100 rounded-lg px-3 py-1.5 text-sm">
            <span>{opt.label}</span>
          </div>
        ))}
        {template.options.length === 0 && <span className="text-gray-400 text-sm">No options</span>}
      </div>
    </div>
  )
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)
  const [form, setForm] = useState({ title: '', order: 0, type: 'single', helpText: '', options: [] as TemplateOption[] })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const fetchTemplates = async () => {
    const res = await fetch('/api/admin/templates')
    setTemplates(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchTemplates() }, [])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    let reordered: Template[] = []
    setTemplates((items) => {
      const oldIndex = items.findIndex((t) => t.id === active.id)
      const newIndex = items.findIndex((t) => t.id === over.id)
      reordered = arrayMove(items, oldIndex, newIndex)
      return reordered
    })

    // Persist immediately (no separate "Save Order" step) — this list is
    // short enough that optimistic drag = done matches how the rest of this
    // page already auto-saves (e.g. the Active toggle).
    fetch('/api/admin/templates/reorder', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: reordered.map((t, i) => ({ id: t.id, order: i })) }),
    })
  }

  const openCreate = () => {
    setEditing(null)
    // New templates go to the end of the current drag order — order is no
    // longer something the admin types in by hand.
    setForm({ title: '', order: templates.length, type: 'single', helpText: '', options: [] })
    setShowModal(true)
  }

  const openEdit = (t: Template) => {
    setEditing(t)
    setForm({ title: t.title, order: t.order, type: t.type || 'single', helpText: t.helpText || '', options: t.options.map(o => ({ ...o })) })
    setShowModal(true)
  }

  const addOption = () => {
    setForm(prev => ({
      ...prev,
      options: [...prev.options, { label: '', priceAdjustCents: 0, isWhatsapp: false, order: prev.options.length, imageUrl: '', description: '', defaultChecked: false }],
    }))
  }

  const updateOption = (index: number, field: keyof TemplateOption, value: string | number | boolean) => {
    setForm(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? { ...opt, [field]: value } : opt),
    }))
  }

  const removeOption = (index: number) => {
    setForm(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== index) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      await fetch(`/api/admin/templates/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, isActive: editing.isActive }),
      })
    } else {
      await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    }
    setShowModal(false)
    fetchTemplates()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return
    const res = await fetch(`/api/admin/templates/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error || 'Failed to delete template')
      return
    }
    fetchTemplates()
  }

  const toggleActive = async (t: Template) => {
    await fetch(`/api/admin/templates/${t.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: t.title, order: t.order, isActive: !t.isActive, type: t.type || 'single', helpText: t.helpText || '', options: t.options }),
    })
    fetchTemplates()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Question Templates</h1>
          <p className="text-gray-500 text-sm mt-1">Reusable condition questions shared across product variants</p>
        </div>
        <button onClick={openCreate} className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition">
          + Add Template
        </button>
      </div>

      {!loading && templates.length > 0 && (
        <p className="text-sm text-gray-500 mb-4">Drag the ⠿ handle to reorder — this is the order questions appear in on the storefront.</p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={templates.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {templates.map((t, index) => (
                <SortableTemplateCard key={t.id} template={t} index={index}
                  onEdit={openEdit} onDelete={handleDelete} onToggleActive={toggleActive} />
              ))}
              {templates.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm px-6 py-12 text-center text-gray-400">
                  No templates yet — create one to get started
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Edit Template' : 'Add Template'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="e.g. Screen Condition"
                  required
                />
              </div>
              {/* Order is no longer typed in by hand — drag the ⠿ handle on the
                  list to reorder templates instead (see SortableTemplateCard). */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Selection type</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setForm({ ...form, type: 'single' })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition ${form.type !== 'multi' ? 'border-black bg-gray-50' : 'border-gray-200 text-gray-500'}`}>
                    ⚪ Single choice
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, type: 'multi' })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition ${form.type === 'multi' ? 'border-black bg-gray-50' : 'border-gray-200 text-gray-500'}`}>
                    ☑️ Multiple choice
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Multiple choice lets customers tick more than one option; their price adjustments are added together.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Help text (optional)</label>
                <textarea
                  value={form.helpText}
                  onChange={(e) => setForm({ ...form, helpText: e.target.value })}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Shown under the question title on the storefront"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Options</label>
                  <button type="button" onClick={addOption} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition">
                    + Add Option
                  </button>
                </div>
                <div className="space-y-2">
                  {form.options.map((opt, i) => (
                    <div key={i} className="border rounded-lg p-3 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={opt.label}
                          onChange={(e) => updateOption(i, 'label', e.target.value)}
                          className="flex-1 border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                          placeholder="Option label"
                          required
                        />
                        <button type="button" onClick={() => removeOption(i)} className="text-red-400 hover:text-red-600 text-sm px-2">✕</button>
                      </div>
                      {/* Price adjustment and WhatsApp-redirect are intentionally not
                          editable here — they're configured per product instead, via
                          each variant's "Customize Options" override (see
                          /admin/products/[id]). A template option is created here with
                          neutral defaults (±0, no WhatsApp) and every product decides
                          its own actual price/WhatsApp behavior for it. */}
                      {form.type === 'multi' && (
                        <label className="flex items-center gap-1.5 text-sm cursor-pointer whitespace-nowrap">
                          <input type="checkbox" checked={opt.defaultChecked || false}
                            onChange={(e) => updateOption(i, 'defaultChecked', e.target.checked)} className="w-3.5 h-3.5" />
                          Pre-checked
                        </label>
                      )}
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-400 select-none">+ Image / description (optional)</summary>
                        <div className="mt-2 space-y-2">
                          {/* Uploads to Cloudinary (same as product/brand/category images) rather than
                              a free-text URL field — the storefront can then trust every option image
                              actually lives on a domain it knows how to render. */}
                          <ImageUpload value={opt.imageUrl || ''} onChange={(url) => updateOption(i, 'imageUrl', url)} folder="trade-in/options" />
                          <textarea value={opt.description || ''} onChange={(e) => updateOption(i, 'description', e.target.value)} rows={2}
                            className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-black" placeholder="Short description shown under the option label" />
                        </div>
                      </details>
                    </div>
                  ))}
                  {form.options.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-2">No options yet — click &quot;+ Add Option&quot;</p>
                  )}
                </div>
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