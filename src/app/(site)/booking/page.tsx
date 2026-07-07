'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface BookingData {
  variantId: string
  productName: string
  variantName: string
  productImage: string | null
  condition: string
  finalPrice: number
  selectedOptions: { question: string; answer: string; priceAdjust: number }[]
  currency: string
  pickupFee: number
}

interface Branch { id: string; name: string; address: string }

export default function BookingPage() {
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [settings, setSettings] = useState({ pickupFee: 0, currency: 'SGD', whatsappNumber: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const [appointmentType, setAppointmentType] = useState<'store' | 'pickup'>('store')
  const [form, setForm] = useState({
    name: '', email: '', phone: '', postcode: '',
    branchId: '', visitDate: '',
    address: '', collectionDate: '', collectionTime: '',
  })

  useEffect(() => {
    const saved = localStorage.getItem('tradeInBooking')
    if (saved) {
      const data = JSON.parse(saved)
      setBookingData(data)
      setSettings({ pickupFee: data.pickupFee, currency: data.currency, whatsappNumber: '' })
    }

    Promise.all([
      fetch('/api/public/branches').then(r => r.json()),
      fetch('/api/public/settings').then(r => r.json()),
    ]).then(([br, sett]) => {
      setBranches(br)
      setSettings(sett)
      setLoading(false)
    })
  }, [])

  const displayPrice = appointmentType === 'pickup' && bookingData
    ? bookingData.finalPrice - settings.pickupFee
    : bookingData?.finalPrice || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingData) return
    setSubmitting(true)

    const res = await fetch('/api/public/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentType,
        variantId: bookingData.variantId,
        finalPrice: displayPrice,
        selectedOptions: bookingData.selectedOptions,
        name: form.name,
        email: form.email,
        phone: form.phone,
        postcode: form.postcode,
        branchId: appointmentType === 'store' ? form.branchId : null,
        visitDate: appointmentType === 'store' ? form.visitDate : null,
        address: appointmentType === 'pickup' ? form.address : null,
        collectionDate: appointmentType === 'pickup' ? form.collectionDate : null,
        collectionTime: appointmentType === 'pickup' ? form.collectionTime : null,
      }),
    })

    const data = await res.json()
    setSubmitting(false)

    if (data.bookingRef) {
      setSuccess(data.bookingRef)
      localStorage.removeItem('tradeInBooking')
    }
  }

  if (loading) return <div className="flex items-center justify-center py-24 text-gray-400">Loading...</div>

  if (!bookingData) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-gray-500">No trade-in data found.</p>
        <Link href="/" className="text-blue-600 hover:underline">← Start a new trade-in</Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
        <p className="text-gray-500 mb-4">Your reference number is:</p>
        <p className="text-3xl font-bold text-green-600 mb-8">{success}</p>
        <p className="text-gray-500 mb-8">We've received your booking. You'll receive a confirmation email shortly.</p>
        <Link href="/" className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition">
          Back to Home
        </Link>
      </div>
    )
  }

  const timeSlots = ['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM']

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => window.history.back()} className="text-sm text-gray-500 hover:text-black mb-4">← Back</button>
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step <= 3 ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step}
              </div>
              {step < 4 && <div className={`w-16 h-0.5 ${step < 4 ? 'bg-black' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-center mb-2">Book Your Trade-In</h2>
        <p className="text-gray-500 text-center mb-8">Please confirm your details below and submit the form.</p>

        {/* Trade-In Checklist */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-6">
            {bookingData.productImage ? (
              <img src={bookingData.productImage} alt={bookingData.productName} className="w-24 h-24 object-contain" />
            ) : (
              <div className="w-24 h-24 bg-gray-200 rounded-xl flex items-center justify-center text-3xl">📱</div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2">Trade-In Checklist</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Model:</span> {bookingData.productName}</p>
                <p><span className="font-medium">{bookingData.variantName}</span></p>
                {bookingData.selectedOptions.map((opt, i) => (
                  <p key={i}><span className="font-medium">{opt.question}:</span> {opt.answer}</p>
                ))}
              </div>
              <div className={`inline-block mt-3 px-4 py-2 rounded-lg font-semibold ${appointmentType === 'pickup' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                You get: {settings.currency} {displayPrice.toLocaleString()}
                {appointmentType === 'pickup' && (
                  <span className="text-xs font-normal ml-1">(Pick-up fee already deducted)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Appointment Type */}
          <div className="bg-gray-50 rounded-2xl p-6">
            <h3 className="font-semibold mb-3">Appointment Type</h3>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setAppointmentType('store')}
                className={`border-2 rounded-xl p-4 text-center transition ${appointmentType === 'store' ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-black'}`}>
                🏪 Store Visit
              </button>
              <button type="button" onClick={() => setAppointmentType('pickup')}
                className={`border-2 rounded-xl p-4 text-center transition ${appointmentType === 'pickup' ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-black'}`}>
                🚚 Pickup Service
              </button>
            </div>

            {appointmentType === 'pickup' && (
              <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-sm text-yellow-700">
                🚚 {settings.currency} {settings.pickupFee} courier pick-up fee has been deducted from the final amount.
              </div>
            )}
          </div>

          {/* Store Visit Fields */}
          {appointmentType === 'store' && (
            <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Branch</label>
                  <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" required>
                    <option value="">-- Select a Branch --</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date</label>
                  <input type="date" value={form.visitDate} onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    min={new Date().toISOString().split('T')[0]} required />
                </div>
              </div>
            </div>
          )}

          {/* Pickup Fields */}
          {appointmentType === 'pickup' && (
            <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Collection Date</label>
                  <input type="date" value={form.collectionDate} onChange={(e) => setForm({ ...form, collectionDate: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    min={new Date().toISOString().split('T')[0]} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Collection Time</label>
                  <select value={form.collectionTime} onChange={(e) => setForm({ ...form, collectionTime: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" required>
                    <option value="">-- Select a time slot --</option>
                    {timeSlots.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" placeholder="Enter your address" required />
              </div>
            </div>
          )}

          {/* Personal Info */}
          <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postcode / ZIP</label>
                <input type="text" value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" placeholder="Enter postal code" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" placeholder="Enter phone number" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" placeholder="Enter your name" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" placeholder="Enter your email" required />
              </div>
            </div>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full bg-black text-white py-4 rounded-xl font-semibold text-lg hover:bg-gray-800 disabled:opacity-50 transition">
            {submitting ? 'Submitting...' : 'Submit Booking'}
          </button>
        </form>
    </div>
  )
}