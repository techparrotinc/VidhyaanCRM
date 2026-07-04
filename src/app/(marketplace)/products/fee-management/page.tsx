import { Metadata } from 'next'
import FeeManagementBespokePage from '@/components/marketplace/FeeManagementBespokePage'

export const metadata: Metadata = {
  title: 'Fee Management Software for Schools in India | Razorpay Integrated | Vidhyaan',
  description: "Automate school fee collection with Vidhyaan's fee management software — term & course invoicing, batch billing, and integrated Razorpay payments. Setup in under 15 minutes.",
  openGraph: {
    title: 'Fee Management Software for Schools in India | Razorpay Integrated | Vidhyaan',
    description: "Automate school fee collection with Vidhyaan's fee management software — term & course invoicing, batch billing, and integrated Razorpay payments. Setup in under 15 minutes.",
    url: 'https://vidhyaan.com/products/fee-management',
    images: [
      {
        url: 'https://vidhyaan.com/images/products/fee-management-list-screenshot.png',
        width: 1024,
        height: 572,
        alt: 'Vidhyaan Fee Management list dashboard showing fee statistics, search utilities, invoice details, due dates, amount, and status indicators.',
      }
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fee Management Software for Schools in India | Razorpay Integrated | Vidhyaan',
    description: "Automate school fee collection with Vidhyaan's fee management software — term & course invoicing, batch billing, and integrated Razorpay payments. Setup in under 15 minutes.",
    images: ['https://vidhyaan.com/images/products/fee-management-list-screenshot.png'],
  },
  alternates: {
    canonical: 'https://vidhyaan.com/products/fee-management',
  }
}

export default function FeeManagementPage() {
  const faqs = [
    {
      q: "Does Vidhyaan support online fee payment via Razorpay?",
      a: "Yes. Vidhyaan integrates directly with Razorpay, so parents can pay school fees online using UPI, cards, net banking, or wallets — with payments automatically reconciled against the correct invoice."
    },
    {
      q: "Can I still record offline payments (cash, cheque, bank transfer)?",
      a: "Yes. Online Razorpay payment is in addition to, not a replacement for, manual payment recording — your accounts team can log any offline payment method directly against an invoice."
    },
    {
      q: "Does this work for both schools and learning centers?",
      a: "Yes. Schools and junior colleges get term-based fee plans; learning centers and coaching centers get course-based recurring billing — the system adapts to your institution type automatically."
    },
    {
      q: "How long does it take to set up?",
      a: "Under 15 minutes — set up your fee structure once and you're ready to start generating invoices the same day."
    },
    {
      q: "What happens if a parent's Razorpay payment fails partway?",
      a: "If a payment attempt fails or is declined by the bank, Razorpay does not charge the parent. The invoice status in Vidhyaan remains 'Unpaid'. If the parent's account is debited but the payment is not marked as paid, Razorpay auto-refunds the amount within 3-5 business days."
    },
    {
      q: "Can we configure custom partial payment plans?",
      a: "Yes. You can split any terminal or course invoice into custom installments with unique due dates. The invoice will update to 'Partially Paid' when an installment is recorded, and automatically switch to 'Paid' only when the final balance reaches zero."
    },
    {
      q: "Are parents notified automatically when an invoice is generated?",
      a: "Yes. Once an invoice is generated or scheduled, parents receive automated email notifications and updates in their Parent Portal. You can also toggle SMS and WhatsApp integrations to send automated payment reminders before due dates."
    },
    {
      q: "How do we handle waiving or discounting fees for specific students?",
      a: "Admins can apply dynamic waivers or discounts to specific student invoices. You can select to waive specific fee heads completely or specify a custom discount value, which will update the total outstanding amount and log the action in the invoice timeline."
    },
    {
      q: "Is there a single transaction limit for Razorpay payments?",
      a: "By default, Razorpay supports transactions up to ₹10,00,000 per attempt for cards and net banking, while UPI limits are typically capped at ₹1,00,000 per day depending on the parent's bank. Custom transaction limits can be negotiated directly on your Razorpay dashboard."
    }
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FeeManagementBespokePage />
    </>
  )
}
