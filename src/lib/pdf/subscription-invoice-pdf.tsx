import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet, pdf } from '@react-pdf/renderer'

/**
 * Platform subscription GST invoice (Zoho-style tax invoice layout) — our own
 * PDF with full layout control, replacing reliance on Razorpay's hosted page.
 * Amounts/addresses come from our records (the source of truth — prices are
 * always computed server-side); payment settlement facts are fetched from
 * Razorpay by the route before rendering.
 */

export interface SubscriptionInvoiceData {
  invoiceNo: string
  date: Date
  dueDate: Date
  poNumber?: string | null
  placeOfSupply?: string | null
  userEmail?: string | null
  seller: {
    name: string
    address?: string | null
    gstin?: string | null
    pan?: string | null
    signatoryName?: string | null
    /** Signature image (uploaded in Admin Settings) — absolute URL or data URL. */
    signatoryImageUrl?: string | null
    /** Rubber stamp image — absolute URL or data URL. */
    stampImageUrl?: string | null
  }
  billTo: { name: string; attn?: string | null; address?: string | null; gstin?: string | null }
  shipTo: { name: string; address?: string | null }
  item: { description: string; details: string[]; qty: number; rate: number; sac: string }
  /** All in rupees; cgst + sgst always sum to the exact GST. */
  amounts: { base: number; cgst: number; sgst: number; total: number; paid: number }
  payment?: { id: string; method?: string | null; paidAt?: Date | null } | null
  /** QR (data URL) linking to the hosted payment/invoice page. */
  qrDataUrl?: string | null
  notes: string[]
}

