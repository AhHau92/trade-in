'use client'

import { useState, useEffect } from 'react'

interface TemplateOption {
  id?: string
  label: string
  priceAdjust: number
  isWhatsapp: boolean
  order: number
}

interface Template {
  id: string
  title: string
  order: number
  isActive: boolean
  options: TemplateOption[]
  _count: { variants: number }
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)
  const [form, setForm] = useState({ title: '', order: 0, options: [] as TemplateOption[] })

  const fetchTemplates = async () => {
    const res = await fetch('/api/admin/templates')
    setTemplates(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchTemplates() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', order: 0, options: [] })
    setShowModal(true)
  }

  const openEdit = (t: Template) => {
    setEditing(t)
    setForm({ title: t.title, order: t.order, options: t.options.map(o => ({ ...o })) })
    setShowModal(true)
  }

  const addOption = () => {
    setForm(prev => ({
      ...prev,
      options: [...prev.options, { label: '', priceAdjust: 0, isWhatsapp: false, order: prev.options.length }],
    }))
  }

  const updateOption = (index: number, field: string, value: any) => {
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
      body: JSON.stringify({ title: t.title, order: t.order, isActive: !t.isActive, options: t.options }),
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

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="space-y-4">
          {templates.map((t) => (
            <div key={t.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{t.title}</span>
                  <span className="text-gray-400 text-sm">Used in {t._count.variants} variant(s)</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {t.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => toggleActive(t)}
                    title={t.isActive ? 'Deactivate' : 'Activate'}
                    aria-label={t.isActive ? 'Deactivate' : 'Activate'}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${t.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${t.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(t)} className="text-sm text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(t.id)} className="text-sm text-red-600 hover:underline">Delete</button>
                </div>
              </div>
              <div className="px-6 py-4 flex flex-wrap gap-2">
                {t.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-1 bg-gray-100 rounded-lg px-3 py-1.5 text-sm">
                    <span>{opt.label}</span>
                    {opt.isWhatsapp ? (
                      <span className="text-green-600 font-medium ml-1">→ WhatsApp</span>
                    ) : (
                      <span className={`font-medium ml-1 ${opt.priceAdjust < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {opt.priceAdjust === 0 ? '±0' : opt.priceAdjust > 0 ? `+${opt.priceAdjust}` : opt.priceAdjust}
                      </span>
                    )}
                  </div>
                ))}
                {t.options.length === 0 && <span className="text-gray-400 text-sm">No options</span>}
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm px-6 py-12 text-center text-gray-400">
              No templates yet — create one to get started
            </div>
          )}
        </div>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
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
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={opt.isWhatsapp}
                            onChange={(e) => updateOption(i, 'isWhatsapp', e.target.checked)}
                            className="w-3.5 h-3.5"
                          />
                          WhatsApp redirect
                        </label>
                        {!opt.isWhatsapp && (
                          <div className="flex items-center gap-1 flex-1">
                            <span className="text-xs text-gray-500">Price adj:</span>
                            <input
                              type="number"
                              value={opt.priceAdjust}
                              onChange={(e) => updateOption(i, 'priceAdjust', parseFloat(e.target.value))}
                              className="flex-1 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                              placeholder="e.g. -100"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {form.options.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-2">No options yet — click "+ Add Option"</p>
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