import { prisma } from '@/lib/prisma'

// Single source of truth for turning a customer's raw selections
// (variantId + template/option IDs + appointment type) into an authoritative
// price. Used by both /api/public/bookings/quote (price preview, no write)
// and /api/public/bookings (actual booking creation), so the two can never
// drift apart and disagree on what something costs.
//
// All money here is integer cents. Money should never be represented as a
// float — 0.1 + 0.2 !== 0.3 in binary floating point, and this function is
// exactly the kind of place (summing option adjustments, subtracting a fee)
// where that kind of drift would silently corrupt a real customer's payout.

export type SelectedOptionInput = { templateId: string; optionId?: string; optionIds?: string[] }

export type ResolvedSelection = {
  question: string
  answer: string
  priceAdjustCents: number
}

export type PricingSuccess = {
  ok: true
  variantId: string
  productName: string
  variantName: string
  finalPriceCents: number
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
        (o: unknown): o is SelectedOptionInput =>
          typeof o === 'object' &&
          o !== null &&
          typeof (o as SelectedOptionInput).templateId === 'string' &&
          (typeof (o as SelectedOptionInput).optionId === 'string' ||
            Array.isArray((o as SelectedOptionInput).optionIds)),
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
          options: true,
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

  // A WhatsApp-only variant has no priceable questions at all — the whole
  // trade-in is quoted over WhatsApp, so there's nothing to resolve here.
  if (variant.isWhatsappOnly) {
    return { ok: false, status: 400, error: 'This selection requires a WhatsApp quote and cannot be booked online' }
  }

  const resolvedSelections: (ResolvedSelection & { isWhatsapp: boolean })[] = []

  for (const vq of variant.questions) {
    const picked = submittedOptions.find((o) => o.templateId === vq.templateId)
    if (!picked) {
      return { ok: false, status: 400, error: `Missing answer for "${vq.template.title}"` }
    }

    // Single-select templates carry one optionId; multi-select templates
    // carry an optionIds array. Normalizing both to an array here means the
    // rest of this loop (and single-select's existing behavior) is unchanged.
    const isMulti = vq.template.type === 'multi'
    const pickedIds = isMulti ? (picked.optionIds || []) : (picked.optionId ? [picked.optionId] : [])
    if (pickedIds.length === 0) {
      return { ok: false, status: 400, error: `Missing answer for "${vq.template.title}"` }
    }

    // If this variant-question has an explicitly configured subset, only
    // those options are choosable here — otherwise every template option is
    // fair game (legacy behavior, unaffected by this feature).
    const allowedOptionIds = vq.optionsConfigured ? new Set(vq.options.map((o) => o.templateOptionId)) : null

    let sumAdjustCents = 0
    let anyWhatsapp = false
    const labels: string[] = []

    for (const optionId of pickedIds) {
      const option = vq.template.options.find((o) => o.id === optionId)
      if (!option) {
        return { ok: false, status: 400, error: `Invalid option for "${vq.template.title}"` }
      }
      if (allowedOptionIds && !allowedOptionIds.has(option.id)) {
        return { ok: false, status: 400, error: 'That option is not available for this device' }
      }
      const override = vq.overrides.find((ov) => ov.templateOptionId === option.id)
      if (override?.isHidden) {
        return { ok: false, status: 400, error: 'That option is not available for this device' }
      }
      const priceAdjustCents = override ? override.priceAdjustCents : option.priceAdjustCents
      const isWhatsapp = override ? override.isWhatsapp : option.isWhatsapp
      sumAdjustCents += priceAdjustCents
      if (isWhatsapp) anyWhatsapp = true
      labels.push(option.label)
    }

    resolvedSelections.push({
      question: vq.template.title,
      answer: labels.join(', '),
      priceAdjustCents: sumAdjustCents,
      isWhatsapp: anyWhatsapp,
    })
  }

  if (resolvedSelections.some((s) => s.isWhatsapp)) {
    return { ok: false, status: 400, error: 'This selection requires a WhatsApp quote and cannot be booked online' }
  }

  const settings = await prisma.settings.findFirst()
  const pickupFeeCents = settings?.pickupFeeCents || 0
  const totalAdjustCents = resolvedSelections.reduce((sum, s) => sum + s.priceAdjustCents, 0)
  const finalPriceCents = variant.basePriceCents + totalAdjustCents - (input.appointmentType === 'pickup' ? pickupFeeCents : 0)

  return {
    ok: true,
    variantId: variant.id,
    productName: variant.product.name,
    // Include the second axis value (e.g. "Black") when this product is
    // dual-axis, so the persisted booking snapshot doesn't collapse two
    // different variants (same storage, different colour) to the same name.
    variantName: variant.product.variantLabel2 && variant.axis2Value ? `${variant.name} / ${variant.axis2Value}` : variant.name,
    finalPriceCents,
    currency: settings?.currency || 'SGD',
    resolvedSelections: resolvedSelections.map(({ question, answer, priceAdjustCents }) => ({ question, answer, priceAdjustCents })),
  }
}
