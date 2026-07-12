import { Resend } from 'resend'
import { formatMoney } from '@/lib/money'

const resend = new Resend(process.env.RESEND_API_KEY)

interface BookingEmailData {
  bookingRef: string
  productName: string
  variantName: string
  finalPriceCents: number
  currency: string
  appointmentType: string
  customerName: string
  customerEmail: string
  customerPhone: string
  postcode: string
  branchName?: string
  visitDate?: string
  address?: string
  collectionDate?: string
  collectionTime?: string
  selectedOptions: { question: string; answer: string }[]
}

export async function sendBookingNotification(data: BookingEmailData, notifyEmail: string) {
  // Email to admin
  await resend.emails.send({
    from: 'Trade-In <onboarding@resend.dev>',
    to: notifyEmail,
    subject: `New Trade-In Booking: ${data.bookingRef}`,
    html: `
      <h2>New Trade-In Booking</h2>
      <p><strong>Reference:</strong> ${data.bookingRef}</p>
      <hr/>
      <h3>Device</h3>
      <p><strong>Product:</strong> ${data.productName}</p>
      <p><strong>Variant:</strong> ${data.variantName}</p>
      <p><strong>Price:</strong> ${data.currency} ${formatMoney(data.finalPriceCents)}</p>
      <p><strong>Selections:</strong></p>
      <ul>${data.selectedOptions.map(o => `<li>${o.question}: <strong>${o.answer}</strong></li>`).join('')}</ul>
      <hr/>
      <h3>Customer</h3>
      <p><strong>Name:</strong> ${data.customerName}</p>
      <p><strong>Email:</strong> ${data.customerEmail}</p>
      <p><strong>Phone:</strong> ${data.customerPhone}</p>
      <p><strong>Postcode:</strong> ${data.postcode}</p>
      <hr/>
      <h3>Appointment (${data.appointmentType === 'store' ? 'Store Visit' : 'Pickup Service'})</h3>
      ${data.appointmentType === 'store' ? `
        <p><strong>Branch:</strong> ${data.branchName}</p>
        <p><strong>Visit Date:</strong> ${data.visitDate}</p>
      ` : `
        <p><strong>Address:</strong> ${data.address}</p>
        <p><strong>Collection:</strong> ${data.collectionDate} ${data.collectionTime}</p>
      `}
    `,
  })

  // Confirmation email to customer
  await resend.emails.send({
    from: 'Trade-In <onboarding@resend.dev>',
    to: data.customerEmail,
    subject: `Booking Confirmed: ${data.bookingRef}`,
    html: `
      <h2>Your Trade-In Booking is Confirmed!</h2>
      <p>Hi ${data.customerName},</p>
      <p>Thank you for your trade-in booking. Here are your details:</p>
      <p><strong>Reference:</strong> ${data.bookingRef}</p>
      <p><strong>Device:</strong> ${data.productName} (${data.variantName})</p>
      <p><strong>You get:</strong> ${data.currency} ${formatMoney(data.finalPriceCents)}</p>
      <hr/>
      <h3>Appointment Details</h3>
      ${data.appointmentType === 'store' ? `
        <p><strong>Type:</strong> Store Visit</p>
        <p><strong>Branch:</strong> ${data.branchName}</p>
        <p><strong>Date:</strong> ${data.visitDate}</p>
      ` : `
        <p><strong>Type:</strong> Pickup Service</p>
        <p><strong>Address:</strong> ${data.address}</p>
        <p><strong>Collection:</strong> ${data.collectionDate} ${data.collectionTime}</p>
      `}
      <hr/>
      <p>If you have any questions, please contact us via WhatsApp.</p>
    `,
  })
}