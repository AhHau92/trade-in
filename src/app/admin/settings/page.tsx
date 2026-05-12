'use client'

import { useState, useEffect } from 'react'

export default function SettingsPage() {
  const [form, setForm] = useState({ pickupFee: 0, currency: 'SGD', whatsappNumber: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(data => { setForm({ pickupFee: data.pickupFee, currency: data.currency, whatsappNumber: data.whatsappNumber }); setLoading(false) })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <p className="p-8 text-gray-500">Loading...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="bg-white rounded-xl shadow-sm p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black">
              <option value="SGD">SGD (Singapore Dollar)</option>
              <option value="MYR">MYR (Malaysian Ringgit)</option>
              <option value="USD">USD (US Dollar)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Fee</label>
            <input type="number" value={form.pickupFee} onChange={(e) => setForm({ ...form, pickupFee: parseFloat(e.target.value) })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
            <p className="text-xs text-gray-400 mt-1">Fee deducted when customer chooses pickup service</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
            <input type="text" value={form.whatsappNumber} onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" placeholder="+6591234567" />
            <p className="text-xs text-gray-400 mt-1">Customers will be directed to this WhatsApp number</p>
          </div>
          <button type="submit" disabled={saving} className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition">
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  )
}