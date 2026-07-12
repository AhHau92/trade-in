// All money in this app is stored and computed in integer cents (never
// floating-point dollars) to avoid classic binary-float drift like
// 0.1 + 0.2 !== 0.3. These helpers are the ONLY place dollars<->cents
// conversion should happen: admin forms convert a typed dollar amount to
// cents on save (dollarsToCents), and every display point formats cents
// back to a dollar string (formatMoney). Application logic in between
// (pricing calculations, DB storage, API payloads) should never touch a
// dollar-denominated float.

export function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Same as formatMoney but prefixes a sign, for price-adjustment displays
// like "+15.00" / "-10.00" / "±0".
export function formatSignedMoney(cents: number): string {
  if (cents === 0) return '±0'
  const formatted = formatMoney(Math.abs(cents))
  return cents > 0 ? `+${formatted}` : `-${formatted}`
}

// Parses a dollar-denominated form input (string or number) into integer
// cents, rounding to the nearest cent to avoid float artifacts from the
// multiplication itself (e.g. 4.99 * 100 can land on 498.999999999).
export function dollarsToCents(dollars: number | string): number {
  const n = typeof dollars === 'string' ? parseFloat(dollars) : dollars
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100)
}

// Inverse of dollarsToCents, for pre-filling a dollar-denominated <input>
// from a cents value already in state.
export function centsToDollarsInput(cents: number): number {
  return cents / 100
}
