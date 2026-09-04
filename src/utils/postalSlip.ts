import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PostalSlipData {
  orderNumber: string;
  deliveryAddress: any;
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

    // TO Section
    pdf.setDrawColor(0, 0, 0);
    pdf.setFillColor(0, 0, 0);
    pdf.rect(7, 28, 12, 6, 'F');
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.text('TO:', 13, 32.5, { align: 'center' });

    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text((addr.fullName || '').toUpperCase(), 22, 33);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    let y = 39;
    pdf.text(`${addr.houseOrFlat || ''}, ${addr.street || ''}`, 22, y);
    y += 5;

    if (addr.area) {
      pdf.text(addr.area, 22, y);
      y += 5;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.text(`${addr.city || ''}, ${addr.state || ''}`, 22, y);
    y += 6;

    pdf.setFontSize(10);
    pdf.text(`CELL: ${addr.mobile || ''}`, 22, y);

    // Destination PIN Box
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.6);
    pdf.setFillColor(254, 243, 199);
    pdf.rect(142, 28, 40, 22, 'FD');

    pdf.setFontSize(8);
    pdf.setTextColor(50, 50, 50);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DESTINATION PIN', 162, 33, { align: 'center' });

    pdf.setLineWidth(0.3);
    pdf.line(144, 35, 180, 35);

    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('courier', 'bold');
    pdf.text(addr.pinCode || '', 162, 44, { align: 'center' });

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
            <div>
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

            <div class="pin-box">
              <div class="pin-title">DESTINATION PIN</div>
              <div class="pin-number">${addr.pinCode || '------'}</div>
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