// ---- Amount in words (Indian numbering: crore/lakh/thousand) --------------
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function twoDigits(n: number): string {
  if (n < 20) return ONES[n]
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ' ' + ONES[n % 10] : ''}`
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100)
  const rest = n % 100
  return [h ? `${ONES[h]} Hundred` : '', twoDigits(rest)].filter(Boolean).join(' ')
}

export function rupeesInWords(amount: number): string {
  const whole = Math.floor(amount)
  const paise = Math.round((amount - whole) * 100)
  if (whole === 0 && paise === 0) return 'Rupees Zero Only'
  const crore = Math.floor(whole / 10000000)
  const lakh = Math.floor((whole % 10000000) / 100000)
  const thousand = Math.floor((whole % 100000) / 1000)
  const rest = whole % 1000
  const parts = [
    crore ? `${twoDigits(crore)} Crore` : '',
    lakh ? `${twoDigits(lakh)} Lakh` : '',
    thousand ? `${twoDigits(thousand)} Thousand` : '',
    rest ? threeDigits(rest) : ''
  ].filter(Boolean)
  const words = `Rupees ${parts.join(' ')}`
  return paise ? `${words} and ${twoDigits(paise)} Paise Only` : `${words} Only`
}

const inr = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

// ---- Styles ---------------------------------------------------------------
const s = StyleSheet.create({
  page: { padding: 36, fontSize: 9, color: '#334155', fontFamily: 'Helvetica' },
  topNote: { textAlign: 'center', fontSize: 8, color: '#64748b', marginBottom: 10, fontStyle: 'italic' },
  frame: { borderWidth: 1, borderColor: '#0f172a' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#0f172a' },
  logoText: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#1565D8', marginBottom: 6 },
  sellerName: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginBottom: 3 },
  sellerLine: { fontSize: 8.5, color: '#334155', lineHeight: 1.45 },
  taxInvoice: { fontSize: 26, fontFamily: 'Helvetica-Bold', color: '#0f172a', textAlign: 'right' },
  metaRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#0f172a' },
  metaCol: { width: '50%', padding: 10 },
  metaColLeft: { borderRightWidth: 1, borderRightColor: '#0f172a' },
  metaLine: { flexDirection: 'row', marginBottom: 3 },
  metaKey: { width: 82, fontSize: 8.5, color: '#475569' },
  metaVal: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#0f172a', flex: 1 },
  addrRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#0f172a' },
  addrCol: { width: '50%', padding: 10 },
  addrHead: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0f172a', backgroundColor: '#f1f5f9', paddingVertical: 2, paddingHorizontal: 4, marginBottom: 5 },
  addrName: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginBottom: 2 },
  addrLine: { fontSize: 8.5, lineHeight: 1.45 },
  th: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  tableHead: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#0f172a', backgroundColor: '#f8fafc' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#0f172a' },
  cell: { padding: 6, borderRightWidth: 1, borderRightColor: '#0f172a', justifyContent: 'center' },
  cellLast: { padding: 6, justifyContent: 'center' },
  right: { textAlign: 'right' },
  bottomRow: { flexDirection: 'row' },
  wordsCol: { width: '55%', padding: 10, borderRightWidth: 1, borderRightColor: '#0f172a' },
  totalsCol: { width: '45%' },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, paddingHorizontal: 10 },
  totalKey: { fontSize: 8.5, color: '#475569' },
  totalVal: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  grand: { borderTopWidth: 1, borderTopColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#0f172a', backgroundColor: '#f8fafc' },
  balanceDue: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  paidRed: { color: '#dc2626' },
  signBlock: { alignItems: 'center', padding: 14, paddingTop: 24 },
  signImages: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, minHeight: 20 },
  signImg: { height: 52, objectFit: 'contain' },
  stampImg: { height: 64, objectFit: 'contain', opacity: 0.9 },
  signLine: { fontSize: 8.5, color: '#0f172a', marginTop: 16, borderTopWidth: 1, borderTopColor: '#94a3b8', paddingTop: 4, width: 170, textAlign: 'center' },
  qrRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  qrImg: { width: 74, height: 74 },
  qrText: { fontSize: 8, color: '#475569', width: 180 },
  noteText: { fontSize: 8, color: '#475569', lineHeight: 1.5, marginTop: 4 }
})

export function SubscriptionInvoicePDF({ data }: { data: SubscriptionInvoiceData }) {
  const a = data.amounts
  const balance = Math.max(0, Math.round((a.total - a.paid) * 100) / 100)
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.topNote}>*This is a computer generated invoice and does not require a physical copy</Text>
        <View style={s.frame}>
          {/* Header: seller + TAX INVOICE */}
          <View style={s.headerRow}>
            <View style={{ maxWidth: '60%' }}>
              <Text style={s.logoText}>Vidhyaan</Text>
              <Text style={s.sellerName}>{data.seller.name}</Text>
              {data.seller.address ? <Text style={s.sellerLine}>{data.seller.address}</Text> : null}
              {data.seller.pan ? <Text style={s.sellerLine}>PAN No: {data.seller.pan}</Text> : null}
              {data.seller.gstin ? <Text style={s.sellerLine}>GSTIN: {data.seller.gstin}</Text> : null}
            </View>
            <View style={{ justifyContent: 'flex-end' }}>
              <Text style={s.taxInvoice}>TAX INVOICE</Text>
            </View>
          </View>

          {/* Meta */}
          <View style={s.metaRow}>
            <View style={[s.metaCol, s.metaColLeft]}>
              <View style={s.metaLine}><Text style={s.metaKey}>INVOICE#</Text><Text style={s.metaVal}>: {data.invoiceNo}</Text></View>
              <View style={s.metaLine}><Text style={s.metaKey}>DATE</Text><Text style={s.metaVal}>: {fmtDate(data.date)}</Text></View>
              <View style={s.metaLine}><Text style={s.metaKey}>TERMS</Text><Text style={s.metaVal}>: Due On Receipt</Text></View>
              <View style={s.metaLine}><Text style={s.metaKey}>DUE DATE</Text><Text style={s.metaVal}>: {fmtDate(data.dueDate)}</Text></View>
              {data.poNumber ? (
                <View style={s.metaLine}><Text style={s.metaKey}>P.O.#</Text><Text style={s.metaVal}>: {data.poNumber}</Text></View>
              ) : null}
            </View>
            <View style={s.metaCol}>
              {data.placeOfSupply ? (
                <View style={s.metaLine}><Text style={s.metaKey}>Place of Supply</Text><Text style={s.metaVal}>: {data.placeOfSupply}</Text></View>
              ) : null}
              {data.userEmail ? (
                <View style={s.metaLine}><Text style={s.metaKey}>UserMail</Text><Text style={s.metaVal}>: {data.userEmail}</Text></View>
              ) : null}
              {data.payment ? (
                <>
                  <View style={s.metaLine}><Text style={s.metaKey}>Payment Ref</Text><Text style={s.metaVal}>: {data.payment.id}</Text></View>
                  {data.payment.method ? (
                    <View style={s.metaLine}><Text style={s.metaKey}>Payment Mode</Text><Text style={s.metaVal}>: {data.payment.method.toUpperCase()}</Text></View>
                  ) : null}
                  {data.payment.paidAt ? (
                    <View style={s.metaLine}><Text style={s.metaKey}>Paid On</Text><Text style={s.metaVal}>: {fmtDate(data.payment.paidAt)}</Text></View>
                  ) : null}
                </>
              ) : null}
            </View>
          </View>

          {/* Bill To / Ship To */}
          <View style={s.addrRow}>
            <View style={[s.addrCol, { borderRightWidth: 1, borderRightColor: '#0f172a' }]}>
              <Text style={s.addrHead}>Bill To</Text>
              <Text style={s.addrName}>{data.billTo.name}</Text>
              {data.billTo.attn ? <Text style={s.addrLine}>Attn: {data.billTo.attn}</Text> : null}
              {data.billTo.address ? <Text style={s.addrLine}>{data.billTo.address}</Text> : null}
              {data.billTo.gstin ? <Text style={s.addrLine}>GSTIN {data.billTo.gstin}</Text> : null}
            </View>
            <View style={s.addrCol}>
              <Text style={s.addrHead}>Ship To</Text>
              <Text style={s.addrName}>{data.shipTo.name}</Text>
              {data.shipTo.address ? <Text style={s.addrLine}>{data.shipTo.address}</Text> : null}
            </View>
          </View>

          {/* Items table */}
          <View style={s.tableHead}>
            <View style={[s.cell, { width: '34%' }]}><Text style={s.th}>Item & Description</Text></View>
            <View style={[s.cell, { width: '7%' }]}><Text style={[s.th, s.right]}>Qty</Text></View>
            <View style={[s.cell, { width: '13%' }]}><Text style={[s.th, s.right]}>Rate</Text></View>
            <View style={[s.cell, { width: '8%' }]}><Text style={[s.th, s.right]}>CGST %</Text></View>
            <View style={[s.cell, { width: '11%' }]}><Text style={[s.th, s.right]}>Amt</Text></View>
            <View style={[s.cell, { width: '8%' }]}><Text style={[s.th, s.right]}>SGST %</Text></View>
            <View style={[s.cell, { width: '11%' }]}><Text style={[s.th, s.right]}>Amt</Text></View>
            <View style={[s.cellLast, { width: '13%' }]}><Text style={[s.th, s.right]}>Amount</Text></View>
          </View>
          <View style={s.tableRow}>
            <View style={[s.cell, { width: '34%' }]}>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: '#0f172a' }}>{data.item.description}</Text>
              {data.item.details.map((line) => (
                <Text key={line} style={{ fontSize: 8, color: '#475569', marginTop: 1.5 }}>{line}</Text>
              ))}
              <Text style={{ fontSize: 8, color: '#475569', marginTop: 1.5 }}>SAC: {data.item.sac}</Text>
            </View>
            <View style={[s.cell, { width: '7%' }]}><Text style={s.right}>{data.item.qty.toFixed(2)}</Text></View>
            <View style={[s.cell, { width: '13%' }]}><Text style={s.right}>{inr(data.item.rate)}</Text></View>
            <View style={[s.cell, { width: '8%' }]}><Text style={s.right}>9%</Text></View>
            <View style={[s.cell, { width: '11%' }]}><Text style={s.right}>{inr(a.cgst)}</Text></View>
            <View style={[s.cell, { width: '8%' }]}><Text style={s.right}>9%</Text></View>
            <View style={[s.cell, { width: '11%' }]}><Text style={s.right}>{inr(a.sgst)}</Text></View>
            <View style={[s.cellLast, { width: '13%' }]}><Text style={s.right}>{inr(a.base)}</Text></View>
          </View>

          {/* Words + totals */}
          <View style={s.bottomRow}>
            <View style={s.wordsCol}>
              <Text style={{ fontSize: 8.5, color: '#475569' }}>Total In Words</Text>
              <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-BoldOblique', color: '#0f172a', marginTop: 3 }}>
                {rupeesInWords(a.total)}
              </Text>
              <Text style={{ fontSize: 8.5, color: '#475569', marginTop: 12 }}>Notes</Text>
              {data.notes.map((n) => (
                <Text key={n} style={s.noteText}>{n}</Text>
              ))}
              {data.qrDataUrl ? (
                <View style={s.qrRow}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image style={s.qrImg} src={data.qrDataUrl} />
                  <Text style={s.qrText}>Scan the QR code to view the invoice and payment details online.</Text>
                </View>
              ) : null}
            </View>
            <View style={s.totalsCol}>
              <View style={s.totalLine}><Text style={s.totalKey}>Sub Total</Text><Text style={s.totalVal}>{inr(a.base)}</Text></View>
              <View style={s.totalLine}><Text style={s.totalKey}>CGST9 (9%)</Text><Text style={s.totalVal}>{inr(a.cgst)}</Text></View>
              <View style={s.totalLine}><Text style={s.totalKey}>SGST9 (9%)</Text><Text style={s.totalVal}>{inr(a.sgst)}</Text></View>
              <View style={[s.totalLine, s.grand]}>
                <Text style={[s.totalVal, { fontSize: 10 }]}>Total</Text>
                <Text style={[s.totalVal, { fontSize: 10 }]}>Rs.{inr(a.total)}</Text>
              </View>
              {a.paid > 0 ? (
                <View style={s.totalLine}>
                  <Text style={s.totalKey}>Payment Made</Text>
                  <Text style={[s.totalVal, s.paidRed]}>(-) {inr(a.paid)}</Text>
                </View>
              ) : null}
              <View style={s.totalLine}>
                <Text style={s.balanceDue}>Balance Due</Text>
                <Text style={s.balanceDue}>Rs.{inr(balance)}</Text>
              </View>
              <View style={s.signBlock}>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0f172a' }}>{data.seller.name}</Text>
                {(data.seller.signatoryImageUrl || data.seller.stampImageUrl) ? (
                  <View style={s.signImages}>
                    {data.seller.signatoryImageUrl ? (
                      // eslint-disable-next-line jsx-a11y/alt-text
                      <Image style={s.signImg} src={data.seller.signatoryImageUrl} />
                    ) : null}
                    {data.seller.stampImageUrl ? (
                      // eslint-disable-next-line jsx-a11y/alt-text
                      <Image style={s.stampImg} src={data.seller.stampImageUrl} />
                    ) : null}
                  </View>
                ) : null}
                <Text style={s.signLine}>
                  {data.seller.signatoryName ? `${data.seller.signatoryName} — ` : ''}Authorized Signatory
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export async function renderSubscriptionInvoicePdf(data: SubscriptionInvoiceData): Promise<Buffer> {
  // toBuffer() actually resolves to a Node readable stream — collect it into
  // a real Buffer so callers can write/send it directly.
  const stream = (await pdf(<SubscriptionInvoicePDF data={data} />).toBuffer()) as unknown as NodeJS.ReadableStream
  const chunks: Buffer[] = []
  for await (const chunk of stream as AsyncIterable<Buffer | string>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}
