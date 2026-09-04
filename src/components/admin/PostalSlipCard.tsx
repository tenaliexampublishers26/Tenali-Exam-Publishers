'use client';
import { useState } from 'react';
import { Download, Printer, Copy, Check, FileText, Loader2, Phone } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { downloadPostalSlipPDF, printPostalSlipWindow } from '@/utils/postalSlip';

interface PostalSlipCardProps {
  orderNumber: string;
  deliveryAddress: any;
}

// SVG Barcode Generator for Order / Customer ID
function BarcodeSVG({ code }: { code: string }) {
  const bars = [];
  let x = 0;
  bars.push({ x, width: 2 }); x += 3;
  bars.push({ x, width: 1 }); x += 2;
  
  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    const w1 = (charCode % 3) + 1;
    const w2 = ((charCode * 7) % 3) + 1;
    const w3 = ((charCode * 13) % 3) + 1;
    
    bars.push({ x, width: w1 }); x += w1 + 1;
    bars.push({ x, width: w2 }); x += w2 + 2;
    bars.push({ x, width: w3 }); x += w3 + 1;
  }
  
  bars.push({ x, width: 2 }); x += 3;
  bars.push({ x, width: 2 }); x += 2;

  const totalWidth = x;

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${totalWidth} 40`}
        className="w-40 h-8 fill-current text-black"
        preserveAspectRatio="none"
      >
        {bars.map((bar, idx) => (
          <rect key={idx} x={bar.x} y={0} width={bar.width} height={40} />
        ))}
      </svg>
      <span className="font-mono text-[9px] font-bold tracking-widest text-slate-800 uppercase mt-0.5">
        *{code}*
      </span>
    </div>
  );
}

export default function PostalSlipCard({ orderNumber, deliveryAddress: rawAddr }: PostalSlipCardProps) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Safely parse JSON if deliveryAddress is passed as string
  let parsed: any = rawAddr;
  while (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      break;
    }
  }
  parsed = parsed && typeof parsed === 'object' ? parsed : {};

  const addr = {
    fullName: parsed.fullName || parsed.full_name || parsed.name || '',
    houseOrFlat: parsed.houseOrFlat || parsed.house_or_flat || parsed.doorNo || parsed.flat || '',
    street: parsed.street || parsed.addressLine1 || parsed.line1 || '',
    area: parsed.area || parsed.landmark || parsed.addressLine2 || parsed.line2 || '',
    city: parsed.city || parsed.town || parsed.district || '',
    state: parsed.state || '',
    pinCode: parsed.pinCode || parsed.pin_code || parsed.pincode || parsed.postalCode || '',
    mobile: parsed.mobile || parsed.phone || parsed.mobile_number || parsed.contact || '',
  };

  const containerId = `postal-slip-preview-${orderNumber.replace(/[^a-zA-Z0-9-]/g, '_')}`;

  const handleCopyText = () => {
    const addressLine1 = [addr.houseOrFlat, addr.street].filter(Boolean).join(', ');
    const addressLine2 = addr.area || '';
    const cityStatePin = [
      [addr.city, addr.state].filter(Boolean).join(', '),
      addr.pinCode ? `- ${addr.pinCode}` : '',
    ].filter(Boolean).join(' ');

    const fullToAddress = [
      addr.fullName,
      addressLine1,
      addressLine2,
      cityStatePin,
      addr.mobile ? `CELL: ${addr.mobile}` : '',
    ].filter(Boolean).join('\n');

    const text = `BY INDIA POST PARCEL (CONTRACTUAL)\nCONTRACT NO. 41120154 - TENALI EXAMS PUBLISHERS\nCUSTOMER ID: ${orderNumber}\n\nTo:\n${fullToAddress}\n\nFrom:\nTENALI EXAMS PUBLISHERS\nD.NO. 19-308\nNAMBURU-522508\nGUNTUR-DIST, ANDHRA PRADESH\nCELL: 7396977544`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Postal Slip format copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await downloadPostalSlipPDF({ orderNumber, deliveryAddress: addr }, containerId);
      toast.success('PDF downloaded (19cm × 9.5cm)');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    printPostalSlipWindow({ orderNumber, deliveryAddress: addr });
  };

  return (
    <div className="space-y-3">
      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
            <FileText size={16} />
          </div>
          <div>
            <div className="text-white font-bold text-xs flex items-center gap-1.5">
              Postal Shipping Label
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono border border-amber-400/30">
                19cm × 9.5cm
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-normal">Official India Post Contractual Format</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyText}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            {copied ? (
              <><Check size={14} className="text-emerald-400" strokeWidth={3} /> Copied</>
            ) : (
              <><Copy size={14} /> Copy Text</>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isGeneratingPDF ? (
              <><Loader2 size={14} className="animate-spin" /> Generating...</>
            ) : (
              <><Download size={14} /> Download PDF</>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Printer size={14} /> Print Label
          </button>
        </div>
      </div>

      {/* Production-Level Postal Card Container Preview */}
      <div className="w-full p-3 bg-slate-100 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-center overflow-x-auto">
        <div
          id={containerId}
          className="w-[190mm] h-[95mm] min-w-[190mm] bg-white text-slate-900 font-sans p-4 shadow-xl border-2 border-black flex flex-col justify-between select-all text-left box-border rounded-none relative"
        >
          {/* Header Banner */}
          <div className="border-b-2 border-black pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="bg-red-700 text-white text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-xs">
                    INDIA POST PARCEL
                  </span>
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">
                    (CONTRACTUAL)
                  </span>
                </div>
                <div className="text-[10px] font-bold text-slate-800 tracking-tight">
                  CONTRACT NO. 41120154 - TENALI EXAMS PUBLISHERS
                </div>
                <div className="text-[11px] font-black text-black tracking-wider font-mono">
                  CUSTOMER ID: {orderNumber}
                </div>
              </div>

              {/* Barcode & Postage Prepaid Stamp Box */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:block">
                  <BarcodeSVG code={orderNumber} />
                </div>

                <div className="border-2 border-dashed border-red-700 bg-red-50/50 p-1.5 text-center min-w-24 rounded-xs">
                  <div className="text-[8px] font-black text-red-700 uppercase tracking-tighter leading-tight">
                    POSTAGE PREPAID
                  </div>
                  <div className="text-[9px] font-extrabold text-slate-900 leading-tight">
                    CONTRACT PARCEL
                  </div>
                  <div className="text-[7.5px] font-bold text-red-600 tracking-tighter">
                    INDIA POST BNPL
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Body: TO (Consignee) Section */}
          <div className="my-1.5 flex justify-between items-start gap-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white text-[11px] font-black px-2 py-0.5 rounded-xs uppercase tracking-wider">
                  TO:
                </span>
                <span className="text-sm font-black text-black uppercase tracking-wide">
                  {addr.fullName || 'CUSTOMER'}
                </span>
              </div>

              <div className="pl-7 text-xs font-semibold text-slate-900 leading-snug space-y-0.5">
                <div>{[addr.houseOrFlat, addr.street].filter(Boolean).join(', ')}</div>
                {addr.area && <div>{addr.area}</div>}
                <div className="font-bold text-black">{[addr.city, addr.state].filter(Boolean).join(', ')}</div>
                {addr.mobile && (
                  <div className="pt-1 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 bg-black text-white font-mono font-bold text-[11px] px-2 py-0.5 rounded-xs">
                      <Phone size={10} /> CELL: {addr.mobile}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Destination PIN Code Box */}
            <div className="border-2 border-black bg-amber-50 p-2 text-center rounded-xs shrink-0 shadow-xs min-w-32">
              <div className="text-[9px] font-black text-slate-700 uppercase tracking-wider">
                DESTINATION PIN
              </div>
              <div className="text-xl font-black text-black tracking-widest font-mono mt-0.5 border-t border-black/20 pt-0.5">
                {addr.pinCode || '------'}
              </div>
            </div>
          </div>

          {/* Footer: FROM (Shipper) Section */}
          <div className="border-t-2 border-black pt-1.5 mt-auto flex items-end justify-between text-[10px]">
            <div className="space-y-0.5">
              <div className="font-black text-black text-[9px] uppercase tracking-wider flex items-center gap-1">
                <span>FROM (SENDER / RETURN IF UNDELIVERED):</span>
              </div>
              <div className="font-black text-slate-900 text-[10.5px]">
                TENALI EXAMS PUBLISHERS
              </div>
              <div className="font-medium text-slate-800 leading-tight">
                D.NO. 19-308, NAMBURU - 522508, GUNTUR DIST, ANDHRA PRADESH
              </div>
              <div className="font-bold text-black font-mono text-[10px]">
                CELL: +91 7396977544
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-block border border-black font-mono font-bold text-[9px] px-1.5 py-0.5 bg-slate-100 text-black">
                ORIGIN PIN: 522508
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
