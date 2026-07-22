'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatMoney } from '@/lib/money'

interface SelectedOption {
  question: string
  answer: string
  priceAdjustCents: number
}

interface Booking {
  id: string
  bookingRef: string
  appointmentType: string
  finalPriceCents: number
  selectedOptions: SelectedOption[]
  name: string
  email: string
  phone: string
  postcode: string
  address: string | null
  visitDate: string | null
  collectionDate: string | null
  collectionTime: string | null
  status: string
  createdAt: string
  // Snapshots taken at booking time — prefer these over the live variant/
  // product relation so renaming a product doesn't rewrite past bookings.
  productName: string | null
  variantName: string | null
  branchName: string | null
  // Nullable: the underlying variant/product can be deleted later (the FK is
  // ON DELETE SET NULL) without touching this booking row — the snapshot
  // fields above are the source of truth for display. This relation is only
  // a fallback for bookings made before the snapshot fields existed AND
  // whose variant hasn't since been deleted.
  variant: { name: string; product: { name: string } } | null
  branch: { name: string } | null
}

// Falls back to the live relation for bookings made before the snapshot
// fields existed. If both the snapshot and the live variant are gone
// (variant deleted after the fact, no snapshot), show a clear placeholder
// instead of crashing on `.product.name` of null.
const deviceName = (b: Booking) => b.productName || b.variant?.product.name || 'Deleted product'
const deviceVariant = (b: Booking) => b.variantName || b.variant?.name || 'Deleted variant'
const branchDisplayName = (b: Booking) => b.branchName || b.branch?.name || null

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', page.toString())
    params.set('limit', '20')
    if (filterStatus) params.set('status', filterStatus)
    if (search) params.set('search', search)

    const res = await fetch(`/api/admin/bookings?${params}`)
    const data = await res.json()
    setBookings(data.bookings)
    setTotal(data.total)
    setTotalPages(data.totalPages)
    setLoading(false)
  }, [page, filterStatus, search])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); setPage(1); setSearch(searchInput)
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/bookings/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchBookings()
    if (selectedBooking?.id === id) setSelectedBooking({ ...selectedBooking, status })
  }

  const deleteBooking = async (id: string) => {
    if (!confirm('Delete this booking? This cannot be undone.')) return
    await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' })
    if (selectedBooking?.id === id) setSelectedBooking(null)
    fetchBookings()
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bookings <span className="text-gray-400 text-lg font-normal">({total})</span></h1>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <form onSubmit={handleSearch} className="flex gap-3 mb-3">
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" placeholder="Search by ref, name, email, phone..." />
          <button type="submit" className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition">Search</button>
          {(search || filterStatus) && <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setFilterStatus(''); setPage(1) }} className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Clear</button>}
        </form>
        <div className="flex gap-2">
          {['', 'pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
            <button key={s} onClick={() => { setFilterStatus(s); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${filterStatus === s ? 'bg-black text-white' : 'border hover:bg-gray-50'}`}>
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Ref</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Customer</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Device</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Type</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Price</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Date</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-sm font-medium">{b.bookingRef}</td>
                <td className="px-6 py-4">
                  <p className="font-medium text-sm">{b.name}</p>
                  <p className="text-xs text-gray-400">{b.phone}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm">{deviceName(b)}</p>
                  <p className="text-xs text-gray-400">{deviceVariant(b)}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.appointmentType === 'store' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                    {b.appointmentType === 'store' ? '🏪 Store' : '🚚 Pickup'}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium">${formatMoney(b.finalPriceCents)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[b.status] || 'bg-gray-100'}`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(b.createdAt)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedBooking(b)} className="text-blue-600 hover:underline text-sm">View</button>
                    <button onClick={() => deleteBooking(b.id)} className="text-red-600 hover:underline text-sm">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && bookings.length === 0 && (
              <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-400">No bookings found</td></tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
            <p className="text-sm text-gray-500">Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of {total}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 rounded border text-sm disabled:opacity-30 hover:bg-gray-100">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1 rounded border text-sm disabled:opacity-30 hover:bg-gray-100">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{selectedBooking.bookingRef}</h2>
              <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-black text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-sm text-gray-500 mb-2">Device</h3>
                <p className="font-semibold">{deviceName(selectedBooking)} — {deviceVariant(selectedBooking)}</p>
                <p className="text-green-600 font-bold text-lg mt-1">${formatMoney(selectedBooking.finalPriceCents)}</p>
                {selectedBooking.selectedOptions && (
                  <div className="mt-2 space-y-1">
                    {(Array.isArray(selectedBooking.selectedOptions) ? selectedBooking.selectedOptions : []).map((opt: SelectedOption, i: number) => (
                      <p key={i} className="text-sm text-gray-600">{opt.question}: <span className="font-medium">{opt.answer}</span></p>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-sm text-gray-500 mb-2">Customer</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p><span className="text-gray-500">Name:</span> {selectedBooking.name}</p>
                  <p><span className="text-gray-500">Phone:</span> {selectedBooking.phone}</p>
                  <p><span className="text-gray-500">Email:</span> {selectedBooking.email}</p>
                  <p><span className="text-gray-500">Postcode:</span> {selectedBooking.postcode}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-sm text-gray-500 mb-2">Appointment</h3>
                <div className="text-sm space-y-1">
                  <p><span className="text-gray-500">Type:</span> {selectedBooking.appointmentType === 'store' ? '🏪 Store Visit' : '🚚 Pickup'}</p>
                  {branchDisplayName(selectedBooking) && <p><span className="text-gray-500">Branch:</span> {branchDisplayName(selectedBooking)}</p>}
                  {selectedBooking.visitDate && <p><span className="text-gray-500">Visit Date:</span> {new Date(selectedBooking.visitDate).toLocaleDateString()}</p>}
                  {selectedBooking.address && <p><span className="text-gray-500">Address:</span> {selectedBooking.address}</p>}
                  {selectedBooking.collectionDate && <p><span className="text-gray-500">Collection:</span> {new Date(selectedBooking.collectionDate).toLocaleDateString()} {selectedBooking.collectionTime}</p>}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-sm text-gray-500 mb-2">Update Status</h3>
                <div className="flex gap-2">
                  {['pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
                    <button key={s} onClick={() => updateStatus(selectedBooking.id, s)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition ${selectedBooking.status === s ? 'bg-black text-white' : 'border hover:bg-gray-50'}`}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => deleteBooking(selectedBooking.id)}
                className="w-full text-red-600 border border-red-200 rounded-lg py-2 text-sm hover:bg-red-50 transition">
                Delete booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}