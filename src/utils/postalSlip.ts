import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PostalSlipData {
  orderNumber: string;
  deliveryAddress: any;
}

export interface PostalOrderSlipData {
  id?: string;
  orderNumber: string;
  deliveryAddress: any;
  items?: Array<{
    productName?: string;
    quantity?: number;
    language?: string;
  }>;
  trackingNumber?: string | null;
}

export function formatItemSummary(items?: any[]): string {
  if (!items || items.length === 0) return 'POSTAL PARCEL';
  return items
    .map((item) => {
      let name = (item.productName || 'BOOK').trim();
      name = name.replace(/\s*\/\s*/g, '/').replace(/\s*\+\s*/g, '+');
      const qty = item.quantity || 1;
      let lang = (item.language || '').toUpperCase();
      if (lang === 'TE' || lang === 'TELUGU') lang = 'TE';
      else if (lang === 'EN' || lang === 'ENGLISH' || lang === 'EM') lang = 'EM';
      const langStr = lang ? ` (${lang})` : '';
      return `${name} * ${qty}${langStr}`;
    })
    .join(', ');
}

export function formatTrackingNumber(trackingNumber?: string | null): { text: string; hasTracking: boolean } {
  const clean = (trackingNumber || '').trim();
  if (clean) {
    return { text: clean, hasTracking: true };
  }
  return { text: 'NO TRACKING ID', hasTracking: false };
}

export function normalizePostalAddress(raw: any) {
  let addr = raw;
  while (typeof addr === 'string') {
    try {
      addr = JSON.parse(addr);
    } catch {
      break;
    }
  }
  addr = addr && typeof addr === 'object' ? addr : {};
  return {
    fullName: addr.fullName || addr.full_name || addr.name || '',
    houseOrFlat: addr.houseOrFlat || addr.house_or_flat || addr.doorNo || addr.flat || '',
    street: addr.street || addr.addressLine1 || addr.line1 || '',
    area: addr.area || addr.landmark || addr.addressLine2 || addr.line2 || '',
    city: addr.city || addr.town || addr.district || '',
    state: addr.state || '',
    pinCode: addr.pinCode || addr.pin_code || addr.pincode || addr.postalCode || '',
    mobile: addr.mobile || addr.phone || addr.mobile_number || addr.contact || '',
  };
}

