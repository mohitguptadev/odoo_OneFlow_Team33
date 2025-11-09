// Lightweight invoice PDF generator using jsPDF + autoTable
// Exports a styled invoice with header, bill-to, dates, line items summary and totals

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Optional: brand colors
const brand = {
  primary: [59, 130, 246], // blue-500
  accent: [147, 51, 234],  // purple-600
  text: [17, 24, 39],      // gray-900
  subtext: [107, 114, 128] // gray-500
};

function drawHeader(doc, title = 'INVOICE') {
  const w = doc.internal.pageSize.getWidth();
  // Gradient-like header with two colored bars
  doc.setFillColor(brand.primary[0], brand.primary[1], brand.primary[2]);
  doc.rect(0, 0, w, 12, 'F');
  doc.setFillColor(brand.accent[0], brand.accent[1], brand.accent[2]);
  doc.rect(0, 12, w, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(title, 14, 10);
}

function sectionLabel(doc, label, x, y) {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(brand.subtext[0], brand.subtext[1], brand.subtext[2]);
  doc.text(label.toUpperCase(), x, y);
}

function sectionValue(doc, value, x, y) {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(brand.text[0], brand.text[1], brand.text[2]);
  const text = value == null || value === '' ? '-' : String(value);
  doc.text(text, x, y);
}

function money(n) {
  if (n == null || isNaN(Number(n))) return '-';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(n));
}

export function downloadInvoicePdf(invoice, options = {}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  drawHeader(doc);

  const safe = (v, fallback = '-') => (v == null || v === '' ? fallback : v);

  // Top meta (right)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(brand.text[0], brand.text[1], brand.text[2]);
  doc.text(`Invoice # ${safe(invoice.invoice_number)}`, 420, 40);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(brand.subtext[0], brand.subtext[1], brand.subtext[2]);
  doc.text(`Status: ${safe(invoice.status)}`, 420, 58);

  // Bill To + Dates
  sectionLabel(doc, 'Bill To', 14, 60);
  sectionValue(doc, safe(invoice.customer_name, 'Customer'), 14, 78);

  sectionLabel(doc, 'Invoice Date', 220, 60);
  sectionValue(doc, safe(invoice.invoice_date), 220, 78);

  sectionLabel(doc, 'Due Date', 320, 60);
  sectionValue(doc, safe(invoice.due_date), 320, 78);

  if (invoice.project_name) {
    sectionLabel(doc, 'Project', 14, 100);
    sectionValue(doc, invoice.project_name, 14, 118);
  }

  // Items table (single-line summary when we do not have detailed items)
  const items = options.items && options.items.length ? options.items : [
    { description: 'Professional services', qty: 1, rate: Number(invoice.total_amount) || 0, amount: Number(invoice.total_amount) || 0 }
  ];

  const body = items.map(it => [
    it.description || '-',
    it.qty ?? '-',
    money(it.rate),
    money(it.amount)
  ]);

  autoTable(doc, {
    head: [['Description', 'Qty', 'Rate', 'Amount']],
    body,
    startY: 140,
    styles: { font: 'helvetica', fontSize: 10, textColor: brand.text },
    headStyles: { fillColor: brand.primary, textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
    theme: 'striped',
  });

  // Totals box
  const finalY = (doc.lastAutoTable?.finalY || 140) + 14;
  doc.setDrawColor(230);
  doc.setFillColor(248, 250, 252); // gray-50
  doc.roundedRect(340, finalY, 220, 88, 6, 6, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(brand.subtext[0], brand.subtext[1], brand.subtext[2]);
  doc.text('Subtotal', 352, finalY + 20);
  doc.text('Tax', 352, finalY + 40);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(brand.text[0], brand.text[1], brand.text[2]);
  doc.text('Total', 352, finalY + 68);

  const subtotal = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const tax = 0; // Adjust if you have tax logic
  const total = subtotal + tax;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(brand.text[0], brand.text[1], brand.text[2]);
  doc.text(money(subtotal), 540, finalY + 20, { align: 'right' });
  doc.text(money(tax), 540, finalY + 40, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(money(total), 540, finalY + 68, { align: 'right' });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text('Thank you for your business!', 14, 800);

  const filename = `Invoice_${safe(invoice.invoice_number, invoice.id || 'draft')}.pdf`;
  doc.save(filename);
}
