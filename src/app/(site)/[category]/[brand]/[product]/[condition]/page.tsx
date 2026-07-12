'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface TemplateOption { id: string; label: string; priceAdjust: number; isWhatsapp: boolean }
interface Template { id: string; title: string; options: TemplateOption[] }
interface Override { id: string; templateOptionId: string; priceAdjust: number; isHidden: boolean; isWhatsapp: boolean }
interface VariantQuestion { id: string; templateId: string; template: Template; overrides: Override[] }
interface Variant { id: string; name: string; basePrice: number; questions: VariantQuestion[] }
interface Product { id: string; name: string; slug: string; condition: string; variantLabel: string; image: string | null; brand: { name: string; slug: string }; variants: Variant[] }

export default function ProductPage({ params }: { params: Promise<{ category: string; brand: string; product: string; condition: string }> }) {
  const { category, brand, product: productSlug, condition } = use(params)
  const router = useRouter()
  const [productData, setProductData] = useState<Product | null>(null)
  const [settings, setSettings] = useState({ pickupFee: 0, currency: 'SGD', whatsappNumber: '' })
  const [loading, setLoading] = useState(true)

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, TemplateOption>>({})

  useEffect(() => {
    Promise.all([
      fetch(`/api/public/products/${productSlug}?condition=${condition}`).then(r => r.json()),
      fetch('/api/public/settings').then(r => r.json()),
    ]).then(([prod, sett]) => {
      setProductData(prod)
      setSettings(sett)
      setLoading(false)
    })
  }, [productSlug, condition])

  const selectVariant = (v: Variant) => {
    setSelectedVariant(v)
    setSelectedOptions({})
  }

  const selectOption = (templateId: string, option: TemplateOption) => {
    setSelectedOptions(prev => ({ ...prev, [templateId]: option }))
  }

  const hasWhatsapp = Object.values(selectedOptions).some(opt => opt.isWhatsapp)
  const allQuestionsAnswered = selectedVariant && selectedVariant.questions.every(vq => selectedOptions[vq.templateId])
  const totalAdjust = Object.values(selectedOptions).reduce((sum, opt) => sum + (opt.isWhatsapp ? 0 : opt.priceAdjust), 0)
  const finalPrice = selectedVariant ? selectedVariant.basePrice + totalAdjust : 0

  const progressTotal = selectedVariant ? selectedVariant.questions.length + 1 : 1
  const progressDone = (selectedVariant ? 1 : 0) + Object.keys(selectedOptions).length

  const handleTradeIn = () => {
    if (!selectedVariant || !allQuestionsAnswered) return
    const bookingData = {
      variantId: selectedVariant.id,
      productName: productData?.name,
      variantName: selectedVariant.name,
      productImage: productData?.image,
      condition,
      finalPrice,
      selectedOptions: Object.entries(selectedOptions).map(([templateId, opt]) => {
        const question = selectedVariant.questions.find(vq => vq.templateId === templateId)
        // templateId/optionId are what actually get sent to the server when
        // booking; question/answer/priceAdjust here are only used for the
        // client-side checklist display and are re-derived server-side from
        // the IDs, never trusted as-is.
        return { templateId, optionId: opt.id, question: question?.template.title, answer: opt.label, priceAdjust: opt.priceAdjust }
      }),
      currency: settings.currency,
      pickupFee: settings.pickupFee,
    }
    localStorage.setItem('tradeInBooking', JSON.stringify(bookingData))
    router.push('/booking')
  }

  const handleWhatsApp = () => {
    const msg = `Hi, I'd like to trade in my ${productData?.name} (${selectedVariant?.name}, ${condition}). Can you give me a quote?`
    window.open(`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  if (loading) return <div className="flex items-center justify-center py-24 text-gray-400">Loading...</div>
  if (!productData) return <div className="flex items-center justify-center py-24 text-red-500">Product not found</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href={`/${category}/${brand}`} className="text-sm text-gray-500 hover:text-black">← Back</Link>

      <div className="bg-gray-50 rounded-2xl p-6 mb-8 mt-4">
          <div className="flex items-center gap-6">
            {productData.image ? (
              <img src={productData.image} alt={productData.name} className="w-24 h-24 object-contain" />
            ) : (
              <div className="w-24 h-24 bg-gray-200 rounded-xl flex items-center justify-center text-3xl">📱</div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{productData.name}</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${condition === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                  {condition === 'new' ? 'New' : 'Used'}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(progressDone / progressTotal) * 100}%` }} />
                </div>
                <span className="text-sm text-gray-500">{progressDone} of {progressTotal} selected</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">{productData.variantLabel || 'Device Built-In Storage'}</h3>
              <div className="grid grid-cols-2 gap-3">
                {productData.variants.map((v) => (
                  <button key={v.id} onClick={() => selectVariant(v)}
                    className={`border-2 rounded-xl p-4 text-left transition ${selectedVariant?.id === v.id ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-black'}`}>
                    <p className="font-medium">{v.name}</p>
                    <p className={`text-sm ${selectedVariant?.id === v.id ? 'text-gray-300' : 'text-gray-500'}`}>
                      Up to {settings.currency} {v.basePrice.toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {selectedVariant?.questions.map((vq) => {
              const visibleOptions = vq.template.options.filter(opt => {
                const override = vq.overrides?.find(o => o.templateOptionId === opt.id)
                return !override?.isHidden
              })
              return (
                <div key={vq.id}>
                  <h3 className="font-semibold text-lg mb-3">{vq.template.title}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {visibleOptions.map((opt) => {
                      const override = vq.overrides?.find(o => o.templateOptionId === opt.id)
                      return (
                        <button key={opt.id}
                          onClick={() => selectOption(vq.templateId, { ...opt, priceAdjust: override ? override.priceAdjust : opt.priceAdjust, isWhatsapp: override ? override.isWhatsapp : opt.isWhatsapp })}
                          className={`border-2 rounded-xl p-4 text-left transition ${selectedOptions[vq.templateId]?.id === opt.id ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-black'}`}>
                          <p className="font-medium">{opt.label}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gray-900 text-white rounded-2xl p-6 sticky top-8">
              <h3 className="font-semibold text-lg mb-4">Your selection</h3>
              {selectedVariant && (
                <div className="space-y-2 text-sm border-b border-gray-700 pb-4 mb-4">
                  <div className="flex justify-between"><span className="text-gray-400">Condition</span><span>{condition === 'new' ? 'New' : 'Used'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">{productData.variantLabel || 'Storage'}</span><span>{selectedVariant.name}</span></div>
                  {Object.entries(selectedOptions).map(([templateId, opt]) => {
                    const q = selectedVariant.questions.find(vq => vq.templateId === templateId)
                    return <div key={templateId} className="flex justify-between"><span className="text-gray-400">{q?.template.title}</span><span>{opt.label}</span></div>
                  })}
                </div>
              )}
              {allQuestionsAnswered && !hasWhatsapp && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-400 mb-1"><span>Base</span><span>{settings.currency} {selectedVariant?.basePrice.toLocaleString()}</span></div>
                  {totalAdjust !== 0 && <div className="flex justify-between text-sm text-red-400 mb-1"><span>Adjustments</span><span>{totalAdjust}</span></div>}
                  <div className="flex justify-between text-xl font-bold mt-3 pt-3 border-t border-gray-700"><span>TOTAL</span><span className="text-green-400">{settings.currency} {finalPrice.toLocaleString()}</span></div>
                </div>
              )}
              {allQuestionsAnswered && hasWhatsapp ? (
                <button onClick={handleWhatsApp} className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition">💬 WhatsApp for Quote</button>
              ) : allQuestionsAnswered ? (
                <button onClick={handleTradeIn} className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-gray-100 transition">Trade In for {settings.currency} {finalPrice.toLocaleString()}</button>
              ) : (
                <div className="text-center text-gray-500 text-sm">Complete all selections to see your quote</div>
              )}
            </div>
          </div>
        </div>
    </div>
  )
}