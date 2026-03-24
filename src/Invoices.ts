import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Order } from './types';

export const generateInvoice = (order: Order) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(22);
  doc.text('WassalStore (وصّل)', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Order ID: ${order.id}`, 20, 40);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 20, 48);
  doc.text(`Status: ${order.status.toUpperCase()}`, 20, 56);

  // Customer Info
  doc.setFontSize(14);
  doc.text('Customer Details:', 20, 70);
  doc.setFontSize(10);
  doc.text(`Name: ${order.customerName}`, 20, 78);
  doc.text(`Phone: ${order.phone}`, 20, 84);
  doc.text(`Address: ${order.address}, ${order.city || ''}, ${order.state}`, 20, 90);
  doc.text(`Payment Method: ${order.paymentMethod.toUpperCase()}`, 20, 96);

  // Table
  const tableData = order.items.map(item => [
    item.product.name,
    `${item.selectedSize || '-'} / ${item.selectedColor || '-'}`,
    item.quantity.toString(),
    `${item.product.price} SDG`,
    `${item.product.price * item.quantity} SDG`
  ]);

  (doc as any).autoTable({
    startY: 110,
    head: [['Product', 'Size/Color', 'Qty', 'Price', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [0, 51, 102] }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 150;

  // Totals
  doc.text(`Subtotal: ${order.subtotal} SDG`, 140, finalY + 10);
  doc.text(`Shipping: ${order.shippingCost} SDG`, 140, finalY + 18);
  doc.setFontSize(14);
  doc.text(`Total: ${order.total} SDG`, 140, finalY + 28);

  // Footer
  doc.setFontSize(10);
  doc.text('Thank you for shopping with WassalStore!', 105, finalY + 50, { align: 'center' });

  doc.save(`Invoice_${order.id}.pdf`);
};
