import { NextRequest, NextResponse } from 'next/server'

// Public endpoints have no auth, so anyone can throw arbitrarily large or
// malformed payloads at them. Reject early, before we ever touch Prisma.
const MAX_BODY_BYTES = 20_000 // generous for a booking form; blocks abuse payloads

export async function readJsonBody(
  req: NextRequest,
): Promise<{ ok: true; body: unknown } | { ok: false; response: NextResponse }> {
  const contentLength = req.headers.get('content-length')
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return { ok: false, response: NextResponse.json({ error: 'Request body too large' }, { status: 413 }) }
  }

  const text = await req.text()
  if (text.length > MAX_BODY_BYTES) {
    return { ok: false, response: NextResponse.json({ error: 'Request body too large' }, { status: 413 }) }
  }

  try {
    return { ok: true, body: JSON.parse(text) }
  } catch {
    return { ok: false, response: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }
  }
}
