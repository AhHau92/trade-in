import { z } from 'zod'

// Zod schemas for the PUBLIC (unauthenticated) booking endpoints. This is
// the actual data-entry point into the database from the open internet, so
// everything here is deliberately strict: bounded lengths, real formats,
// no trusting the client for anything beyond "which variant/options did you
// pick" (price itself is re-derived server-side in bookingPricing.ts, not
// validated here).

// A question answer is either a single optionId (single-select templates,
// the original/default shape) or an optionIds array (multi-select
// templates). Exactly one of the two must be present — refine() below
// enforces that instead of silently accepting neither.
export const selectedOptionSchema = z
  .object({
    templateId: z.string().trim().min(1).max(191),
    optionId: z.string().trim().min(1).max(191).optional(),
    optionIds: z.array(z.string().trim().min(1).max(191)).max(50).optional(),
  })
  .refine((v) => Boolean(v.optionId) || (v.optionIds && v.optionIds.length > 0), {
    message: 'Each question needs at least one selected option',
  })

const MAX_SELECTED_OPTIONS = 30

const nameField = z.string().trim().min(1, 'Name is required').max(120, 'Name is too long')
const emailField = z.string().trim().max(190, 'Email is too long').email('Invalid email address')
const phoneField = z
  .string()
  .trim()
  .min(6, 'Invalid phone number')
  .max(20, 'Invalid phone number')
  .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number')
const postcodeField = z
  .string()
  .trim()
  .min(3, 'Invalid postcode')
  .max(12, 'Invalid postcode')
  .regex(/^[A-Za-z0-9\- ]+$/, 'Invalid postcode')

// Accepts "YYYY-MM-DD" (what <input type="date"> sends) and rejects
// anything in the past (comparing by calendar day, not exact time).
const futureDateField = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} must be a valid date`)
    .refine((val) => {
      const parsed = new Date(`${val}T00:00:00`)
      if (Number.isNaN(parsed.getTime())) return false
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      return parsed.getTime() >= todayStart.getTime()
    }, `${label} cannot be in the past`)

const baseFields = {
  variantId: z.string().trim().min(1, 'Missing variantId').max(191),
  selectedOptions: z.array(selectedOptionSchema).max(MAX_SELECTED_OPTIONS, 'Too many selected options'),
  name: nameField,
  email: emailField,
  phone: phoneField,
  postcode: postcodeField,
}

const storeBookingSchema = z.object({
  ...baseFields,
  appointmentType: z.literal('store'),
  branchId: z.string().trim().min(1, 'Branch is required').max(191),
  visitDate: futureDateField('Visit date'),
})

const pickupBookingSchema = z.object({
  ...baseFields,
  appointmentType: z.literal('pickup'),
  address: z.string().trim().min(5, 'Address is required').max(300, 'Address is too long'),
  collectionDate: futureDateField('Collection date'),
  collectionTime: z.string().trim().min(1, 'Collection time is required').max(30),
})

// Full booking creation: which fields are required depends on appointmentType.
export const publicBookingSchema = z.discriminatedUnion('appointmentType', [
  storeBookingSchema,
  pickupBookingSchema,
])

// Price preview only — doesn't need customer/appointment logistics, just
// enough to look up and price the selection.
export const bookingQuoteSchema = z.object({
  variantId: z.string().trim().min(1, 'Missing variantId').max(191),
  appointmentType: z.enum(['store', 'pickup']),
  selectedOptions: z.array(selectedOptionSchema).max(MAX_SELECTED_OPTIONS, 'Too many selected options'),
})

export function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message || 'Invalid request'
}
