import { NextRequest, NextResponse } from 'next/server'
import { route } from '@/lib/api/compose'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import React from 'react'

// Define elements from @react-pdf/renderer
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    color: '#334155',
    fontFamily: 'Helvetica'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 20,
    marginBottom: 20
  },
  titleContainer: {
    flexDirection: 'column'
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4
  },
  schoolName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  schoolAddress: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'right'
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30
  },
  metaCol: {
    flexDirection: 'column',
    width: '45%'
  },
  metaTitle: {
    fontSize: 9,
    textTransform: 'uppercase',
    color: '#94a3b8',
    fontWeight: 'bold',
    marginBottom: 4
  },
  metaValue: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 1.4
  },
  boldValue: {
    fontWeight: 'bold',
    color: '#0f172a'
  },
  table: {
    flexDirection: 'column',
    marginTop: 10,
    marginBottom: 20
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 6,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingTop: 8,
    paddingBottom: 8
  },
  colDescription: {
    width: '60%'
  },
  colQty: {
    width: '15%',
    textAlign: 'center'
  },
  colAmount: {
    width: '25%',
    textAlign: 'right'
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1'
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    marginRight: 20
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
    width: 100,
    textAlign: 'right'
  },
  paidStamp: {
    position: 'absolute',
    top: 150,
    right: 40,
    borderWidth: 3,
    borderColor: '#22c55e',
    color: '#22c55e',
    fontSize: 20,
    fontWeight: 'bold',
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 6,
    transform: 'rotate(-15deg)',
    opacity: 0.75
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 8
  }
})

interface InvoicePDFProps {
  invoice: any
  organization: any
}

const InvoicePDFDocument = ({ invoice, organization }: InvoicePDFProps) => {
  const formattedDueDate = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : '-'
  const formattedInvoiceDate = invoice.createdAt
    ? new Date(invoice.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : '-'

  const outstanding = Number(invoice.totalAmount) - Number(invoice.paidAmount)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* PAID stamp */}
        {invoice.status === 'PAID' && (
          <View style={styles.paidStamp}>
            <Text>PAID</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.logoText}>Vidhyaan</Text>
            <Text style={styles.schoolName}>{organization.name}</Text>
            <Text style={styles.schoolAddress}>
              {organization.address || 'Standard School Address, India'}
            </Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={[styles.metaValue, { textAlign: 'right', marginTop: 4 }]}>
              {invoice.invoiceNumber}
            </Text>
          </View>
        </View>

        {/* Metadata section */}
        <View style={styles.metaContainer}>
          <View style={styles.metaCol}>
            <Text style={styles.metaTitle}>Bill To</Text>
            <Text style={[styles.metaValue, styles.boldValue]}>
              {invoice.student.name}
            </Text>
            <Text style={styles.metaValue}>
              Class: {invoice.student.gradeLabel || '-'}
            </Text>
            <Text style={styles.metaValue}>
              Student ID: {invoice.student.studentCode}
            </Text>
            <Text style={styles.metaValue}>
              Guardian: {invoice.student.guardianName || '-'}
            </Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaTitle}>Invoice Details</Text>
            <Text style={styles.metaValue}>
              Date: {formattedInvoiceDate}
            </Text>
            <Text style={styles.metaValue}>
              Due Date: {formattedDueDate}
            </Text>
            <Text style={styles.metaValue}>
              Status: {invoice.status}
            </Text>
            {outstanding > 0 && (
              <Text style={[styles.metaValue, { color: '#b91c1c', fontWeight: 'bold' }]}>
                Balance Due: ₹{outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            )}
          </View>
        </View>

        {/* Itemized Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>Fee Component</Text>
            <Text style={styles.colQty}>Quantity</Text>
            <Text style={styles.colAmount}>Amount</Text>
          </View>

          {/* If there are items, map them, otherwise display notes/description as single item */}
          {invoice.items && invoice.items.length > 0 ? (
            invoice.items.map((item: any, idx: number) => (
              <View key={item.id || idx} style={styles.tableRow}>
                <Text style={styles.colDescription}>{item.head}</Text>
                <Text style={styles.colQty}>{item.quantity || 1}</Text>
                <Text style={styles.colAmount}>
                  ₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <Text style={styles.colDescription}>{invoice.notes || 'School Academic Term Fees'}</Text>
              <Text style={styles.colQty}>1</Text>
              <Text style={styles.colAmount}>
                ₹{Number(invoice.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          )}
        </View>

        {/* Total details */}
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total Invoiced:</Text>
          <Text style={styles.totalValue}>
            ₹{Number(invoice.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={[styles.totalSection, { borderTopWidth: 0, paddingTop: 4 }]}>
          <Text style={styles.totalLabel}>Total Paid:</Text>
          <Text style={styles.totalValue}>
            ₹{Number(invoice.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={[styles.totalSection, { borderTopWidth: 0, paddingTop: 4 }]}>
          <Text style={styles.totalLabel}>Balance Due:</Text>
          <Text style={[styles.totalValue, { color: outstanding > 0 ? '#b91c1c' : '#334155' }]}>
            ₹{outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This is a computer generated invoice. No signature required. For queries, contact {organization.name}.
        </Text>
      </Page>
    </Document>
  )
}

export const GET = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.ACCOUNTANT
  ],
  handler: async ({ db, user, params }) => {
    const invoice = await db.invoice.findFirst({
      where: {
        id: params?.id,
        orgId: user.orgId
      },
      include: {
        student: true,
        items: true
      }
    })

    if (!invoice) {
      throw Errors.notFound('Invoice')
    }

    const org = await db.organization.findFirst({
      where: { id: user.orgId }
    })

    if (!org) {
      throw Errors.notFound('Organization')
    }

    // Generate PDF stream using @react-pdf/renderer
    const pdfStream = await pdf(
      <InvoicePDFDocument
        invoice={invoice}
        organization={org}
      />
    ).toBuffer()

    return new NextResponse(pdfStream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`
      }
    })
  }
})
