import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const demoImages = {
  phonePro:
    'https://res.cloudinary.com/da23z4gc5/image/upload/v1785554093/trade-in/demo-catalog/phone-pro-graphite.png',
  phoneUltra:
    'https://res.cloudinary.com/da23z4gc5/image/upload/v1785554093/trade-in/demo-catalog/phone-ultra-navy.png',
  laptopAir:
    'https://res.cloudinary.com/da23z4gc5/image/upload/v1785554093/trade-in/demo-catalog/laptop-air-midnight.png',
  laptopPro:
    'https://res.cloudinary.com/da23z4gc5/image/upload/v1785554093/trade-in/demo-catalog/laptop-pro-space-gray.png',
  appleBrand:
    'https://res.cloudinary.com/da23z4gc5/image/upload/v1784845055/trade-in/brands/jyanrd8fvshttohbxcuk.png',
  samsungBrand:
    'https://res.cloudinary.com/da23z4gc5/image/upload/v1784845079/trade-in/brands/eicc6xox2hw0tjfpd2ec.png',
} as const

type DemoOption = {
  label: string
  priceAdjustCents: number
  isWhatsapp?: boolean
  description?: string
  defaultChecked?: boolean
}

type DemoTemplate = {
  key: string
  id: string
  title: string
  type: 'single' | 'multi'
  helpText: string
  order: number
  options: DemoOption[]
}

type DemoVariant = {
  name: string
  colour: string
  priceCents: number
}

type DemoProduct = {
  name: string
  slug: string
  condition: 'new' | 'used'
  category: 'phones' | 'macbooks'
  brand: 'apple' | 'samsung'
  image: string
  order: number
  variantLabel: string
  variants: DemoVariant[]
  questions: string[]
}

const idPart = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const templateSeeds: DemoTemplate[] = [
  {
    key: 'activation',
    id: 'demo-template-activation',
    title: 'Activation Status',
    type: 'single',
    helpText: 'Demo adjustments reflect how activation and packaging can affect an estimate.',
    order: 1,
    options: [
      { label: 'Sealed Non Activated', priceAdjustCents: 0, description: 'Factory sealed and not activated.' },
      { label: 'Unsealed and Non Activated', priceAdjustCents: -4000, description: 'Packaging opened, device not activated.' },
      { label: 'Activated Within 3 Days', priceAdjustCents: -8000, description: 'Recently activated and otherwise complete.' },
      { label: 'Activated More than 3 Days', priceAdjustCents: 0, isWhatsapp: true, description: 'Requires a manual review in this demo.' },
    ],
  },
  {
    key: 'functionality',
    id: 'demo-template-functionality',
    title: 'Device Functionality',
    type: 'single',
    helpText: 'Confirm that the main hardware and security features work normally.',
    order: 2,
    options: [
      { label: 'Fully Functional', priceAdjustCents: 0, description: 'Powers on and all major functions work.' },
      { label: 'Minor Hardware Issue', priceAdjustCents: 0, isWhatsapp: true, description: 'Manual assessment is needed before quoting.' },
      { label: 'Cannot Power On', priceAdjustCents: 0, isWhatsapp: true, description: 'Manual assessment is needed before quoting.' },
    ],
  },
  {
    key: 'screen',
    id: 'demo-template-screen',
    title: 'Screen Condition',
    type: 'single',
    helpText: 'Choose the closest description. Final condition is verified during inspection.',
    order: 3,
    options: [
      { label: 'Perfect', priceAdjustCents: 0, description: 'No visible scratches under normal lighting.' },
      { label: 'Light Scratches', priceAdjustCents: -4000, description: 'Small surface marks with no display issue.' },
      { label: 'Deep Scratches', priceAdjustCents: -12000, description: 'Clearly visible scratches, display still works.' },
      { label: 'Cracked / Display Issue', priceAdjustCents: 0, isWhatsapp: true, description: 'Requires a manual assessment.' },
    ],
  },
  {
    key: 'housing',
    id: 'demo-template-housing',
    title: 'Housing Condition',
    type: 'single',
    helpText: 'Assess the frame, back panel, corners, and visible finish.',
    order: 4,
    options: [
      { label: 'Perfect', priceAdjustCents: 0, description: 'No visible dents, chips, or paint loss.' },
      { label: 'Light Scratches / Light Paint Peel', priceAdjustCents: -2500, description: 'Normal cosmetic wear only.' },
      { label: 'Deep Scratches / Dents', priceAdjustCents: -8000, description: 'Visible wear or small dents.' },
      { label: 'Bent / Major Damage', priceAdjustCents: 0, isWhatsapp: true, description: 'Requires a manual assessment.' },
    ],
  },
  {
    key: 'battery',
    id: 'demo-template-battery',
    title: 'Battery Health Percentage',
    type: 'single',
    helpText: 'Use the battery health shown in device settings where available.',
    order: 5,
    options: [
      { label: '100% - 90%', priceAdjustCents: 0 },
      { label: '89% - 86%', priceAdjustCents: -3000 },
      { label: '85% - 81%', priceAdjustCents: -6000 },
      { label: '80% or less', priceAdjustCents: -10000 },
    ],
  },
  {
    key: 'accessories',
    id: 'demo-template-accessories',
    title: 'Original Accessories',
    type: 'single',
    helpText: 'Select the best matching bundle included with the device.',
    order: 6,
    options: [
      { label: 'No Original Accessories', priceAdjustCents: 0 },
      { label: 'Charging Cable Only', priceAdjustCents: 1000 },
      { label: 'Original Box and Cable', priceAdjustCents: 2500 },
      { label: 'Complete Original Set', priceAdjustCents: 4000 },
    ],
  },
]