export async function downloadPostalSlipPDF(data: PostalSlipData, elementId?: string) {
  const { orderNumber } = data;
  const addr = normalizePostalAddress(data.deliveryAddress);

  try {
    // Attempt high-res html2canvas capture if element exists
    if (elementId && typeof window !== 'undefined') {
      const el = document.getElementById(elementId);
      if (el) {
        const canvas = await html2canvas(el, {
          scale: 3,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: [190, 95],
        });

        pdf.addImage(imgData, 'JPEG', 0, 0, 190, 95);
        pdf.save(`Postal_Slip_${orderNumber}.pdf`);
        return;
      }
    }

    // Fallback Vector jsPDF generation
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [190, 95],
    });

    // White background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, 190, 95, 'F');

    // Outer border
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.8);
    pdf.rect(4, 4, 182, 87);

    // Header line
    pdf.setLineWidth(0.5);
    pdf.line(4, 24, 186, 24);

    // Header Content
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(185, 28, 28);
    pdf.text('INDIA POST PARCEL (CONTRACTUAL)', 7, 10);

    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.text('CONTRACT NO. 41120154 - TENALI EXAMS PUBLISHERS', 7, 15);
    pdf.setFontSize(10);
    pdf.text(`CUSTOMER ID: ${orderNumber}`, 7, 20);

    // Postage Prepaid Stamp Box
    pdf.setDrawColor(185, 28, 28);
    pdf.setLineWidth(0.4);
    pdf.setFillColor(254, 242, 242);
    pdf.rect(142, 6, 40, 15, 'FD');
    pdf.setFontSize(8);
    pdf.setTextColor(185, 28, 28);
    pdf.text('POSTAGE PREPAID', 162, 10, { align: 'center' });
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.text('CONTRACT PARCEL', 162, 14, { align: 'center' });
    pdf.setFontSize(7);
    pdf.setTextColor(185, 28, 28);
    pdf.text('INDIA POST BNPL', 162, 18, { align: 'center' });

    // Destination PIN Box (on Left)
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.6);
    pdf.setFillColor(254, 243, 199);
    pdf.rect(7, 28, 40, 22, 'FD');

    pdf.setFontSize(8);
    pdf.setTextColor(50, 50, 50);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DESTINATION PIN', 27, 33, { align: 'center' });

    pdf.setLineWidth(0.3);
    pdf.line(9, 35, 45, 35);

    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('courier', 'bold');
    pdf.text(addr.pinCode || '', 27, 44, { align: 'center' });

    // TO Section (on Right)
    pdf.setDrawColor(0, 0, 0);
    pdf.setFillColor(0, 0, 0);
    pdf.rect(54, 28, 12, 6, 'F');
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.text('TO:', 60, 32.5, { align: 'center' });

    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text((addr.fullName || '').toUpperCase(), 69, 33);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    let y = 39;
    pdf.text(`${addr.houseOrFlat || ''}, ${addr.street || ''}`, 69, y);
    y += 5;

    if (addr.area) {
      pdf.text(addr.area, 69, y);
      y += 5;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.text(`${addr.city || ''}, ${addr.state || ''}`, 69, y);
    y += 6;

    pdf.setFontSize(10);
    pdf.text(`CELL: ${addr.mobile || ''}`, 69, y);

    // Footer Line
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(0, 0, 0);
    pdf.line(4, 68, 186, 68);

    // FROM Section
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(80, 80, 80);
    pdf.text('FROM (SENDER / RETURN IF UNDELIVERED):', 7, 72);

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text('TENALI EXAMS PUBLISHERS', 7, 77);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.text('D.NO. 19-308, NAMBURU - 522508, GUNTUR DIST, ANDHRA PRADESH', 7, 82);

    pdf.setFont('helvetica', 'bold');
    pdf.text('CELL: +91 7396977544', 7, 86.5);

    // Origin PIN Box
    pdf.setFontSize(8);
    pdf.text('ORIGIN PIN: 522508', 182, 86.5, { align: 'right' });

    pdf.save(`Postal_Slip_${orderNumber}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

export function printPostalSlipWindow(data: PostalSlipData) {
  const { orderNumber } = data;
  const addr = normalizePostalAddress(data.deliveryAddress);
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Postal Slip - ${orderNumber}</title>
        <style>
          @page {
            size: 190mm 95mm;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            width: 190mm;
            height: 95mm;
            padding: 5mm;
            background: #ffffff;
            color: #000000;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            -webkit-print-color-adjust: exact;
          }
          .label-container {
            width: 180mm;
            height: 85mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            border: 2px solid #000000;
            padding: 4mm 6mm;
            position: relative;
          }
          .header {
            border-bottom: 2px solid #000000;
            padding-bottom: 2mm;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .brand-title {
            background: #b91c1c;
            color: #ffffff;
            font-size: 10px;
            font-weight: 900;
            padding: 1px 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: inline-block;
          }
          .contract-info {
            font-size: 9px;
            font-weight: 700;
            margin-top: 2px;
          }
          .customer-id {
            font-size: 11px;
            font-weight: 900;
            font-family: monospace;
            margin-top: 2px;
          }
          .stamp-box {
            border: 2px dashed #b91c1c;
            background: #fef2f2;
            padding: 4px 8px;
            text-align: center;
            min-width: 110px;
          }
          .stamp-title {
            font-size: 8px;
            font-weight: 900;
            color: #b91c1c;
          }
          .stamp-sub {
            font-size: 9px;
            font-weight: 800;
          }
          .stamp-bnpl {
            font-size: 7.5px;
            font-weight: 700;
            color: #dc2626;
          }
          .to-body {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin: 2mm 0;
          }
          .to-badge {
            background: #000000;
            color: #ffffff;
            font-size: 11px;
            font-weight: 900;
            padding: 1px 6px;
            display: inline-block;
            margin-right: 6px;
          }
          .to-name {
            font-size: 14px;
            font-weight: 900;
            text-transform: uppercase;
            display: inline-block;
          }
          .address-lines {
            margin-left: 28px;
            font-size: 11px;
            font-weight: 600;
            line-height: 1.35;
            margin-top: 2px;
          }
          .phone-chip {
            background: #000000;
            color: #ffffff;
            font-family: monospace;
            font-size: 11px;
            font-weight: 700;
            padding: 1px 6px;
            display: inline-block;
            margin-top: 4px;
          }
          .pin-box {
            border: 2px solid #000000;
            background: #fffbeb;
            padding: 6px 12px;
            text-align: center;
            min-width: 120px;
          }
          .pin-title {
            font-size: 8px;
            font-weight: 900;
            color: #374151;
            letter-spacing: 0.5px;
          }
          .pin-number {
            font-size: 18px;
            font-weight: 900;
            font-family: monospace;
            border-top: 1px solid rgba(0,0,0,0.2);
            padding-top: 2px;
            margin-top: 2px;
          }
          .from-footer {
            border-top: 2px solid #000000;
            padding-top: 2mm;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .from-title {
            font-size: 8.5px;
            font-weight: 900;
            color: #374151;
          }
          .from-name {
            font-size: 10.5px;
            font-weight: 900;
          }
          .from-address {
            font-size: 9px;
            font-weight: 500;
          }
          .from-cell {
            font-size: 9.5px;
            font-weight: 700;
            font-family: monospace;
          }
          .origin-pin {
            border: 1px solid #000000;
            font-family: monospace;
            font-size: 9px;
            font-weight: 700;
            padding: 2px 6px;
            background: #f3f4f6;
          }
          @media print {
            body {
              width: 190mm;
              height: 95mm;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <div class="header">
            <div>
              <span class="brand-title">INDIA POST PARCEL</span>
              <span style="font-size: 9px; font-weight: 700; margin-left: 4px;">(CONTRACTUAL)</span>
              <div class="contract-info">CONTRACT NO. 41120154 - TENALI EXAMS PUBLISHERS</div>
              <div class="customer-id">CUSTOMER ID: ${orderNumber}</div>
            </div>
            <div class="stamp-box">
              <div class="stamp-title">POSTAGE PREPAID</div>
              <div class="stamp-sub">CONTRACT PARCEL</div>
              <div class="stamp-bnpl">INDIA POST BNPL</div>
            </div>
          </div>

          <div class="to-body">
            <div class="pin-box">
              <div class="pin-title">DESTINATION PIN</div>
              <div class="pin-number">${addr.pinCode || '------'}</div>
            </div>

            <div style="flex: 1; padding-left: 24px;">
              <div>
                <span class="to-badge">TO:</span>
                <span class="to-name">${addr.fullName || 'CUSTOMER'}</span>
              </div>
              <div class="address-lines">
                <div>${[addr.houseOrFlat, addr.street].filter(Boolean).join(', ')}</div>
                ${addr.area ? `<div>${addr.area}</div>` : ''}
                <div style="font-weight: 800;">${[addr.city, addr.state].filter(Boolean).join(', ')}</div>
                ${addr.mobile ? `<div><span class="phone-chip">CELL: ${addr.mobile}</span></div>` : ''}
              </div>
            </div>
          </div>

          <div class="from-footer">
            <div>
              <div class="from-title">FROM (SENDER / RETURN IF UNDELIVERED):</div>
              <div class="from-name">TENALI EXAMS PUBLISHERS</div>
              <div class="from-address">D.NO. 19-308, NAMBURU - 522508, GUNTUR DIST, ANDHRA PRADESH</div>
              <div class="from-cell">CELL: +91 7396977544</div>
            </div>
            <div>
              <div class="origin-pin">ORIGIN PIN: 522508</div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * Arranges multiple orders into 3-up A4 Portrait pages and opens print preview
 */
export function print3UpPostalSlips(orders: PostalOrderSlipData[]) {
  if (!orders || orders.length === 0) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  // Group orders into chunks of 3 for each A4 page
  const pages: PostalOrderSlipData[][] = [];
  for (let i = 0; i < orders.length; i += 3) {
    pages.push(orders.slice(i, i + 3));
  }

  const pagesHtml = pages
    .map((pageOrders) => {
      const slipsHtml = pageOrders
        .map((order) => {
          const addr = normalizePostalAddress(order.deliveryAddress);
          const itemSummary = formatItemSummary(order.items);
          const { text: trackingText, hasTracking } = formatTrackingNumber(order.trackingNumber);
          const addrLine1 = [addr.houseOrFlat, addr.street].filter(Boolean).join(', ');
          const addrLine2 = addr.area || '';
          const cityState = [addr.city, addr.state].filter(Boolean).join(', ');

          return `
            <div class="postal-slip">
              <div class="header">
                <div>
                  <div class="brand-title">INDIA POST PARCEL (CONTRACTUAL)</div>
                  <div class="contract-info">CONTRACT NO. 41120154 - TENALI EXAMS PUBLISHERS</div>
                  <div class="customer-id">CUSTOMER ID: ${order.orderNumber}</div>
                </div>
                <div class="stamp-box">
                  <div class="stamp-title">POSTAGE PREPAID</div>
                  <div class="stamp-sub">CONTRACT PARCEL</div>
                  <div class="stamp-bnpl">INDIA POST BNPL</div>
                </div>
              </div>

              <div class="middle-body">
                <div class="left-col">
                  <div class="pin-box">
                    <div class="pin-title">DESTINATION PIN</div>
                    <div class="pin-number">${addr.pinCode || '------'}</div>
                  </div>
                  <div class="item-tracking-box">
                    <div class="item-summary">${itemSummary}</div>
                    <div class="tracking-num ${hasTracking ? '' : 'no-tracking'}">${trackingText}</div>
                  </div>
                </div>

                <div class="to-box">
                  <div class="to-header">TO:</div>
                  <div class="to-name">${(addr.fullName || 'CUSTOMER').toUpperCase()}</div>
                  <div class="address-lines">
                    <div>${addrLine1}</div>
                    ${addrLine2 ? `<div>${addrLine2}</div>` : ''}
                    <div>${cityState}</div>
                    <div class="phone-line">CELL: ${addr.mobile || 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div class="from-footer">
                <div>
                  <div class="from-title">FROM (SENDER / RETURN IF UNDELIVERED):</div>
                  <div class="from-name">TENALI EXAMS PUBLISHERS</div>
                  <div class="from-address">D.NO. 19-308, NAMBURU - 522508, GUNTUR DIST, ANDHRA PRADESH</div>
                  <div class="from-cell">CELL: +91 7396977544</div>
                </div>
                <div>
                  <div class="origin-pin">ORIGIN PIN: 522508</div>
                </div>
              </div>
            </div>
          `;
        })
        .join('');

      return `<div class="a4-page">${slipsHtml}</div>`;
    })
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Postal Slips - A4 3-Up (${orders.length} Slips)</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 6mm 7mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #000000;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .a4-page {
            width: 196mm;
            height: 284mm;
            page-break-after: always;
            break-after: page;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            gap: 4.5mm;
            margin: 0 auto;
          }
          .a4-page:last-child {
            page-break-after: avoid;
            break-after: avoid;
          }
          .postal-slip {
            width: 100%;
            height: 90mm;
            border: 2px solid #000000;
            padding: 3mm 4mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            background: #ffffff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #000000;
            padding-bottom: 2mm;
          }
          .brand-title {
            font-size: 11pt;
            font-weight: 900;
            letter-spacing: 0.2px;
          }
          .contract-info {
            font-size: 7.5pt;
            font-weight: 700;
            margin-top: 1.5px;
          }
          .customer-id {
            font-size: 8.5pt;
            font-weight: 800;
            margin-top: 1px;
          }
          .stamp-box {
            border: 1.5px solid #000000;
            padding: 2px 8px;
            text-align: center;
            min-width: 40mm;
          }
          .stamp-title {
            font-size: 7.5pt;
            font-weight: 900;
            line-height: 1.25;
          }
          .stamp-sub {
            font-size: 7.5pt;
            font-weight: 900;
            line-height: 1.25;
          }
          .stamp-bnpl {
            font-size: 7.5pt;
            font-weight: 900;
            line-height: 1.25;
          }
          .middle-body {
            display: flex;
            gap: 4mm;
            align-items: stretch;
            margin: 2mm 0;
            flex: 1;
          }
          .left-col {
            width: 46mm;
            display: flex;
            flex-direction: column;
            gap: 2mm;
          }
          .pin-box {
            border: 2px solid #000000;
            text-align: center;
            padding: 1.5mm 2mm;
          }
          .pin-title {
            font-size: 7.5pt;
            font-weight: 900;
          }
          .pin-number {
            font-size: 19pt;
            font-weight: 900;
            letter-spacing: 1.5px;
            line-height: 1.1;
            border-top: 1.5px solid #000000;
            margin-top: 1.5px;
            padding-top: 1px;
          }
          .item-tracking-box {
            border: 2px solid #000000;
            padding: 2mm;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 1.5mm;
          }
          .item-summary {
            font-size: 8pt;
            font-weight: 800;
            line-height: 1.25;
          }
          .tracking-num {
            font-size: 8.5pt;
            font-weight: 900;
            font-family: monospace;
            letter-spacing: 0.5px;
          }
          .tracking-num.no-tracking {
            font-size: 7.5pt;
            color: #444444;
            font-style: italic;
          }
          .to-box {
            flex: 1;
            border: 2px solid #000000;
            padding: 2.5mm 4mm;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
          }
          .to-header {
            font-size: 8.5pt;
            font-weight: 900;
          }
          .to-name {
            font-size: 11pt;
            font-weight: 900;
            margin-top: 0.5mm;
            line-height: 1.2;
          }
          .address-lines {
            font-size: 8.5pt;
            font-weight: 600;
            margin-top: 1mm;
            line-height: 1.35;
          }
          .phone-line {
            font-weight: 800;
            margin-top: 1.5mm;
            font-size: 9pt;
          }
          .from-footer {
            border-top: 2px solid #000000;
            padding-top: 1.5mm;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .from-title {
            font-size: 7pt;
            font-weight: 800;
            color: #333333;
          }
          .from-name {
            font-size: 8.5pt;
            font-weight: 900;
          }
          .from-address {
            font-size: 7.5pt;
            font-weight: 600;
          }
          .from-cell {
            font-size: 8pt;
            font-weight: 800;
          }
          .origin-pin {
            border: 1.5px solid #000000;
            padding: 1.5px 6px;
            font-size: 7.5pt;
            font-weight: 900;
            white-space: nowrap;
          }
          @media screen {
            body {
              background: #f1f5f9;
              padding: 20px;
            }
            .a4-page {
              background: #ffffff;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
              margin-bottom: 20px;
              padding: 6mm 7mm;
            }
          }
        </style>
      </head>
      <body>
        ${pagesHtml}
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * Generates and downloads an A4 Portrait PDF containing 3 postal slips per page
 */
export async function download3UpPostalSlipsPDF(orders: PostalOrderSlipData[]) {
  if (!orders || orders.length === 0) return;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  orders.forEach((order, index) => {
    const slot = index % 3;
    if (index > 0 && slot === 0) {
      pdf.addPage('a4', 'portrait');
    }

    const addr = normalizePostalAddress(order.deliveryAddress);
    const itemSummary = formatItemSummary(order.items);
    const { text: trackingText } = formatTrackingNumber(order.trackingNumber);
    const addrLine1 = [addr.houseOrFlat, addr.street].filter(Boolean).join(', ');
    const addrLine2 = addr.area || '';
    const cityState = [addr.city, addr.state].filter(Boolean).join(', ');

    // Vertical position for this slip:
    // Page height is 297mm.
    // 3 slips at 88mm each with 5.5mm gaps, starting at y = 7mm.
    // Slot 0: y = 7
    // Slot 1: y = 7 + 88 + 5.5 = 100.5
    // Slot 2: y = 100.5 + 88 + 5.5 = 194
    // Bottom of Slot 2: 194 + 88 = 282mm (leaves 15mm margin)
    const y = 7 + slot * 93.5;

    // Slip outer box: width 194mm (from x = 8 to 202)
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.4);
    pdf.rect(8, y, 194, 88);

    // Header dividing line
    pdf.setLineWidth(0.35);
    pdf.line(8, y + 17, 202, y + 17);

    // Header Content
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10.5);
    pdf.setTextColor(0, 0, 0);
    pdf.text('INDIA POST PARCEL (CONTRACTUAL)', 11, y + 5.5);

    pdf.setFontSize(7.5);
    pdf.text('CONTRACT NO. 41120154 - TENALI EXAMS PUBLISHERS', 11, y + 10);

    pdf.setFontSize(8.5);
    pdf.text(`CUSTOMER ID: ${order.orderNumber}`, 11, y + 14.5);

    // Postage Prepaid Stamp Box
    pdf.setLineWidth(0.35);
    pdf.rect(160, y + 3, 39, 12);
    pdf.setFontSize(7.5);
    pdf.text('POSTAGE PREPAID', 179.5, y + 6.2, { align: 'center' });
    pdf.text('CONTRACT PARCEL', 179.5, y + 9.5, { align: 'center' });
    pdf.text('INDIA POST BNPL', 179.5, y + 12.8, { align: 'center' });

    // Middle Left: Destination PIN Code Box
    pdf.rect(11, y + 20, 42, 17);
    pdf.setFontSize(7.5);
    pdf.text('DESTINATION PIN', 32, y + 24, { align: 'center' });
    pdf.line(11, y + 25.5, 53, y + 25.5);

    pdf.setFontSize(16);
    pdf.text(addr.pinCode || '------', 32, y + 34, { align: 'center' });

    // Middle Left: Item & Tracking ID Box
    pdf.rect(11, y + 39, 42, 26);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    const itemLines = pdf.splitTextToSize(itemSummary, 38);
    pdf.text(itemLines, 13, y + 44);

    pdf.setFont('courier', 'bold');
    pdf.setFontSize(8);
    pdf.text(trackingText, 13, y + 61);

    // Middle Right: Consignee TO: Box
    pdf.rect(56, y + 20, 143, 45);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('TO:', 59, y + 24.5);

    pdf.setFontSize(10);
    pdf.text((addr.fullName || 'CUSTOMER').toUpperCase(), 59, y + 29.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    let toY = y + 34.5;
    if (addrLine1) {
      pdf.text(addrLine1, 59, toY);
      toY += 4;
    }
    if (addrLine2) {
      pdf.text(addrLine2, 59, toY);
      toY += 4;
    }
    pdf.text(cityState, 59, toY);
    toY += 4.5;

    pdf.setFont('helvetica', 'bold');
    pdf.text(`CELL: ${addr.mobile || 'N/A'}`, 59, toY);

    // Footer dividing line
    pdf.line(8, y + 68, 202, y + 68);

    // Footer: FROM Details
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.text('FROM (SENDER / RETURN IF UNDELIVERED):', 11, y + 72);

    pdf.setFontSize(8.5);
    pdf.text('TENALI EXAMS PUBLISHERS', 11, y + 76);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.text('D.NO. 19-308, NAMBURU - 522508, GUNTUR DIST, ANDHRA PRADESH', 11, y + 80);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('CELL: +91 7396977544', 11, y + 84);

    // Origin PIN Box
    pdf.rect(167, y + 78, 32, 6.5);
    pdf.setFontSize(7.5);
    pdf.text('ORIGIN PIN: 522508', 183, y + 82.5, { align: 'center' });
  });

  pdf.save(`postal_slip_3up_A4_${new Date().toISOString().split('T')[0]}.pdf`);
}

