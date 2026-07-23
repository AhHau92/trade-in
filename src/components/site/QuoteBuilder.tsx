'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { formatMoney, formatSignedMoney } from '@/lib/money'

interface TemplateOption {
  id: string
  label: string
  priceAdjustCents: number
  isWhatsapp: boolean
  imageUrl?: string | null
  description?: string | null
  defaultChecked?: boolean
}
interface Template { id: string; title: string; type?: string; helpText?: string | null; options: TemplateOption[] }
interface Override { id: string; templateOptionId: string; priceAdjustCents: number; isHidden: boolean; isWhatsapp: boolean }
interface SubsetEntry { templateOptionId: string }
interface VariantQuestion {
  id: string
  templateId: string
  template: Template
  overrides: Override[]
  // Per-variant option subset (batch 3): when optionsConfigured is true,
  // only the options listed in `options` are offered here — otherwise every
  // template option is shown (legacy/default behavior).
  optionsConfigured?: boolean
  options?: SubsetEntry[]
}
interface Variant { id: string; name: string; axis2Value?: string | null; basePriceCents: number; isWhatsappOnly?: boolean; questions: VariantQuestion[] }
interface Product { id: string; name: string; slug: string; condition: string; variantLabel: string; variantLabel2?: string | null; image: string | null; brand: { name: string; slug: string }; variants: Variant[] }
interface Settings { pickupFeeCents: number; currency: string; whatsappNumber: string }

// Effective price/whatsapp for an option, after applying any per-variant
// override — same rule the server applies in bookingPricing.ts, kept in one
// place so a click here and the price the server re-derives can't drift.
const effectiveOption = (opt: TemplateOption, overrides: Override[]): TemplateOption => {
  const override = overrides.find(o => o.templateOptionId === opt.id)
  return override ? { ...opt, priceAdjustCents: override.priceAdjustCents, isWhatsapp: override.isWhatsapp } : opt
}

// Options this variant-question actually offers: applies the per-variant
// subset (batch 3 — only meaningful when optionsConfigured is true) and
// override.isHidden, in that order. Used both for rendering and for the
// defaultChecked preset below, so the two can never disagree about what's
// actually selectable.
const getVisibleOptions = (vq: VariantQuestion): TemplateOption[] => {
  const allowedIds = vq.optionsConfigured ? new Set((vq.options || []).map(o => o.templateOptionId)) : null
  return vq.template.options.filter(opt => {
    if (allowedIds && !allowedIds.has(opt.id)) return false
    const override = vq.overrides?.find(o => o.templateOptionId === opt.id)
    return !override?.isHidden
  })
}

// Small checkmark badge shown in the corner of a selected card — same visual
// language across variant/axis/option cards so "this is picked" always looks
// the same regardless of which grid it's in.
const SelectedCheck = () => (
  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-bold shadow-sm">✓</span>
)

// Shared classes for the selectable cards (variant/axis1/axis2/option grids)
// — one place to tune hover/selected motion so every step of the flow feels
// consistent instead of drifting apart edit by edit.
const cardClass = (isChosen: boolean) =>
  `relative border-2 rounded-xl p-4 text-left transition-all duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0 ${
    isChosen ? 'border-black bg-black text-white shadow-md' : 'border-gray-200 hover:border-gray-400 hover:shadow-sm'
  }`

// Every step of the flow (axis2, then each condition question) is always
// rendered on the page — nothing pops in/out of existence — but wrapped in
// this so it's visibly blurred and non-interactive until its turn. That's
// the "show everything, but grey out what isn't unlocked yet, one step at a
// time" behavior requested in place of sections abruptly appearing the
// moment the step before them is picked.
function LockableSection({ locked, lockedLabel, children }: { locked: boolean; lockedLabel: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className={`transition-all duration-300 ease-out ${locked ? 'pointer-events-none blur-[3px] opacity-40 select-none' : ''}`}>
        {children}
      </div>
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <span className="bg-white border border-gray-200 rounded-full px-4 py-1.5 text-xs font-medium text-gray-500 shadow-sm whitespace-nowrap">
            🔒 {lockedLabel}
          </span>
        </div>
      )}
    </div>
  )
}

