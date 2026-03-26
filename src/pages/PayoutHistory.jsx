import React, { useState } from 'react';
import { DollarSign, Search, FileText, Calendar, Download, Printer, X, CheckCircle, Trash2, Edit2, Wallet, ArrowRightCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { doc, deleteDoc } from "firebase/firestore";
import { db } from '../firebase'; 

export default function PayoutHistory({ payouts, loading, onEditPayout }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [isSlipOpen, setIsSlipOpen] = useState(false);

  const totalTransferred = payouts.reduce((sum, p) => sum + (p.total || 0), 0);
  const totalGross = payouts.reduce((sum, p) => sum + (p.subtotal || 0), 0);
  const totalCommissionSaved = payouts.reduce((sum, p) => sum + (p.deduction || 0), 0);

  const downloadCSV = () => {
    const headers = ["Date", "Payout ID", "Supplier", "Items", "Gross Sales (RM)", "My Cut (%)", "Commission Kept (RM)", "Amount Transferred (RM)"];
    const rows = payouts.map(p => {
      return [
        `${p.date.toLocaleDateString()} ${p.date.toLocaleTimeString()}`,
        p.id,
        `"${p.name || 'Supplier'}"`,
        `"${p.items?.map(i => `${i.qty}x ${i.name}`).join('; ')}"`,
        (p.subtotal || 0).toFixed(2),
        p.rate || 0,
        (p.deduction || 0).toFixed(2),
        (p.total || 0).toFixed(2)
      ].join(",");
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `Payouts_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const openSlip = (slip) => {
    setSelectedSlip(slip);
    setTimeout(() => setIsSlipOpen(true), 100);
  };

  const handlePrint = () => { setTimeout(() => { window.print(); }, 100); };

  const handleDownloadImage = async () => {
    const receiptElement = document.getElementById('printable-receipt');
    if (!receiptElement) return;
    try {
      const originalOverflow = receiptElement.style.overflow;
      const originalHeight = receiptElement.style.height;
      receiptElement.style.overflow = 'visible';
      receiptElement.style.height = 'auto';

      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(receiptElement, { scale: 1.5, backgroundColor: '#ffffff', useCORS: true, allowTaint: true });
      
      receiptElement.style.overflow = originalOverflow;
      receiptElement.style.height = originalHeight;

      const image = canvas.toDataURL("image/jpeg", 0.9);
      const link = document.createElement('a');
      link.href = image;
      link.download = `Payout_${selectedSlip.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) { alert("Failed to download image."); }
  };

  const handleDeletePayout = async (id) => {
    if (window.confirm("Are you sure you want to delete this payout record?")) {
      try { await deleteDoc(doc(db, "payouts", id)); } 
      catch (error) { alert("Failed to delete the payout."); }
    }
  };

  const filteredPayouts = payouts.filter(p => 
    (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.id && p.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full w-full text-slate-800 p-4 md:p-8 overflow-y-auto pb-32 md:pb-8 relative">
      
      <div className="shrink-0 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 no-print">
        <div>
          <h2 className="text-2xl md:text-[28px] font-bold tracking-tight">Payout History</h2>
          <p className="text-sm md:text-base text-slate-500 mt-1">Review past payments made to your suppliers</p>
        </div>
        <button onClick={downloadCSV} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95">
          <Download size={18} /> Export Payouts
        </button>
      </div>

      <div className="shrink-0 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 no-print">
        <div className="bg-emerald-50 p-5 md:p-6 rounded-[24px] shadow-sm border border-emerald-100 flex items-center justify-between">
          <div><p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Transferred</p><h3 className="text-2xl md:text-3xl font-extrabold text-emerald-600">RM {totalTransferred.toFixed(2)}</h3></div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-200 text-emerald-700 rounded-full flex items-center justify-center"><ArrowRightCircle size={24} /></div>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-[24px] shadow-sm border border-slate-100 flex items-center justify-between">
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Gross</p><h3 className="text-2xl md:text-3xl font-extrabold text-slate-900">RM {totalGross.toFixed(2)}</h3></div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><DollarSign size={24} /></div>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-[24px] shadow-sm border border-slate-100 flex items-center justify-between">
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Commission Saved</p><h3 className="text-2xl md:text-3xl font-extrabold text-slate-900">RM {totalCommissionSaved.toFixed(2)}</h3></div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center"><Wallet size={24} /></div>
        </div>
      </div>

      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col shrink-0 no-print">
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><FileText size={20} /></div>
            <h3 className="text-lg md:text-xl font-bold">Recent Payouts</h3>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input type="text" placeholder="Search supplier or ID..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-100 text-slate-700 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          {loading ? (
            <div className="py-20 flex items-center justify-center text-slate-400">Loading payout data...</div>
          ) : filteredPayouts.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400"><Wallet size={48} className="mb-4 text-slate-200" /><p>No payouts found.</p></div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead className="bg-white border-b border-slate-50">
                <tr>
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID / Supplier</th>
                  <th className="hidden md:table-cell py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross</th>
                  <th className="hidden md:table-cell py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cut</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-emerald-500 uppercase tracking-wider text-right">Payout Amount</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPayouts.map((p) => (
                  <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-sm text-slate-500 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-300"/>
                        <div className="flex flex-col md:flex-row md:gap-2">
                            <span>{p.date.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <span className="font-mono font-bold text-emerald-600 block text-[10px] uppercase">{p.id}</span>
                      <span className="font-bold text-slate-700 capitalize">{p.name || "Supplier"}</span>
                    </td>
                    <td className="hidden md:table-cell py-4 px-6 text-sm text-slate-600">RM {p.subtotal?.toFixed(2)}</td>
                    <td className="hidden md:table-cell py-4 px-6 text-sm"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-600 border border-red-100">{p.rate}%</span></td>
                    <td className="py-4 px-6 text-sm font-extrabold text-right text-emerald-600">RM {p.total?.toFixed(2)}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => onEditPayout(p)} className="text-slate-400 hover:text-emerald-500 p-2 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit Payout">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => openSlip(p)} className="text-slate-400 hover:text-[#1a73e8] p-2 hover:bg-blue-50 rounded-lg transition-colors" title="Print Slip">
                          <Printer size={18} />
                        </button>
                        <button onClick={() => handleDeletePayout(p.id)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete Payout">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --- PAYOUT SLIP MODAL --- */}
      {isSlipOpen && selectedSlip && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[393px] md:max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:rounded-xl">
            <div className="p-4 bg-slate-800 text-white flex justify-between items-center no-print shrink-0">
              <span className="font-bold flex items-center gap-2 text-xs md:text-sm"><CheckCircle size={14} className="text-emerald-400"/> Slip View</span>
              <div className="flex gap-2">
                 <button onClick={handleDownloadImage} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs md:text-sm font-bold flex items-center gap-1.5 hover:bg-emerald-600 transition-colors">
                    <Download size={14}/> <span className="hidden md:inline">Download Image</span><span className="md:hidden">Save</span>
                 </button>
                 <button onClick={handlePrint} className="px-3 py-1.5 bg-[#1a73e8] text-white rounded-lg text-xs md:text-sm font-bold flex items-center gap-1.5 hover:bg-blue-600 transition-colors">
                    <Printer size={14}/> <span className="hidden md:inline">Print / PDF</span><span className="md:hidden">Print</span>
                 </button>
                 <button onClick={() => setIsSlipOpen(false)} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400"><X size={18} /></button>
              </div>
            </div>

            <div id="printable-receipt" className="flex-1 bg-white overflow-y-auto overflow-x-hidden text-slate-800 font-sans relative flex flex-col p-4 md:p-8">
              <div className="flex justify-between items-start border-b-2 border-slate-100 pb-4 mb-6 md:pb-6 md:mb-8">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center shrink-0 overflow-hidden border-2 border-slate-100">
                    <img src="/logo.png" alt="Puteri Treats Logo" crossOrigin="anonymous" className="w-full h-full object-contain p-1" />
                  </div>
                  <div>
                    <h1 className="text-xl md:text-3xl font-extrabold text-emerald-600 tracking-tight">PAYOUT SLIP</h1>
                    <p className="text-[10px] md:text-sm font-bold text-slate-500 mt-0.5 md:mt-1">{selectedSlip.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-sm md:text-lg font-bold text-slate-900">Puteri Treats</h2>
                  <p className="text-[10px] md:text-xs text-slate-500 max-w-[160px] ml-auto">Jalan SS 3/44, Taman Universiti, 47300 Petaling Jaya, Selangor</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 md:gap-12 mb-6 md:mb-10">
                <div className="flex-1">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Pay To (Supplier)</h3>
                  <div className="bg-slate-50/50 p-3 md:p-4 rounded-lg border border-slate-100">
                    <p className="text-sm md:text-base font-bold text-slate-900 capitalize">{selectedSlip.name}</p>
                  </div>
                </div>
                <div className="w-full md:w-1/3 grid grid-cols-2 md:grid-cols-1 gap-2 md:space-y-3">
                  <div className="flex justify-between border-b border-slate-50 pb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</span>
                    <span className="font-bold text-slate-900 text-xs md:text-sm">{selectedSlip.date.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6 md:mb-8 flex-1">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="border-b-2 border-slate-800">
                      <th className="py-2 text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[45%]">Item Sold</th>
                      <th className="py-2 text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center w-[15%]">Qty</th>
                      <th className="py-2 text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right w-[20%]">Price</th>
                      <th className="py-2 text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right w-[20%]">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedSlip.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 md:py-3 font-bold text-slate-800 text-xs md:text-sm truncate pr-1">{item.name}</td>
                        <td className="py-2 md:py-3 text-center font-medium text-slate-600 text-xs md:text-sm">{item.qty}</td>
                        <td className="py-2 md:py-3 text-right text-slate-600 text-xs md:text-sm">RM {item.price.toFixed(2)}</td>
                        <td className="py-2 md:py-3 text-right font-bold text-slate-900 text-xs md:text-sm">RM {(item.price * item.qty).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col md:flex-row justify-end items-start pt-4 md:pt-6 border-t-2 border-slate-100 mt-auto gap-4">
                <div className="w-full md:w-[60%] space-y-2">
                   <div className="flex justify-between text-xs md:text-sm text-slate-500">
                     <span className="font-medium">Total Gross Sales</span>
                     <span>RM {selectedSlip.subtotal.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-xs md:text-sm text-slate-800 font-medium border-b border-slate-100 pb-2">
                     <span>Puteri Treats Commission ({selectedSlip.rate}%)</span>
                     <span className="text-red-500">- RM {selectedSlip.deduction.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center pt-2">
                     <span className="text-sm md:text-base font-bold text-slate-900">Total Supplier Payout</span>
                     <span className="text-2xl md:text-3xl font-extrabold text-emerald-600">RM {selectedSlip.total.toFixed(2)}</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}