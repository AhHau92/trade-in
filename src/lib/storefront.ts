import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// Shared query used by both the product Server Component
// (src/app/(site)/[category]/[brand]/[product]/[condition]/page.tsx) and the
// public JSON API route (src/app/api/public/products/[slug]/route.ts), so
// the two can never drift apart on what counts as an available product.
// Wrapped in React's cache() because the product page now calls this from
// both generateMetadata() and the page component itself for the same
// request — cache() memoizes by arguments for the lifetime of one request,
// so that's one Prisma query instead of two, not two separate DB round trips.
export const getProductForStorefront = cache(async (slug: string, condition: string) => {
  const product = await prisma.product.findFirst({
    // Product routes are guessable, so the detail lookup must enforce the
    // same active-only rule as the category/brand listings. Otherwise an
    // inactive catalogue item would disappear from cards but remain
    // publicly reachable through its old URL.
    where: { slug, condition, isActive: true },
    include: {
      brand: { select: { name: true, slug: true } },
      variants: {
        where: { isActive: true },
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

  if (!product) return null

  product.variants.forEach(v => {
    v.questions.sort((a, b) => a.template.order - b.template.order)
  })

  return product
})

export async function getStorefrontSettings() {
  let settings = await prisma.settings.findFirst()
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: 'default', pickupFeeCents: 1000, currency: 'SGD', whatsappNumber: '' } })
  }
  return { pickupFeeCents: settings.pickupFeeCents, currency: settings.currency, whatsappNumber: settings.whatsappNumber }
}

// Shared by the homepage Server Component and /api/public/categories.
export async function getStorefrontCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    select: { id: true, name: true, slug: true, image: true },
  })
}

// Shared by the category Server Component and /api/public/categories/[slug]/brands.
export async function getCategoryWithBrands(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      brands: {
        // CategoryBrand is a pure join row with no order/createdAt column of
        // its own, so without this the list came back sorted by whatever
        // order Postgres happened to store the join rows in (effectively by
        // brandId) — completely ignoring the brand's actual drag-to-reorder
        // position, which is why the storefront could show a different
        // order than the admin's Brands list.
        orderBy: { brand: { order: 'asc' } },
        include: {
          brand: { select: { id: true, name: true, slug: true, image: true, isActive: true } },
        },
      },
    },
  })

  if (!category) return null

  const brands = category.brands.map(cb => cb.brand).filter(b => b.isActive)
  return { category: { id: category.id, name: category.name, slug: category.slug }, brands }
}

// Shared by the brand Server Component and /api/public/brands/[slug]/products.
export async function getBrandWithProducts(slug: string, categorySlug?: string) {
  const brand = await prisma.brand.findUnique({ where: { slug } })
  if (!brand) return null

  const where: Prisma.ProductWhereInput = { isActive: true, brandId: brand.id }
  if (categorySlug) {
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } })
    if (category) where.categoryId = category.id
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, name: true, slug: true, image: true, condition: true },
  })

  return { brand: { id: brand.id, name: brand.name, slug: brand.slug }, products }
}