// All the data this component needs (product + settings) is fetched
// server-side by the parent page.tsx (a Server Component) and passed in as
// props — this component only owns the interactive selection state
// (which variant/options are picked) and the resulting derived price. That
// keeps the initial page load to a single server-rendered request instead
// of a client-side fetch waterfall.
export default function QuoteBuilder({ product, settings, condition }: { product: Product; settings: Settings; condition: string }) {
  const router = useRouter()
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  // Always an array per templateId, even for single-select questions (array
  // of at most 1) — that way single- and multi-select share one code path
  // instead of the UI needing two different shapes of selection state.
  const [selectedOptions, setSelectedOptions] = useState<Record<string, TemplateOption[]>>({})

  // Dual-axis (e.g. Storage + Colour) support. When product.variantLabel2 is
  // set, variants sharing the same `name` (axis1, e.g. "256GB") are grouped
  // and the customer picks axis1 first, then axis2 (e.g. "Black"/"Blue")
  // among just that group — a two-step selector. When variantLabel2 is null,
  // this state is simply never used and the UI behaves exactly as before
  // (single-step, one grid of variants).
  const hasDualAxis = Boolean(product.variantLabel2)
  const [selectedAxis1, setSelectedAxis1] = useState<string | null>(null)
  const axis1Names = Array.from(new Set(product.variants.map(v => v.name)))
  const axis2Variants = selectedAxis1 ? product.variants.filter(v => v.name === selectedAxis1) : []
  // Before axis1 is picked we don't yet know which axis2 values actually go
  // with it — but the axis2 section still needs *something* to render while
  // it sits there blurred/locked, so show every axis2 value that exists
  // anywhere on this product as a preview. It's non-interactive at that
  // point anyway (LockableSection), so it never lets anyone pick a
  // combination that isn't real.
  const axis2Preview = Array.from(new Set(product.variants.map(v => v.axis2Value).filter((v): v is string => Boolean(v))))

  const selectAxis1 = (name: string) => {
    setSelectedAxis1(name)
    setSelectedVariant(null)
    setSelectedOptions({})
  }

  const changeAxis1 = () => {
    setSelectedAxis1(null)
    setSelectedVariant(null)
    setSelectedOptions({})
  }

  const selectVariant = (v: Variant) => {
    setSelectedVariant(v)
    // Pre-check any multi-select options the admin marked defaultChecked —
    // mirrors what the admin configured, so the customer isn't stuck
    // re-selecting something that's "on" by default.
    const initial: Record<string, TemplateOption[]> = {}
    for (const vq of v.questions) {
      if (vq.template.type === 'multi') {
        const preset = getVisibleOptions(vq)
          .filter(o => o.defaultChecked)
          .map(o => effectiveOption(o, vq.overrides))
        if (preset.length > 0) initial[vq.templateId] = preset
      }
    }
    setSelectedOptions(initial)
  }

  const selectSingleOption = (templateId: string, option: TemplateOption) => {
    setSelectedOptions(prev => ({ ...prev, [templateId]: [option] }))
  }

  const toggleMultiOption = (templateId: string, option: TemplateOption) => {
    setSelectedOptions(prev => {
      const current = prev[templateId] || []
      const exists = current.some(o => o.id === option.id)
      return { ...prev, [templateId]: exists ? current.filter(o => o.id !== option.id) : [...current, option] }
    })
  }

  const allSelected = Object.values(selectedOptions).flat()
  const isWaOnlyVariant = Boolean(selectedVariant?.isWhatsappOnly)
  const hasWhatsapp = isWaOnlyVariant || allSelected.some(opt => opt.isWhatsapp)
  const allQuestionsAnswered = Boolean(
    selectedVariant && (isWaOnlyVariant || selectedVariant.questions.every(vq => (selectedOptions[vq.templateId]?.length ?? 0) > 0)),
  )
  const totalAdjustCents = allSelected.reduce((sum, opt) => sum + (opt.isWhatsapp ? 0 : opt.priceAdjustCents), 0)
  const finalPriceCents = selectedVariant && !isWaOnlyVariant ? selectedVariant.basePriceCents + totalAdjustCents : 0

  const answeredQuestionCount = selectedVariant
    ? selectedVariant.questions.filter(vq => (selectedOptions[vq.templateId]?.length ?? 0) > 0).length
    : 0
  // +1 extra step for the axis1 pick when the product is dual-axis (axis2 is
  // covered by the existing "variant selected" step below).
  const axisSteps = hasDualAxis ? 2 : 1
  const progressTotal = selectedVariant ? (isWaOnlyVariant ? axisSteps : selectedVariant.questions.length + axisSteps) : axisSteps
  const progressDone = (hasDualAxis && selectedAxis1 ? 1 : 0) + (selectedVariant ? 1 : 0) + (isWaOnlyVariant ? 0 : answeredQuestionCount)

  const handleTradeIn = () => {
    if (!selectedVariant || !allQuestionsAnswered || isWaOnlyVariant) return
    const bookingData = {
      variantId: selectedVariant.id,
      productName: product.name,
      variantName: hasDualAxis && selectedVariant.axis2Value ? `${selectedVariant.name} / ${selectedVariant.axis2Value}` : selectedVariant.name,
      productImage: product.image,
      condition,
      finalPriceCents,
      // templateId/optionId(s) are what actually get sent to the server when
      // booking; question/answer/priceAdjustCents here are only used for the
      // client-side checklist display and are re-derived server-side from
      // the IDs, never trusted as-is.
      selectedOptions: selectedVariant.questions.map(vq => {
        const opts = selectedOptions[vq.templateId] || []
        const isMulti = vq.template.type === 'multi'
        return {
          templateId: vq.templateId,
          ...(isMulti ? { optionIds: opts.map(o => o.id) } : { optionId: opts[0]?.id }),
          question: vq.template.title,
          answer: opts.map(o => o.label).join(', '),
          priceAdjustCents: opts.reduce((sum, o) => sum + o.priceAdjustCents, 0),
        }
      }),
      currency: settings.currency,
      pickupFeeCents: settings.pickupFeeCents,
    }
    localStorage.setItem('tradeInBooking', JSON.stringify(bookingData))
    router.push('/booking')
  }

  const handleWhatsApp = () => {
    const variantLabel = hasDualAxis && selectedVariant?.axis2Value ? `${selectedVariant.name} / ${selectedVariant.axis2Value}` : selectedVariant?.name
    const msg = `Hi, I'd like to trade in my ${product.name} (${variantLabel}, ${condition}). Can you give me a quote?`
    window.open(`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <>
      <div className="bg-gray-50 rounded-2xl p-6 mb-8 mt-4 border border-gray-100">
        <div className="flex items-center gap-6">
          {product.image ? (
            <Image src={product.image} alt={product.name} width={96} height={96} className="w-24 h-24 object-contain rounded-xl bg-white" />
          ) : (
            <div className="w-24 h-24 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-3xl">📱</div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">{product.brand.name}</p>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold truncate">{product.name}</h2>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${condition === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                {condition === 'new' ? 'New' : 'Used'}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-300 ease-out" style={{ width: `${(progressDone / progressTotal) * 100}%` }} />
              </div>
              <span className="text-sm text-gray-500 whitespace-nowrap">{progressDone} of {progressTotal} selected</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {!hasDualAxis && (
            <div>
              <h3 className="font-semibold text-lg mb-3">{product.variantLabel || 'Device Built-In Storage'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.variants.map((v) => {
                  const isChosen = selectedVariant?.id === v.id
                  return (
                    <button key={v.id} onClick={() => selectVariant(v)} className={cardClass(isChosen)}>
                      {isChosen && <SelectedCheck />}
                      <p className="font-medium">{v.name}</p>
                      {v.isWhatsappOnly ? (
                        <p className={`text-sm font-medium ${isChosen ? 'text-green-300' : 'text-green-600'}`}>💬 WhatsApp for quote</p>
                      ) : (
                        <p className={`text-sm ${isChosen ? 'text-gray-300' : 'text-gray-500'}`}>
                          Up to {settings.currency} {formatMoney(v.basePriceCents)}
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {hasDualAxis && (
            <div>
              <h3 className="font-semibold text-lg mb-3">{product.variantLabel || 'Device Built-In Storage'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {axis1Names.map((name) => {
                  const isChosen = selectedAxis1 === name
                  return (
                    <button key={name} onClick={() => selectAxis1(name)} className={cardClass(isChosen)}>
                      {isChosen && <SelectedCheck />}
                      <p className="font-medium">{name}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {hasDualAxis && (
            <LockableSection locked={!selectedAxis1} lockedLabel={`Select a ${(product.variantLabel || 'storage option').toLowerCase()} first`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">{product.variantLabel2}</h3>
                  {selectedAxis1 && (
                    <button onClick={changeAxis1} className="text-sm text-gray-400 hover:text-black hover:underline transition-colors">
                      Change {product.variantLabel}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedAxis1 ? axis2Variants.map((v) => {
                    const isChosen = selectedVariant?.id === v.id
                    return (
                      <button key={v.id} onClick={() => selectVariant(v)} className={cardClass(isChosen)}>
                        {isChosen && <SelectedCheck />}
                        <p className="font-medium">{v.axis2Value}</p>
                        {v.isWhatsappOnly ? (
                          <p className={`text-sm font-medium ${isChosen ? 'text-green-300' : 'text-green-600'}`}>💬 WhatsApp for quote</p>
                        ) : (
                          <p className={`text-sm ${isChosen ? 'text-gray-300' : 'text-gray-500'}`}>
                            Up to {settings.currency} {formatMoney(v.basePriceCents)}
                          </p>
                        )}
                      </button>
                    )
                  }) : axis2Preview.map((value) => (
                    <div key={value} className={cardClass(false)}>
                      <p className="font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </LockableSection>
          )}

          {selectedVariant && isWaOnlyVariant && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-sm text-green-800 flex items-start gap-3">
              <span className="text-lg leading-none">💬</span>
              <span>This variant is quoted directly over WhatsApp — send us a message and we&apos;ll get back to you with a price.</span>
            </div>
          )}

          {selectedVariant && !isWaOnlyVariant && selectedVariant.questions.map((vq, index) => {
            const isMulti = vq.template.type === 'multi'
            const visibleOptions = getVisibleOptions(vq)
            const chosen = selectedOptions[vq.templateId] || []
            // Every question is rendered as soon as a variant is picked — but
            // each one stays locked until every question before it has an
            // answer, so instead of the whole list becoming clickable at
            // once, they unlock one at a time in order.
            const priorAnswered = selectedVariant.questions
              .slice(0, index)
              .every((prevVq) => (selectedOptions[prevVq.templateId]?.length ?? 0) > 0)
            return (
              <LockableSection key={vq.id} locked={!priorAnswered} lockedLabel="Answer the previous question first">
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    {vq.template.title}
                    {isMulti && <span className="ml-2 text-xs font-normal text-gray-400">(select any that apply)</span>}
                  </h3>
                  {vq.template.helpText && <p className="text-sm text-gray-500 mb-3">{vq.template.helpText}</p>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    {visibleOptions.map((opt) => {
                      const resolved = effectiveOption(opt, vq.overrides)
                      const isChosen = chosen.some(o => o.id === opt.id)
                      return (
                        <button key={opt.id}
                          onClick={() => isMulti ? toggleMultiOption(vq.templateId, resolved) : selectSingleOption(vq.templateId, resolved)}
                          className={`${cardClass(isChosen)} flex gap-3 items-start`}>
                          {isChosen && <SelectedCheck />}
                          {opt.imageUrl && (
                            // Plain <img>, not next/image: this URL is free-text entered by an
                            // admin (see templates page), so it can be any host. next/image
                            // throws and takes down the ENTIRE product page for every visitor
                            // if the hostname isn't in next.config.ts's remotePatterns — one
                            // pasted-in URL shouldn't be able to do that over a small option
                            // thumbnail. A plain <img> just renders (or shows a broken-image
                            // icon) and never crashes the page.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={opt.imageUrl} alt={opt.label} width={40} height={40} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                          )}
                          <span className="pr-4">
                            <span className="font-medium block">{opt.label}</span>
                            {opt.description && (
                              <span className={`text-xs block mt-0.5 ${isChosen ? 'text-gray-300' : 'text-gray-400'}`}>{opt.description}</span>
                            )}
                            {/* Price effect of this option — shown at all times so
                                customers can compare before picking, then made bold
                                and pill-shaped once selected so it's unmistakable
                                how much this choice deducted (or added). */}
                            {resolved.isWhatsapp ? (
                              <span className={`inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                                isChosen ? 'bg-white/20 text-white' : 'bg-green-50 text-green-700'
                              }`}>
                                💬 Quote via WhatsApp
                              </span>
                            ) : resolved.priceAdjustCents !== 0 && (
                              <span className={`inline-block mt-1.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                                isChosen
                                  ? resolved.priceAdjustCents < 0 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                                  : resolved.priceAdjustCents < 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
                              }`}>
                                {settings.currency} {formatSignedMoney(resolved.priceAdjustCents)}
                              </span>
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </LockableSection>
            )
          })}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gray-900 text-white rounded-2xl p-6 sticky top-8 shadow-lg">
            <h3 className="font-semibold text-lg mb-4">Your selection</h3>
            {selectedVariant ? (
              <div className="space-y-2 text-sm border-b border-gray-700 pb-4 mb-4">
                <div className="flex justify-between"><span className="text-gray-400">Condition</span><span>{condition === 'new' ? 'New' : 'Used'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">{product.variantLabel || 'Storage'}</span><span>{selectedVariant.name}</span></div>
                {hasDualAxis && (
                  <div className="flex justify-between"><span className="text-gray-400">{product.variantLabel2}</span><span>{selectedVariant.axis2Value}</span></div>
                )}
                {!isWaOnlyVariant && selectedVariant.questions.map((vq) => {
                  const chosen = selectedOptions[vq.templateId] || []
                  if (chosen.length === 0) return null
                  return (
                    <div key={vq.templateId} className="flex justify-between gap-3">
                      <span className="text-gray-400 flex-shrink-0 max-w-[45%]">{vq.template.title}</span>
                      <span className="text-right break-words min-w-0 flex-1">{chosen.map(o => o.label).join(', ')}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 border-b border-gray-700 pb-4 mb-4">
                Pick a {(product.variantLabel || 'storage option').toLowerCase()} on the left to get started.
              </p>
            )}
            {allQuestionsAnswered && !hasWhatsapp && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-400 mb-1"><span>Base</span><span>{settings.currency} {formatMoney(selectedVariant?.basePriceCents || 0)}</span></div>
                {totalAdjustCents !== 0 && <div className="flex justify-between text-sm text-red-400 mb-1"><span>Adjustments</span><span>{formatMoney(totalAdjustCents)}</span></div>}
                <div className="flex justify-between items-baseline text-xl font-bold mt-3 pt-3 border-t border-gray-700">
                  <span>TOTAL</span>
                  <span className="text-green-400">{settings.currency} {formatMoney(finalPriceCents)}</span>
                </div>
              </div>
            )}
            {allQuestionsAnswered && hasWhatsapp ? (
              <button onClick={handleWhatsApp} className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 active:scale-[0.98] transition-all shadow-md hover:shadow-lg">💬 WhatsApp for Quote</button>
            ) : allQuestionsAnswered ? (
              <button onClick={handleTradeIn} className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-gray-100 active:scale-[0.98] transition-all shadow-md hover:shadow-lg">Trade In for {settings.currency} {formatMoney(finalPriceCents)}</button>
            ) : (
              <div className="text-center text-gray-500 text-sm py-1">Complete all selections to see your quote</div>
            )}
            {allQuestionsAnswered && (
              <p className="text-center text-xs text-gray-500 mt-3">No commitment — confirm your final quote at drop-off.</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
