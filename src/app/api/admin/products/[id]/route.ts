import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slug'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      brand: { select: { name: true, slug: true } },
      category: { select: { name: true, slug: true } },
      variants: {
        orderBy: { order: 'asc' },
        include: {
          questions: {
            include: {
              template: { include: { options: { orderBy: { order: 'asc' } } } },
              overrides: true,
              options: true,
            },
          },
        },
      },
    },
  })

  if (product) {
    product.variants.forEach(v => {
      v.questions.sort((a: (typeof v.questions)[number], b: (typeof v.questions)[number]) => a.template.order - b.template.order)
    })
  }

  return NextResponse.json(product)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  // Same rule as the create route: an admin-supplied slug (from the now
  // editable slug field / "Sync from name" button) wins; otherwise re-derive
  // from the name so old callers (e.g. a partial PUT that only sends `name`)
  // keep behaving the way they always did.
  const slug = body.slug ? slugify(body.slug) : slugify(body.name)

  // The slug is now user-editable, so two products of the same condition can
  // collide on it (the `@@unique([slug, condition])` constraint) in a way
  // that wasn't previously reachable through the UI. Check up front so this
  // surfaces as a friendly 409 instead of an unhandled Prisma P2002 500.
  const existing = await prisma.product.findUnique({
    where: { slug_condition: { slug, condition: body.condition } },
  })
  if (existing && existing.id !== id) {
    return NextResponse.json(
      { error: `Another product already uses slug "${slug}" for "${body.condition}" condition.` },
      { status: 409 }
    )
  }

  // Content fields are only sent by the full product-edit form. Other
  // callers (e.g. the active/inactive toggle) PUT a partial body that omits
  // them — using `undefined` for an absent key tells Prisma "leave this
  // column alone" instead of overwriting it with null and wiping existing
  // content.
  const contentField = (key: 'introContent' | 'seoContent' | 'metaTitle' | 'metaDescription') =>
    key in body ? (body[key] || null) : undefined

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: body.name,
      slug,
      condition: body.condition,
      variantLabel: body.variantLabel || 'Device Built-In Storage',
      // Same "leave alone if absent" rule as the content fields above —
      // partial PUTs (e.g. the active/inactive toggle) don't send this and
      // shouldn't silently turn a dual-axis product back into single-axis.
      variantLabel2: 'variantLabel2' in body ? (body.variantLabel2 || null) : undefined,
      image: body.image || null,
      // Same "leave alone if absent" rule — the unified product-details form
      // doesn't expose an order field at all (that's managed on the separate
      // drag-to-reorder page), so it never sends this key. Previously this
      // was `body.order || 0` unconditionally, which would have silently
      // reset every product's manually-set order back to 0 on every save.
      order: 'order' in body ? (body.order || 0) : undefined,
      isActive: body.isActive,
      brandId: body.brandId,
      categoryId: body.categoryId,
      introContent: contentField('introContent'),
      seoContent: contentField('seoContent'),
      metaTitle: contentField('metaTitle'),
      metaDescription: contentField('metaDescription'),
    },
  })
  return NextResponse.json(product)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Booking.variantId is ON DELETE SET NULL (see schema.prisma), so deleting
  // this product's variants (cascaded from the product delete below) just
  // detaches any bookings that referenced them — their productName/
  // variantName/branchName snapshots and full history are untouched. No
  // pre-check needed here anymore.
  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ success: true })
}