const colourVariants = (
  storagePrices: Array<[string, number]>,
  colours: string[],
): DemoVariant[] =>
  storagePrices.flatMap(([name, priceCents]) =>
    colours.map((colour) => ({ name, colour, priceCents })),
  )

const demoProducts: DemoProduct[] = [
  {
    name: 'iPhone 17 Pro Max',
    slug: 'iphone-17-pro-max',
    condition: 'new',
    category: 'phones',
    brand: 'apple',
    image: demoImages.phonePro,
    order: 0,
    variantLabel: 'Storage',
    variants: colourVariants([['512GB', 95000], ['1TB', 105000]], ['Graphite', 'Silver']),
    questions: ['activation'],
  },
  {
    name: 'iPhone 17 Pro Max',
    slug: 'iphone-17-pro-max',
    condition: 'used',
    category: 'phones',
    brand: 'apple',
    image: demoImages.phonePro,
    order: 0,
    variantLabel: 'Storage',
    variants: colourVariants([['512GB', 78000], ['1TB', 88000]], ['Graphite', 'Silver']),
    questions: ['functionality', 'screen', 'housing', 'battery', 'accessories'],
  },
  {
    name: 'iPhone 16 Pro Max',
    slug: 'iphone-16-pro-max',
    condition: 'new',
    category: 'phones',
    brand: 'apple',
    image: demoImages.phonePro,
    order: 1,
    variantLabel: 'Storage',
    variants: colourVariants([['256GB', 76000], ['512GB', 85000]], ['Black', 'Natural']),
    questions: ['activation'],
  },
  {
    name: 'iPhone 15 Pro Max',
    slug: 'iphone-15-pro-max',
    condition: 'used',
    category: 'phones',
    brand: 'apple',
    image: demoImages.phonePro,
    order: 2,
    variantLabel: 'Storage',
    variants: colourVariants([['256GB', 56000], ['512GB', 64000]], ['Black', 'Blue']),
    questions: ['functionality', 'screen', 'housing', 'battery', 'accessories'],
  },
  {
    name: 'Galaxy S25 Ultra',
    slug: 'galaxy-s25-ultra',
    condition: 'new',
    category: 'phones',
    brand: 'samsung',
    image: demoImages.phoneUltra,
    order: 0,
    variantLabel: 'Storage',
    variants: colourVariants([['256GB', 82000], ['512GB', 90000]], ['Navy', 'Silver']),
    questions: ['activation'],
  },
  {
    name: 'Galaxy S25 Ultra',
    slug: 'galaxy-s25-ultra',
    condition: 'used',
    category: 'phones',
    brand: 'samsung',
    image: demoImages.phoneUltra,
    order: 0,
    variantLabel: 'Storage',
    variants: colourVariants([['256GB', 65000], ['512GB', 72000]], ['Navy', 'Silver']),
    questions: ['functionality', 'screen', 'housing', 'battery', 'accessories'],
  },
  {
    name: 'Galaxy S24 Ultra',
    slug: 'galaxy-s24-ultra',
    condition: 'used',
    category: 'phones',
    brand: 'samsung',
    image: demoImages.phoneUltra,
    order: 1,
    variantLabel: 'Storage',
    variants: colourVariants([['256GB', 50000], ['512GB', 57000]], ['Black', 'Violet']),
    questions: ['functionality', 'screen', 'housing', 'battery', 'accessories'],
  },
  {
    name: 'MacBook Air 13-inch M3',
    slug: 'macbook-air-13-m3',
    condition: 'used',
    category: 'macbooks',
    brand: 'apple',
    image: demoImages.laptopAir,
    order: 0,
    variantLabel: 'Memory / Storage',
    variants: colourVariants([['8GB / 256GB', 65000], ['16GB / 512GB', 82000]], ['Midnight', 'Silver']),
    questions: ['functionality', 'screen', 'housing', 'battery', 'accessories'],
  },
  {
    name: 'MacBook Pro 14-inch M3',
    slug: 'macbook-pro-14-m3',
    condition: 'used',
    category: 'macbooks',
    brand: 'apple',
    image: demoImages.laptopPro,
    order: 1,
    variantLabel: 'Memory / Storage',
    variants: colourVariants([['8GB / 512GB', 92000], ['16GB / 1TB', 115000]], ['Space Gray', 'Silver']),
    questions: ['functionality', 'screen', 'housing', 'battery', 'accessories'],
  },
]

