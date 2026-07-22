// Shared slug helpers so the client (live preview / sync button) and the
// server (final stored value) always agree on the same transform.
//
// `slugify` is the "final, clean" version — trims leading/trailing dashes and
// collapses runs of invalid characters into a single dash. Used server-side
// and by the "Sync from name" button.
//
// `slugifyLive` is a lighter touch meant for onChange while the admin is
// still typing directly into the slug field: it lowercases and swaps invalid
// characters for a dash, but does NOT trim a trailing dash, so typing
// "iphone-17-" doesn't get its trailing dash eaten before the next word is
// typed. The full `slugify` cleanup still runs on blur and on submit.
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function slugifyLive(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-')
}
