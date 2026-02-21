import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Cookie, X, CheckCircle, User, MapPin, Printer, FileText, Truck, DollarSign, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function PosDashboard({ 
  inventory, carts, activeCartId, setActiveCartId, activeCart, 
  handleAddCart, handleRemoveCart, updateCartName, 
  addToCart, updateQty, cartTotal, onCheckout, sales 
}) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null); 
  
  const [orderDetails, setOrderDetails] = useState({ 
    name: '', billTo: '', phone: '', deliveryDate: new Date().toISOString().split('T')[0], deliveryMethod: 'Grab', deliveryFee: ''
  });
  const [invoiceId, setInvoiceId] = useState('');

  const initiateCheckout = () => {
    if (activeCart.items.length === 0) return;
    
    const isExistingOrder = activeCart.id.startsWith('pt');
    const formattedId = isExistingOrder ? activeCart.id : "pt" + String(sales.length + 1).padStart(3, '0');
    
    setInvoiceId(formattedId);
    
    setOrderDetails({
      name: activeCart.name || '',
      billTo: activeCart.billTo || '',
      phone: '',
      deliveryDate: activeCart.deliveryDate || new Date().toISOString().split('T')[0],
      deliveryMethod: activeCart.deliveryMethod || 'Grab',
      deliveryFee: activeCart.deliveryFee || ''
    });
    
    setIsCheckoutOpen(true);
  };

  const finalizeOrder = async () => {
    const finalFee = parseFloat(orderDetails.deliveryFee) || 0;
    const finalData = { 
       ...orderDetails, 
       id: invoiceId, 
       items: activeCart.items, 
       total: cartTotal + finalFee,
       deliveryFee: finalFee
    };
    
    setReceiptData(finalData); 
    
    if (onCheckout) {
       await onCheckout(finalData, activeCart.id); 
    }
    setIsCheckoutOpen(false);
    setTimeout(() => setIsReceiptOpen(true), 100);
  };

  const handlePrint = () => { setTimeout(() => { window.print(); }, 100); };

  // --- UPDATED DOWNLOAD FUNCTION FOR MOBILE ---
  const handleDownloadPNG = async () => {
    const receiptElement = document.getElementById('printable-receipt');
    if (!receiptElement) return;

    try {
      // 1. Temporarily remove scroll limits so html2canvas can see the whole thing
      const originalOverflow = receiptElement.style.overflow;
      const originalHeight = receiptElement.style.height;
      receiptElement.style.overflow = 'visible';
      receiptElement.style.height = 'auto';

      // 2. Take the picture with a solid white background
      const canvas = await html2canvas(receiptElement, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff' 
      });
      
      // 3. Put the scrollbar back immediately
      receiptElement.style.overflow = originalOverflow;
      receiptElement.style.height = originalHeight;

      // 4. Force the mobile download
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `Invoice_${invoiceId}.png`;
      document.body.appendChild(link); // Crucial for iPhones
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Error generating PNG:", error);
      alert("Failed to save image. You can always take a screenshot as a backup!");
    }
  };

  const closeAll = () => {
    setIsReceiptOpen(false);
    setReceiptData(null);
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-4 md:gap-6 text-slate-800 relative">
      
      {/* --- PRODUCTS GRID --- */}
      <div className="flex-1 flex flex-col gap-4 md:gap-6 no-print overflow-hidden">
        <div className="shrink-0">
          <h2 className="text-2xl md:text-[28px] font-bold tracking-tight">Point of Sale</h2>
          <p className="text-sm md:text-base text-slate-500 mt-1">Tap items to add to order</p>
        </div>
        
        <div className="flex-1 overflow-y-auto pb-4 pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {inventory.map((item) => (
              <div key={item.id} onClick={() => addToCart(item)} className="bg-white p-3 md:p-5 rounded-[20px] md:rounded-[24px] shadow-sm hover:shadow-md border border-slate-50 cursor-pointer transition-all active:scale-95 flex flex-col group">
                <div className={`w-full aspect-square bg-slate-50 rounded-[16px] flex items-center justify-center mb-3 md:mb-4 ${item.qty === 0 ? 'opacity-50' : 'group-hover:text-[#1a73e8]'}`}>
                  <Cookie size={32} className="text-slate-300 group-hover:text-blue-400 transition-colors md:w-10 md:h-10" />
                </div>
                <h3 className="font-bold text-xs md:text-sm mb-1 line-clamp-1">{item.name}</h3>
                <p className={`text-[10px] md:text-xs font-medium mb-2 ${item.qty === 0 ? 'text-red-500' : 'text-slate-400'}`}>
                  {item.qty === 0 ? 'Out of stock' : `${item.qty} in stock`}
                </p>
                <div className="mt-auto"><p className="text-[#1a73e8] font-bold text-sm md:text-base">RM {item.price.toFixed(2)}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- CART PANEL --- */}
      <div className="w-full md:w-[380px] h-[55vh] md:h-full bg-white rounded-t-[24px] md:rounded-[32px] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:shadow-sm border border-slate-50 flex flex-col overflow-hidden shrink-0 no-print z-20">
        
        <div className="p-4 md:p-5 border-b border-slate-50 bg-white sticky top-0 flex flex-col gap-3 shrink-0 shadow-sm z-10">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg tracking-tight">Open Orders</h3>
            <button onClick={handleAddCart} className="bg-blue-50 text-[#1a73e8] px-2 py-1.5 rounded-lg font-bold flex items-center gap-1 text-xs hover:bg-blue-100 transition-colors">
              <Plus size={16} /> New Tab
            </button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {carts.map(c => (
              <button 
                key={c.id} 
                onClick={() => setActiveCartId(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${activeCartId === c.id ? 'bg-[#1a73e8] text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                {c.name || (c.id.startsWith('pt') ? c.id : 'New Order')}
                {carts.length > 1 && (
                   <div 
                     onClick={(e) => { e.stopPropagation(); handleRemoveCart(c.id); }}
                     className={`p-0.5 rounded-full ${activeCartId === c.id ? 'hover:bg-blue-600' : 'hover:bg-slate-300'}`}
                   >
                     <X size={12} />
                   </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 focus-within:ring-2 ring-blue-500/20 transition-all">
            <User size={16} className="text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Enter Customer Name..." 
              className="bg-transparent w-full outline-none text-slate-800 font-bold text-sm"
              value={activeCart.name}
              onChange={(e) => updateCartName(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
          {activeCart.items.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-300">
               <ShoppingCart size={32} className="mb-3 text-slate-200 md:w-12 md:h-12" />
               <p className="text-sm font-medium">Cart is empty</p>
             </div>
          ) : (
            activeCart.items.map(item => (
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
          <div className="flex justify-between items-end mb-4 md:mb-6">
            <span className="text-slate-500 font-medium text-sm">Subtotal</span>
            <span className="text-2xl md:text-3xl font-bold text-[#1a73e8]">RM {cartTotal.toFixed(2)}</span>
          </div>
          <button onClick={initiateCheckout} disabled={activeCart.items.length === 0} className={`w-full py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-base md:text-lg transition-all shadow-lg active:scale-95 ${activeCart.items.length > 0 ? 'bg-[#1a73e8] text-white shadow-blue-500/25' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
            Proceed to Invoice
          </button>
        </div>
      </div>

      {/* --- CHECKOUT FORM MODAL --- */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
          
          <div className="bg-white w-full md:max-w-lg rounded-t-[32px] md:rounded-[32px] shadow-2xl p-6 md:p-8 border border-white/50 animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-xl md:text-2xl font-bold text-slate-800">Invoice Details</h3>
              <button onClick={() => setIsCheckoutOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={24} /></button>
            </div>
            
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 pb-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Customer Name</label>
                <div className="flex items-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 focus-within:ring-2 ring-blue-500/20">
                  <User size={18} className="text-slate-400 mr-3" />
                  <input type="text" placeholder="e.g. Sarah" className="bg-transparent w-full outline-none text-slate-800 font-bold" autoFocus value={orderDetails.name} onChange={(e) => setOrderDetails({...orderDetails, name: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Date</label>
                   <div className="flex items-center bg-slate-50 rounded-xl px-3 md:px-4 py-3 border border-slate-100 focus-within:ring-2 ring-blue-500/20">
                     <input type="date" className="bg-transparent w-full outline-none text-slate-800 font-medium text-sm" value={orderDetails.deliveryDate} onChange={(e) => setOrderDetails({...orderDetails, deliveryDate: e.target.value})} />
                   </div>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Method</label>
                   <div className="flex items-center bg-slate-50 rounded-xl px-3 md:px-4 py-3 border border-slate-100 focus-within:ring-2 ring-blue-500/20">
                     <Truck size={18} className="text-slate-400 mr-2 shrink-0" />
                     <select className="bg-transparent w-full outline-none text-slate-800 font-medium appearance-none text-sm" value={orderDetails.deliveryMethod} onChange={(e) => setOrderDetails({...orderDetails, deliveryMethod: e.target.value})}>
                       <option value="Grab">Grab</option>
                       <option value="Lalamove">Lalamove</option>
                       <option value="COD">COD</option>
                       <option value="PICKUP">Pickup</option>
                     </select>
                   </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Delivery Charge (RM)</label>
                <div className="flex items-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 focus-within:ring-2 ring-blue-500/20">
                  <DollarSign size={18} className="text-slate-400 mr-3" />
                  <input type="number" placeholder="0.00" className="bg-transparent w-full outline-none text-slate-800 font-bold" value={orderDetails.deliveryFee} onChange={(e) => setOrderDetails({...orderDetails, deliveryFee: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Address / Notes</label>
                <div className="flex items-start bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 focus-within:ring-2 ring-blue-500/20">
                  <MapPin size={18} className="text-slate-400 mr-3 mt-1" />
                  <textarea placeholder="Address, Phone number..." rows="2" className="bg-transparent w-full outline-none text-slate-800 font-medium resize-none" value={orderDetails.billTo} onChange={(e) => setOrderDetails({...orderDetails, billTo: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="pt-4 mt-auto border-t border-slate-100 shrink-0 bg-white">
              <button onClick={finalizeOrder} disabled={!orderDetails.name} className={`w-full py-4 rounded-xl md:rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 transition-all shadow-lg active:scale-95 ${orderDetails.name ? 'bg-[#1a73e8] text-white shadow-blue-500/30' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                <FileText size={20} /><span>{activeCart.id.startsWith('pt') ? 'Update Invoice' : 'Generate Invoice'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- FINAL INVOICE PREVIEW --- */}
      {isReceiptOpen && receiptData && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[393px] md:max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:rounded-xl">
            
            <div className="p-4 bg-slate-800 text-white flex justify-between items-center no-print shrink-0">
              <span className="font-bold flex items-center gap-2 text-xs md:text-sm"><CheckCircle size={14} className="text-green-400"/> Ready</span>
              <div className="flex gap-2">
                 <button onClick={handleDownloadPNG} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs md:text-sm font-bold flex items-center gap-1.5 hover:bg-emerald-600 transition-colors">
                    <Download size={14}/> <span className="hidden md:inline">Save PNG</span><span className="md:hidden">PNG</span>
                 </button>
                 <button onClick={handlePrint} className="px-3 py-1.5 bg-[#1a73e8] text-white rounded-lg text-xs md:text-sm font-bold flex items-center gap-1.5 hover:bg-blue-600 transition-colors">
                    <Printer size={14}/> <span className="hidden md:inline">Print / PDF</span><span className="md:hidden">Print</span>
                 </button>
                 <button onClick={closeAll} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400"><X size={18} /></button>
              </div>
            </div>

            <div id="printable-receipt" className="flex-1 bg-white overflow-y-auto overflow-x-hidden text-slate-800 font-sans relative flex flex-col p-4 md:p-8">
              
              <div className="flex justify-between items-start border-b-2 border-slate-100 pb-4 mb-6 md:pb-6 md:mb-8">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center shrink-0 overflow-hidden border-2 border-slate-100">
                    <img src="/logo.png" alt="Puteri Treats Logo" className="w-full h-full object-contain p-1" />
                  </div>
                  <div>
                    <h1 className="text-xl md:text-3xl font-extrabold text-slate-900 tracking-tight">INVOICE</h1>
                    <p className="text-[10px] md:text-sm font-bold text-[#1a73e8] mt-0.5 md:mt-1">{receiptData.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-sm md:text-lg font-bold text-slate-900">Puteri Treats</h2>
                  <p className="text-[10px] md:text-xs text-slate-500 max-w-[160px] ml-auto">Jalan SS 3/44, Taman Universiti, 47300 Petaling Jaya, Selangor</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 md:gap-12 mb-6 md:mb-10">
                <div className="flex-1">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Bill To</h3>
                  <div className="bg-slate-50/50 p-3 md:p-4 rounded-lg border border-slate-100">
                    <p className="text-sm md:text-base font-bold text-slate-900 capitalize">{receiptData.name}</p>
                    <p className="text-xs md:text-sm text-slate-600 mt-1 whitespace-pre-wrap">{receiptData.billTo || "No address provided"}</p>
                  </div>
                </div>
                <div className="w-full md:w-1/3 grid grid-cols-2 md:grid-cols-1 gap-2 md:space-y-3">
                  <div className="flex justify-between border-b border-slate-50 pb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</span>
                    <span className="font-bold text-slate-900 text-xs md:text-sm">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivery</span>
                    <span className="font-bold text-slate-900 text-xs md:text-sm">{receiptData.deliveryDate}</span>
                  </div>
                  <div className="flex justify-between items-center col-span-2 md:col-span-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Method</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] md:text-xs font-bold text-slate-700 border border-slate-200">
                      {receiptData.deliveryMethod}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6 md:mb-8 flex-1">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="border-b-2 border-slate-800">
                      <th className="py-2 text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[45%]">Item</th>
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

              <div className="flex flex-col md:flex-row justify-between items-start pt-4 md:pt-6 border-t-2 border-slate-100 mt-auto gap-4">
                <div className="w-full md:w-auto">
                   <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Info</h3>
                   <div className="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-200 w-full md:min-w-[280px] flex justify-between items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1 gap-2">
                            <span className="text-xs font-bold text-slate-700 truncate">Maybank</span>
                            <span className="text-[9px] font-bold bg-yellow-400 text-black px-1.5 py-0.5 rounded shrink-0">MBB</span>
                        </div>
                        <p className="text-sm md:text-base font-mono font-bold text-slate-900 tracking-wide truncate">157175142374</p>
                        <p className="text-[10px] font-medium text-slate-500 uppercase mt-1 truncate">Puteri Wasimah</p>
                      </div>
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-white p-1 rounded-lg border border-slate-100 shrink-0 flex items-center justify-center">
                         <img src="/qr.png" alt="DuitNow QR" className="w-full h-full object-contain" />
                      </div>
                   </div>
                </div>

                <div className="w-full md:w-[40%] space-y-2">
                   <div className="flex justify-between text-xs md:text-sm text-slate-500">
                     <span className="font-medium">Subtotal</span>
                     <span>RM {(receiptData.total - receiptData.deliveryFee).toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-xs md:text-sm text-slate-800 font-medium border-b border-slate-100 pb-2">
                     <span>Delivery ({receiptData.deliveryMethod})</span>
                     <span>RM {receiptData.deliveryFee.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center pt-1">
                     <span className="text-sm md:text-base font-bold text-slate-900">Total Due</span>
                     <span className="text-xl md:text-2xl font-extrabold text-[#1a73e8]">RM {receiptData.total.toFixed(2)}</span>
                   </div>
                </div>
              </div>

              <div className="text-center pt-6 pb-2">
                <p className="text-[10px] md:text-xs font-bold text-slate-900">Thank you for your business!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}