async function upsertAdminFromEnvironment() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim()
  const password = process.env.SEED_ADMIN_PASSWORD

  if (!email || !password) {
    console.log('ℹ️  Admin seed skipped (set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create one)')
    return
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  await prisma.admin.upsert({
    where: { email },
    update: {},
    create: {
      name: 'Portfolio Admin',
      email,
      password: hashedPassword,
      role: 'superadmin',
    },
  })
}

async function upsertTemplate(seed: DemoTemplate) {
  const existing = await prisma.questionTemplate.findFirst({ where: { title: seed.title } })
  const template = existing
    ? await prisma.questionTemplate.update({
        where: { id: existing.id },
        data: {
          type: seed.type,
          helpText: seed.helpText,
          order: seed.order,
          isActive: true,
        },
      })
    : await prisma.questionTemplate.create({
        data: {
          id: seed.id,
          title: seed.title,
          type: seed.type,
          helpText: seed.helpText,
          order: seed.order,
          isActive: true,
        },
      })

  for (const [order, option] of seed.options.entries()) {
    const existingOption = await prisma.questionTemplateOption.findFirst({
      where: { templateId: template.id, label: option.label },
    })
    const data = {
      priceAdjustCents: option.priceAdjustCents,
      isWhatsapp: option.isWhatsapp ?? false,
      description: option.description ?? null,
      defaultChecked: option.defaultChecked ?? false,
      order,
    }

    if (existingOption) {
      await prisma.questionTemplateOption.update({
        where: { id: existingOption.id },
        data,
      })
    } else {
      await prisma.questionTemplateOption.create({
        data: {
          id: `${seed.id}-${idPart(option.label)}`,
          templateId: template.id,
          label: option.label,
          ...data,
        },
      })
    }
  }

  return template.id
}

