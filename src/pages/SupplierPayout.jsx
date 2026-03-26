import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Cookie, X, CheckCircle, User, FileText, Printer, Download, Share2, Wallet, Trash2 } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function SupplierPayout({ inventory, payouts, onSavePayout, payoutToEdit, clearEdit }) {
  const [cart, setCart] = useState([]);
  const [supplierName, setSupplierName] = useState('');
  const [commissionRate, setCommissionRate] = useState(15);
  const [editModeId, setEditModeId] = useState(null); // Track if we are editing an ID
  
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null); 

  // --- PRE-FILL DATA IF EDITING ---
  useEffect(() => {
    if (payoutToEdit) {
      setCart(payoutToEdit.items || []);
      setSupplierName(payoutToEdit.name || '');
      setCommissionRate(payoutToEdit.rate || 15);
      setEditModeId(payoutToEdit.id);
    }
  }, [payoutToEdit]);

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };
  
  const updateQty = (id, delta) => {
    setCart(cart.map(item => item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item).filter(item => item.qty > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const safeRate = parseFloat(commissionRate) || 0;
  const commissionDeduction = cartTotal * (safeRate / 100);
  const finalPayout = cartTotal - commissionDeduction;

  const finalizePayout = async () => {
    // Generate 'pay001' style sequential ID if it's a new payout
    let formattedId;
    if (editModeId) {
      formattedId = editModeId;
    } else {
      let maxNum = 0;
      payouts.forEach(p => {
        if (p.id && p.id.startsWith('pay')) {
          const num = parseInt(p.id.replace('pay', ''), 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });
      formattedId = "pay" + String(maxNum + 1).padStart(3, '0');
    }

    const finalData = {
      id: formattedId,
      name: supplierName || 'Supplier',
      items: [...cart],
      subtotal: cartTotal,
      rate: safeRate,
      deduction: commissionDeduction,
      total: finalPayout
    };

    setReceiptData(finalData);
    if (onSavePayout) { await onSavePayout(finalData); }
    setIsReceiptOpen(true);
  };

  const clearCurrentCart = () => {
    setCart([]);
    setSupplierName('');
    setCommissionRate(15);
    setEditModeId(null);
    clearEdit(); // Tell App.jsx we stopped editing
  };

  const handlePrint = () => { setTimeout(() => { window.print(); }, 100); };

  const handleDownloadImage = async () => {
    const receiptElement = document.getElementById('receipt-capture-area');
    if (!receiptElement) return;
    try {
      const canvas = await html2canvas(receiptElement, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Payout_${receiptData.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) { alert("Failed to download image."); }
  };

  const closeAll = () => {
    setIsReceiptOpen(false);
    setReceiptData(null);
    clearCurrentCart();
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-4 md:gap-6 text-slate-800 relative">
      
      {/* --- PRODUCTS GRID --- */}
      <div className="flex-1 flex flex-col gap-4 md:gap-6 no-print overflow-hidden">
        <div className="shrink-0 flex justify-between items-end">
          <div>
            <h2 className="text-2xl md:text-[28px] font-bold tracking-tight">Supplier Payouts</h2>
            <p className="text-sm md:text-base text-slate-500 mt-1">Select items sold to calculate supplier transfer</p>
          </div>
          {/* Show a clear button if we are currently editing an old slip */}
          {editModeId && (
            <button onClick={clearCurrentCart} className="text-xs font-bold bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-300 transition-all flex items-center gap-1">
               <X size={14}/> Stop Editing
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto pb-4 pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {inventory.map((item) => (
              <div key={item.id} onClick={() => addToCart(item)} className="bg-white p-3 md:p-5 rounded-[20px] md:rounded-[24px] shadow-sm hover:shadow-md border border-slate-50 cursor-pointer transition-all active:scale-95 flex flex-col group">
                <div className={`w-full aspect-square bg-slate-50 rounded-[16px] flex items-center justify-center mb-3 md:mb-4 group-hover:text-emerald-500`}>
                  <Cookie size={32} className="text-slate-300 group-hover:text-emerald-400 transition-colors md:w-10 md:h-10" />
                </div>
                <h3 className="font-bold text-xs md:text-sm mb-1 line-clamp-1">{item.name}</h3>
                <div className="mt-auto pt-2"><p className="text-emerald-600 font-bold text-sm md:text-base">RM {item.price.toFixed(2)}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- PAYOUT PANEL --- */}
      <div className="w-full md:w-[380px] h-[55vh] md:h-full bg-white rounded-t-[24px] md:rounded-[32px] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:shadow-sm border border-slate-50 flex flex-col overflow-hidden shrink-0 no-print z-20">
        
        <div className="p-4 md:p-5 border-b border-slate-50 bg-white sticky top-0 flex flex-col gap-3 shrink-0 shadow-sm z-10">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg tracking-tight flex items-center gap-2">
              <Wallet className="text-emerald-500" size={20}/> {editModeId ? `Editing ${editModeId}` : 'Payout Calculator'}
            </h3>
            {cart.length > 0 && (
              <button onClick={clearCurrentCart} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"><Trash2 size={16}/></button>
            )}
          </div>
          <div className="flex items-center bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 focus-within:ring-2 ring-emerald-500/20 transition-all">
            <User size={16} className="text-slate-400 mr-2" />
            <input type="text" placeholder="Supplier Name..." className="bg-transparent w-full outline-none text-slate-800 font-bold text-sm" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
          {cart.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-300">
               <ShoppingCart size={32} className="mb-3 text-slate-200 md:w-12 md:h-12" />
               <p className="text-sm font-medium">No items added</p>
             </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center animation-fade-in">
                <div className="flex-1 pr-2">
                  <p className="font-bold text-xs md:text-sm line-clamp-1">{item.name}</p>
                  <p className="text-[10px] md:text-xs text-slate-400">RM {item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center bg-slate-50 rounded-full p-1 border border-slate-100">
                  <button onClick={(e) => { e.stopPropagation(); updateQty(item.id, -1); }} className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center hover:bg-white text-slate-500"><Minus size={14} /></button>
                  <span className="w-6 text-center text-xs md:text-sm font-bold">{item.qty}</span>
                  <button onClick={(e) => { e.stopPropagation(); updateQty(item.id, 1); }} className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center hover:bg-white text-slate-500"><Plus size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 md:p-6 bg-slate-50/50 border-t border-slate-100 shrink-0">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-500 font-medium text-sm">Gross Sales</span>
            <span className="text-sm font-bold text-slate-800">RM {cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-200">
            <span className="text-slate-500 font-medium text-sm flex items-center gap-2">
              My Cut (%) 
              <input type="number" className="w-12 border rounded px-1 py-0.5 text-center text-xs font-bold bg-white outline-none" value={commissionRate} onChange={e => setCommissionRate(e.target.value)}/>
            </span>
            <span className="text-sm font-bold text-red-500">- RM {commissionDeduction.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-end mb-4 md:mb-6">
            <span className="text-slate-800 font-bold text-sm">To Transfer</span>
            <span className="text-2xl md:text-3xl font-extrabold text-emerald-600">RM {finalPayout.toFixed(2)}</span>
          </div>
          <button onClick={finalizePayout} disabled={cart.length === 0} className={`w-full py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-base md:text-lg transition-all shadow-lg active:scale-95 flex justify-center items-center gap-2 ${cart.length > 0 ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
            <FileText size={20}/> {editModeId ? 'Update Payout Slip' : 'Save Payout Slip'}
          </button>
        </div>
      </div>

      {/* --- PAYOUT SLIP PREVIEW --- */}
      {isReceiptOpen && receiptData && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[393px] md:max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:rounded-xl">
            
            <div className="p-4 bg-slate-800 text-white flex justify-between items-center no-print shrink-0">
              <span className="font-bold flex items-center gap-2 text-xs md:text-sm"><CheckCircle size={14} className="text-emerald-400"/> Slip Saved!</span>
              <div className="flex gap-2">
                 <button onClick={handleDownloadImage} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs md:text-sm font-bold flex items-center gap-1.5 hover:bg-emerald-600 transition-colors">
                    <Download size={14}/> <span className="hidden md:inline">Download Image</span><span className="md:hidden">Save</span>
                 </button>
                 <button onClick={handlePrint} className="px-3 py-1.5 bg-[#1a73e8] text-white rounded-lg text-xs md:text-sm font-bold flex items-center gap-1.5 hover:bg-blue-600 transition-colors">
                    <Printer size={14}/> <span className="hidden md:inline">Print / PDF</span><span className="md:hidden">Print</span>
                 </button>
                 <button onClick={closeAll} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400"><X size={18} /></button>
              </div>
            </div>

            <div id="printable-receipt" className="flex-1 bg-white overflow-y-auto overflow-x-hidden text-slate-800 font-sans relative flex flex-col p-4 md:p-8">
              <div id="receipt-capture-area" className="flex flex-col p-4 md:p-8 bg-white min-h-max">
                
                <div className="flex justify-between items-start border-b-2 border-slate-100 pb-4 mb-6 md:pb-6 md:mb-8">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center shrink-0 overflow-hidden border-2 border-slate-100">
                      <img src="/logo.png" alt="Puteri Treats Logo" crossOrigin="anonymous" className="w-full h-full object-contain p-1" />
                    </div>
                    <div>
                      <h1 className="text-xl md:text-3xl font-extrabold text-emerald-600 tracking-tight">PAYOUT SLIP</h1>
                      <p className="text-[10px] md:text-sm font-bold text-slate-500 mt-0.5 md:mt-1">{receiptData.id}</p>
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
                      <p className="text-sm md:text-base font-bold text-slate-900 capitalize">{receiptData.name}</p>
                    </div>
                  </div>
                  <div className="w-full md:w-1/3 grid grid-cols-2 md:grid-cols-1 gap-2 md:space-y-3">
                    <div className="flex justify-between border-b border-slate-50 pb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</span>
                      <span className="font-bold text-slate-900 text-xs md:text-sm">
                        {receiptData.date?.toLocaleDateString ? receiptData.date.toLocaleDateString() : new Date().toLocaleDateString()}
                      </span>
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
                      {receiptData.items.map((item, idx) => (
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
                       <span>RM {receiptData.subtotal.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-xs md:text-sm text-slate-800 font-medium border-b border-slate-100 pb-2">
                       <span>Puteri Treats Commission ({receiptData.rate}%)</span>
                       <span className="text-red-500">- RM {receiptData.deduction.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between items-center pt-2">
                       <span className="text-sm md:text-base font-bold text-slate-900">Total Supplier Payout</span>
                       <span className="text-2xl md:text-3xl font-extrabold text-emerald-600">RM {receiptData.total.toFixed(2)}</span>
                     </div>
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