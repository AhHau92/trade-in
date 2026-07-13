'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { formatMoney } from '@/lib/money'

interface TemplateOption { id: string; label: string; priceAdjustCents: number; isWhatsapp: boolean }
interface Template { id: string; title: string; options: TemplateOption[] }
interface Override { id: string; templateOptionId: string; priceAdjustCents: number; isHidden: boolean; isWhatsapp: boolean }
interface VariantQuestion { id: string; templateId: string; template: Template; overrides: Override[] }
interface Variant { id: string; name: string; basePriceCents: number; questions: VariantQuestion[] }
interface Product { id: string; name: string; slug: string; condition: string; variantLabel: string; image: string | null; brand: { name: string; slug: string }; variants: Variant[] }
interface Settings { pickupFeeCents: number; currency: string; whatsappNumber: string }

// All the data this component needs (product + settings) is fetched
// server-side by the parent page.tsx (a Server Component) and passed in as
// props — this component only owns the interactive selection state
// (which variant/options are picked) and the resulting derived price. That
// keeps the initial page load to a single server-rendered request instead
// of a client-side fetch waterfall.
export default function QuoteBuilder({ product, settings, condition }: { product: Product; settings: Settings; condition: string }) {
  const router = useRouter()
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, TemplateOption>>({})

  const selectVariant = (v: Variant) => {
    setSelectedVariant(v)
    setSelectedOptions({})
  }

  const selectOption = (templateId: string, option: TemplateOption) => {
    setSelectedOptions(prev => ({ ...prev, [templateId]: option }))
  }

  const hasWhatsapp = Object.values(selectedOptions).some(opt => opt.isWhatsapp)
  const allQuestionsAnswered = selectedVariant && selectedVariant.questions.every(vq => selectedOptions[vq.templateId])
  const totalAdjustCents = Object.values(selectedOptions).reduce((sum, opt) => sum + (opt.isWhatsapp ? 0 : opt.priceAdjustCents), 0)
  const finalPriceCents = selectedVariant ? selectedVariant.basePriceCents + totalAdjustCents : 0

  const progressTotal = selectedVariant ? selectedVariant.questions.length + 1 : 1
  const progressDone = (selectedVariant ? 1 : 0) + Object.keys(selectedOptions).length

  const handleTradeIn = () => {
    if (!selectedVariant || !allQuestionsAnswered) return
    const bookingData = {
      variantId: selectedVariant.id,
      productName: product.name,
      variantName: selectedVariant.name,
      productImage: product.image,
      condition,
      finalPriceCents,
      selectedOptions: Object.entries(selectedOptions).map(([templateId, opt]) => {
        const question = selectedVariant.questions.find(vq => vq.templateId === templateId)
        // templateId/optionId are what actually get sent to the server when
        // booking; question/answer/priceAdjustCents here are only used for
        // the client-side checklist display and are re-derived server-side
        // from the IDs, never trusted as-is.
        return { templateId, optionId: opt.id, question: question?.template.title, answer: opt.label, priceAdjustCents: opt.priceAdjustCents }
      }),
      currency: settings.currency,
      pickupFeeCents: settings.pickupFeeCents,
    }
    localStorage.setItem('tradeInBooking', JSON.stringify(bookingData))
    router.push('/booking')
  }

  const handleWhatsApp = () => {
    const msg = `Hi, I'd like to trade in my ${product.name} (${selectedVariant?.name}, ${condition}). Can you give me a quote?`
    window.open(`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <>
      <div className="bg-gray-50 rounded-2xl p-6 mb-8 mt-4">
        <div className="flex items-center gap-6">
          {product.image ? (
            <Image src={product.image} alt={product.name} width={96} height={96} className="w-24 h-24 object-contain" />
          ) : (
            <div className="w-24 h-24 bg-gray-200 rounded-xl flex items-center justify-center text-3xl">📱</div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{product.name}</h2>
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
            <h3 className="font-semibold text-lg mb-3">{product.variantLabel || 'Device Built-In Storage'}</h3>
            <div className="grid grid-cols-2 gap-3">
              {product.variants.map((v) => (
                <button key={v.id} onClick={() => selectVariant(v)}
                  className={`border-2 rounded-xl p-4 text-left transition ${selectedVariant?.id === v.id ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-black'}`}>
                  <p className="font-medium">{v.name}</p>
                  <p className={`text-sm ${selectedVariant?.id === v.id ? 'text-gray-300' : 'text-gray-500'}`}>
                    Up to {settings.currency} {formatMoney(v.basePriceCents)}
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
                        onClick={() => selectOption(vq.templateId, { ...opt, priceAdjustCents: override ? override.priceAdjustCents : opt.priceAdjustCents, isWhatsapp: override ? override.isWhatsapp : opt.isWhatsapp })}
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
                <div className="flex justify-between"><span className="text-gray-400">{product.variantLabel || 'Storage'}</span><span>{selectedVariant.name}</span></div>
                {Object.entries(selectedOptions).map(([templateId, opt]) => {
                  const q = selectedVariant.questions.find(vq => vq.templateId === templateId)
                  return <div key={templateId} className="flex justify-between"><span className="text-gray-400">{q?.template.title}</span><span>{opt.label}</span></div>
                })}
              </div>
            )}
            {allQuestionsAnswered && !hasWhatsapp && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-400 mb-1"><span>Base</span><span>{settings.currency} {formatMoney(selectedVariant?.basePriceCents || 0)}</span></div>
                {totalAdjustCents !== 0 && <div className="flex justify-between text-sm text-red-400 mb-1"><span>Adjustments</span><span>{formatMoney(totalAdjustCents)}</span></div>}
                <div className="flex justify-between text-xl font-bold mt-3 pt-3 border-t border-gray-700"><span>TOTAL</span><span className="text-green-400">{settings.currency} {formatMoney(finalPriceCents)}</span></div>
              </div>
            )}
            {allQuestionsAnswered && hasWhatsapp ? (
              <button onClick={handleWhatsApp} className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition">💬 WhatsApp for Quote</button>
            ) : allQuestionsAnswered ? (
              <button onClick={handleTradeIn} className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-gray-100 transition">Trade In for {settings.currency} {formatMoney(finalPriceCents)}</button>
            ) : (
              <div className="text-center text-gray-500 text-sm">Complete all selections to see your quote</div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