async function upsertDemoProduct(
  productSeed: DemoProduct,
  categoryIds: Record<DemoProduct['category'], string>,
  brandIds: Record<DemoProduct['brand'], string>,
  templateIds: Record<string, string>,
) {
  const conditionLabel = productSeed.condition === 'new' ? 'New' : 'Used'
  const product = await prisma.product.upsert({
    where: {
      slug_condition: {
        slug: productSeed.slug,
        condition: productSeed.condition,
      },
    },
    update: {
      name: productSeed.name,
      brandId: brandIds[productSeed.brand],
      categoryId: categoryIds[productSeed.category],
      image: productSeed.image,
      order: productSeed.order,
      isActive: true,
      variantLabel: productSeed.variantLabel,
      variantLabel2: 'Colour',
      introContent:
        '<p>Select a configuration and answer the condition questions below to explore an <strong>illustrative portfolio demo estimate</strong>.</p>',
      seoContent:
        '<p>Sample products, images, availability, and prices on this page are fictional demo data. They are not market valuations or commercial offers. A real trade-in service would verify the device before confirming a final value.</p>',
      metaTitle: `${productSeed.name} ${conditionLabel} | Demo Trade-In Estimate`,
      metaDescription: `Explore an illustrative ${conditionLabel.toLowerCase()} ${productSeed.name} trade-in estimate in this full-stack portfolio demo.`,
    },
    create: {
      name: productSeed.name,
      slug: productSeed.slug,
      condition: productSeed.condition,
      brandId: brandIds[productSeed.brand],
      categoryId: categoryIds[productSeed.category],
      image: productSeed.image,
      order: productSeed.order,
      isActive: true,
      variantLabel: productSeed.variantLabel,
      variantLabel2: 'Colour',
      introContent:
        '<p>Select a configuration and answer the condition questions below to explore an <strong>illustrative portfolio demo estimate</strong>.</p>',
      seoContent:
        '<p>Sample products, images, availability, and prices on this page are fictional demo data. They are not market valuations or commercial offers. A real trade-in service would verify the device before confirming a final value.</p>',
      metaTitle: `${productSeed.name} ${conditionLabel} | Demo Trade-In Estimate`,
      metaDescription: `Explore an illustrative ${conditionLabel.toLowerCase()} ${productSeed.name} trade-in estimate in this full-stack portfolio demo.`,
    },
  })

  const activeVariantIds: string[] = []
  const requiredTemplateIds = productSeed.questions.map((key) => templateIds[key])

  for (const [variantOrder, variantSeed] of productSeed.variants.entries()) {
    const existingVariant = await prisma.variant.findFirst({
      where: {
        productId: product.id,
        name: variantSeed.name,
        axis2Value: variantSeed.colour,
      },
    })

    const variant = existingVariant
      ? await prisma.variant.update({
          where: { id: existingVariant.id },
          data: {
            basePriceCents: variantSeed.priceCents,
            order: variantOrder,
            isActive: true,
            isWhatsappOnly: false,
          },
        })
      : await prisma.variant.create({
          data: {
            id: `demo-${idPart(productSeed.slug)}-${productSeed.condition}-${idPart(variantSeed.name)}-${idPart(variantSeed.colour)}`,
            productId: product.id,
            name: variantSeed.name,
            axis2Value: variantSeed.colour,
            basePriceCents: variantSeed.priceCents,
            order: variantOrder,
            isActive: true,
            isWhatsappOnly: false,
          },
        })

    activeVariantIds.push(variant.id)

    await prisma.variantQuestion.deleteMany({
      where: {
        variantId: variant.id,
        templateId: { notIn: requiredTemplateIds },
      },
    })

    for (const [questionOrder, templateId] of requiredTemplateIds.entries()) {
      await prisma.variantQuestion.upsert({
        where: {
          variantId_templateId: {
            variantId: variant.id,
            templateId,
          },
        },
        update: { order: questionOrder },
        create: {
          variantId: variant.id,
          templateId,
          order: questionOrder,
        },
      })
    }
  }

  await prisma.variant.updateMany({
    where: {
      productId: product.id,
      id: { notIn: activeVariantIds },
    },
    data: { isActive: false },
  })

  const firstVariant = productSeed.variants[0]
  return {
    productId: product.id,
    productName: product.name,
    variantId: activeVariantIds[0],
    variantName: `${firstVariant.name} / ${firstVariant.colour}`,
    finalPriceCents: firstVariant.priceCents,
  }
}

