import { prisma } from '@/lib/prisma'

// Single source of truth for turning a customer's raw selections
// (variantId + template/option IDs + appointment type) into an authoritative
// price. Used by both /api/public/bookings/quote (price preview, no write)
// and /api/public/bookings (actual booking creation), so the two can never
// drift apart and disagree on what something costs.

export type SelectedOptionInput = { templateId: string; optionId: string }

export type ResolvedSelection = {
  question: string
  answer: string
  priceAdjust: number
}

export type PricingSuccess = {
  ok: true
  variantId: string
  productName: string
  variantName: string
  finalPrice: number
  currency: string
  resolvedSelections: ResolvedSelection[]
}

export type PricingFailure = {
  ok: false
  status: number
  error: string
}

export async function resolveBookingPricing(input: {
  variantId: unknown
  appointmentType: unknown
  selectedOptions: unknown
}): Promise<PricingSuccess | PricingFailure> {
  if (!input.variantId || typeof input.variantId !== 'string') {
    return { ok: false, status: 400, error: 'Missing variantId' }
  }
  if (input.appointmentType !== 'store' && input.appointmentType !== 'pickup') {
    return { ok: false, status: 400, error: 'Invalid appointmentType' }
  }
  const submittedOptions: SelectedOptionInput[] = Array.isArray(input.selectedOptions)
    ? input.selectedOptions.filter(
        (o: any): o is SelectedOptionInput => o && typeof o.templateId === 'string' && typeof o.optionId === 'string',
      )
    : []

  const variant = await prisma.variant.findUnique({
    where: { id: input.variantId },
    include: {
      product: true,
      questions: {
        include: {
          template: { include: { options: true } },
          overrides: true,
        },
      },
    },
  })

  if (!variant || !variant.isActive) {
    return { ok: false, status: 400, error: 'This device variant is no longer available' }
  }
  if (!variant.product.isActive) {
    return { ok: false, status: 400, error: 'This product is no longer available' }
  }

  const resolvedSelections: (ResolvedSelection & { isWhatsapp: boolean })[] = []

  for (const vq of variant.questions) {
    const picked = submittedOptions.find((o) => o.templateId === vq.templateId)
    if (!picked) {
      return { ok: false, status: 400, error: `Missing answer for "${vq.template.title}"` }
    }
    const option = vq.template.options.find((o) => o.id === picked.optionId)
    if (!option) {
      return { ok: false, status: 400, error: `Invalid option for "${vq.template.title}"` }
    }
    const override = vq.overrides.find((ov) => ov.templateOptionId === option.id)
    if (override?.isHidden) {
      return { ok: false, status: 400, error: 'That option is not available for this device' }
    }
    const priceAdjust = override ? override.priceAdjust : option.priceAdjust
    const isWhatsapp = override ? override.isWhatsapp : option.isWhatsapp
    resolvedSelections.push({ question: vq.template.title, answer: option.label, priceAdjust, isWhatsapp })
  }

  if (resolvedSelections.some((s) => s.isWhatsapp)) {
    return { ok: false, status: 400, error: 'This selection requires a WhatsApp quote and cannot be booked online' }
  }

  const settings = await prisma.settings.findFirst()
  const pickupFee = settings?.pickupFee || 0
  const totalAdjust = resolvedSelections.reduce((sum, s) => sum + s.priceAdjust, 0)
  const finalPrice = variant.basePrice + totalAdjust - (input.appointmentType === 'pickup' ? pickupFee : 0)

  return {
    ok: true,
    variantId: variant.id,
    productName: variant.product.name,
    variantName: variant.name,
    finalPrice,
    currency: settings?.currency || 'SGD',
    resolvedSelections: resolvedSelections.map(({ question, answer, priceAdjust }) => ({ question, answer, priceAdjust })),
  }
}
