// Shared step indicator for the whole trade-in journey:
//   1. /[category]            — pick a brand
//   2. /[category]/[brand]    — pick a device
//   3. /[category]/[brand]/[product]/[condition] — configure & get a quote
//   4. /booking                — enter details, submit, see confirmation
// Previously this only existed on the booking page, and its "filled" state
// was hardcoded (`step <= 3`) rather than tied to where the customer
// actually was — so it always showed the same thing regardless of progress,
// and didn't appear on any of the browsing pages. This component is driven
// by a real `current` prop and reused on every page in the flow so the
// numbering is both consistent and correct everywhere.
const STEPS = ['Category', 'Brand', 'Configure Device', 'Booking'] as const

export default function TradeInSteps({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((label, i) => {
          const step = i + 1
          const isDone = step < current
          const isActive = step === current
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isDone ? 'bg-black text-white' : isActive ? 'bg-black text-white ring-4 ring-gray-200' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isDone ? '✓' : step}
              </div>
              {step < STEPS.length && <div className={`w-10 sm:w-16 h-0.5 ${isDone ? 'bg-black' : 'bg-gray-200'}`} />}
            </div>
          )
        })}
      </div>
      <p className="text-center text-xs text-gray-400 mt-2">
        Step {current} of {STEPS.length} — {STEPS[current - 1]}
      </p>
    </div>
  )
}