async function main() {
  await upsertAdminFromEnvironment()

  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {
      currency: 'SGD',
      pickupFeeCents: 1000,
    },
    create: {
      id: 'default',
      pickupFeeCents: 1000,
      currency: 'SGD',
      whatsappNumber: '',
      notifyEmail: '',
    },
  })

  const phones = await prisma.category.upsert({
    where: { slug: 'sell-phone' },
    update: {
      name: 'Phones',
      image: demoImages.phonePro,
      order: 0,
      isActive: true,
    },
    create: {
      name: 'Phones',
      slug: 'sell-phone',
      image: demoImages.phonePro,
      order: 0,
      isActive: true,
    },
  })

  const macbooks = await prisma.category.upsert({
    where: { slug: 'sell-macbook' },
    update: {
      name: 'MacBooks',
      image: demoImages.laptopAir,
      order: 1,
      isActive: true,
    },
    create: {
      name: 'MacBooks',
      slug: 'sell-macbook',
      image: demoImages.laptopAir,
      order: 1,
      isActive: true,
    },
  })

  const apple = await prisma.brand.upsert({
    where: { slug: 'apple' },
    update: {
      name: 'Apple',
      image: demoImages.appleBrand,
      order: 0,
      isActive: true,
    },
    create: {
      name: 'Apple',
      slug: 'apple',
      image: demoImages.appleBrand,
      order: 0,
      isActive: true,
    },
  })

  const samsung = await prisma.brand.upsert({
    where: { slug: 'samsung' },
    update: {
      name: 'Samsung',
      image: demoImages.samsungBrand,
      order: 1,
      isActive: true,
    },
    create: {
      name: 'Samsung',
      slug: 'samsung',
      image: demoImages.samsungBrand,
      order: 1,
      isActive: true,
    },
  })

  for (const [categoryId, brandId] of [
    [phones.id, apple.id],
    [phones.id, samsung.id],
    [macbooks.id, apple.id],
  ]) {
    await prisma.categoryBrand.upsert({
      where: { categoryId_brandId: { categoryId, brandId } },
      update: {},
      create: { categoryId, brandId },
    })
  }

  const templateIds: Record<string, string> = {}
  for (const seed of templateSeeds) {
    templateIds[seed.key] = await upsertTemplate(seed)
  }

  const demoBranches = [
    {
      id: 'demo-branch-central',
      name: 'Central Demo Studio',
      address: 'Portfolio demo location · Central Singapore',
      order: 0,
    },
    {
      id: 'demo-branch-east',
      name: 'East Demo Point',
      address: 'Portfolio demo location · East Singapore',
      order: 1,
    },
  ]

  for (const branch of demoBranches) {
    await prisma.branch.upsert({
      where: { id: branch.id },
      update: {
        name: branch.name,
        address: branch.address,
        order: branch.order,
        isActive: true,
      },
      create: {
        ...branch,
        isActive: true,
      },
    })
  }

  await prisma.branch.updateMany({
    where: { id: { notIn: demoBranches.map((branch) => branch.id) } },
    data: { isActive: false },
  })

  const categoryIds = { phones: phones.id, macbooks: macbooks.id }
  const brandIds = { apple: apple.id, samsung: samsung.id }
  const seededProducts = new Map<string, Awaited<ReturnType<typeof upsertDemoProduct>>>()
  for (const productSeed of demoProducts) {
    const seeded = await upsertDemoProduct(productSeed, categoryIds, brandIds, templateIds)
    seededProducts.set(`${productSeed.slug}:${productSeed.condition}`, seeded)
  }

  const demoBookingSeeds = [
    {
      bookingRef: 'DEMO-TI-001',
      productKey: 'iphone-17-pro-max:used',
      name: 'Demo Customer A',
      email: 'demo-a@example.com',
      phone: '+65 8000 0001',
      status: 'pending',
      appointmentType: 'store',
      dayOffset: 2,
    },
    {
      bookingRef: 'DEMO-TI-002',
      productKey: 'galaxy-s25-ultra:used',
      name: 'Demo Customer B',
      email: 'demo-b@example.com',
      phone: '+65 8000 0002',
      status: 'confirmed',
      appointmentType: 'store',
      dayOffset: 3,
    },
    {
      bookingRef: 'DEMO-TI-003',
      productKey: 'macbook-air-13-m3:used',
      name: 'Demo Customer C',
      email: 'demo-c@example.com',
      phone: '+65 8000 0003',
      status: 'completed',
      appointmentType: 'pickup',
      dayOffset: 1,
    },
    {
      bookingRef: 'DEMO-TI-004',
      productKey: 'iphone-16-pro-max:new',
      name: 'Demo Customer D',
      email: 'demo-d@example.com',
      phone: '+65 8000 0004',
      status: 'cancelled',
      appointmentType: 'store',
      dayOffset: 4,
    },
  ]

  for (const bookingSeed of demoBookingSeeds) {
    const product = seededProducts.get(bookingSeed.productKey)
    if (!product) throw new Error(`Missing seeded product for ${bookingSeed.productKey}`)

    const appointmentDate = new Date()
    appointmentDate.setDate(appointmentDate.getDate() + bookingSeed.dayOffset)
    appointmentDate.setHours(11, 0, 0, 0)
    const isStore = bookingSeed.appointmentType === 'store'

    await prisma.booking.upsert({
      where: { bookingRef: bookingSeed.bookingRef },
      update: {
        status: bookingSeed.status,
        variantId: product.variantId,
        productName: product.productName,
        variantName: product.variantName,
        finalPriceCents: product.finalPriceCents,
        appointmentType: bookingSeed.appointmentType,
        branchId: isStore ? demoBranches[0].id : null,
        branchName: isStore ? demoBranches[0].name : null,
        visitDate: isStore ? appointmentDate : null,
        address: isStore ? null : 'Portfolio demo collection address',
        collectionDate: isStore ? null : appointmentDate,
        collectionTime: isStore ? null : '11:00 - 13:00',
      },
      create: {
        bookingRef: bookingSeed.bookingRef,
        appointmentType: bookingSeed.appointmentType,
        variantId: product.variantId,
        productName: product.productName,
        variantName: product.variantName,
        branchId: isStore ? demoBranches[0].id : null,
        branchName: isStore ? demoBranches[0].name : null,
        finalPriceCents: product.finalPriceCents,
        selectedOptions: [
          {
            question: 'Portfolio demo booking',
            answer: 'Illustrative seeded data',
            priceAdjustCents: 0,
          },
        ],
        name: bookingSeed.name,
        email: bookingSeed.email,
        phone: bookingSeed.phone,
        postcode: '000000',
        visitDate: isStore ? appointmentDate : null,
        address: isStore ? null : 'Portfolio demo collection address',
        collectionDate: isStore ? null : appointmentDate,
        collectionTime: isStore ? null : '11:00 - 13:00',
        status: bookingSeed.status,
      },
    })
  }

  const [productCount, variantCount, templateCount] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.variant.count({ where: { isActive: true } }),
    prisma.questionTemplate.count({ where: { isActive: true } }),
  ])

  console.log(
    `✅ Demo seed complete: ${productCount} active product records, ${variantCount} active variants, ${templateCount} question templates`,
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
