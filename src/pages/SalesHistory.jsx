import React, { useState } from 'react';
import { DollarSign, ShoppingBag, TrendingUp, Search, FileText, Calendar, Download, Printer, X, CheckCircle, Trash2, Edit2, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import html2canvas from 'html2canvas';
import { doc, deleteDoc } from "firebase/firestore";
import { db } from '../firebase'; 

export default function SalesHistory({ sales, loading, onEditOrder }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedSale, setSelectedSale] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null); // NEW: Holds the picture

  const totalRevenue = sales.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrders = sales.length;
  const grossProfit = sales.reduce((sum, order) => {
    return sum + (order.items?.reduce((isum, item) => isum + ((item.commission || 0) * (item.qty || 0)), 0) || 0);
  }, 0);

  const downloadCSV = () => {
    const headers = ["Date", "Order ID", "Customer", "Items", "Method", "Revenue (RM)", "Commission (RM)"];
    const rows = sales.map(sale => {
      const rowCommission = sale.items?.reduce((s, i) => s + ((i.commission || 0) * i.qty), 0) || 0;
      return [
        `${sale.date.toLocaleDateString()} ${sale.date.toLocaleTimeString()}`,
        sale.id,
        `"${sale.name || 'Guest'}"`,
        `"${sale.items?.map(i => `${i.qty}x ${i.name}`).join('; ')}"`,
        sale.deliveryMethod,
        (sale.total || 0).toFixed(2),
        rowCommission.toFixed(2)
      ].join(",");
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `Sales_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const openInvoice = (sale) => {
    setSelectedSale(sale);
    setGeneratedImage(null);
    setTimeout(() => setIsInvoiceOpen(true), 100);
  };

  const handlePrint = () => {
    setTimeout(() => { window.print(); }, 100);
  };

  // --- NEW: GENERATE IMAGE FOR LONG-PRESS ---
  const handleGenerateImage = async () => {
    const receiptElement = document.getElementById('receipt-capture-area');
    if (!receiptElement) return;

    try {
      const canvas = await html2canvas(receiptElement, { 
        scale: 2, 
        backgroundColor: '#ffffff',
        useCORS: true 
      });
      const dataUrl = canvas.toDataURL('image/png');
      setGeneratedImage(dataUrl);
    } catch (error) {
      console.error("Error generating PNG:", error);
      alert("Failed to generate image.");
    }
  };

  const handleDeleteSale = async (id) => {
    if (window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "sales", id));
      } catch (error) {
        console.error("Error deleting order:", error);
        alert("Failed to delete the order. Please try again.");
      }
    }
  };

  const filteredSales = sales.filter(order => 
    (order.name && order.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (order.id && order.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full w-full text-slate-800 p-4 md:p-8 overflow-y-auto pb-32 md:pb-8 relative">
      
      {/* Header */}
      <div className="shrink-0 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 no-print">
        <div>
          <h2 className="text-2xl md:text-[28px] font-bold tracking-tight">Sales History</h2>
          <p className="text-sm md:text-base text-slate-500 mt-1">Track your profit and transactions</p>
        </div>
        <button onClick={downloadCSV} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95">
          <Download size={18} /> Export Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="shrink-0 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 no-print">
        <div className="bg-white p-5 md:p-6 rounded-[24px] shadow-sm border border-slate-100 flex items-center justify-between">
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Sales</p><h3 className="text-2xl md:text-3xl font-extrabold text-slate-900">RM {totalRevenue.toFixed(2)}</h3></div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><DollarSign size={24} /></div>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-[24px] shadow-sm border border-slate-100 flex items-center justify-between">
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Commission</p><h3 className="text-2xl md:text-3xl font-extrabold text-emerald-600">RM {grossProfit.toFixed(2)}</h3></div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center"><TrendingUp size={24} /></div>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-[24px] shadow-sm border border-slate-100 flex items-center justify-between">
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Orders</p><h3 className="text-2xl md:text-3xl font-extrabold text-slate-900">{totalOrders}</h3></div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center"><ShoppingBag size={24} /></div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col shrink-0 no-print">
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><FileText size={20} /></div>
            <h3 className="text-lg md:text-xl font-bold">Recent Transactions</h3>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input type="text" placeholder="Search customer or ID..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 text-slate-700 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          {loading ? (
            <div className="py-20 flex items-center justify-center text-slate-400">Loading sales data...</div>
          ) : filteredSales.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400"><ShoppingBag size={48} className="mb-4 text-slate-200" /><p>No transactions found.</p></div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead className="bg-white border-b border-slate-50">
                <tr>
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID / Customer</th>
                  <th className="hidden md:table-cell py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Items</th>
                  <th className="hidden md:table-cell py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Method</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Total</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-sm text-slate-500 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-300"/>
                        <div className="flex flex-col md:flex-row md:gap-2">
                            <span>{sale.date.toLocaleDateString()}</span>
                            <span className="text-slate-300 text-xs">{sale.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <span className="font-mono font-bold text-blue-600 block text-[10px] uppercase">{sale.id}</span>
                      <span className="font-bold text-slate-700 capitalize">{sale.name || "Guest"}</span>
                    </td>
                    <td className="hidden md:table-cell py-4 px-6 text-sm text-slate-600 max-w-[200px] truncate">{sale.items?.map(i => `${i.qty}x ${i.name}`).join(', ')}</td>
                    <td className="hidden md:table-cell py-4 px-6 text-sm"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">{sale.deliveryMethod || "COD"}</span></td>
                    <td className="py-4 px-6 text-sm font-bold text-right text-slate-900">RM {sale.total?.toFixed(2)}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => onEditOrder(sale)} className="text-slate-400 hover:text-emerald-500 p-2 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit Order">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => openInvoice(sale)} className="text-slate-400 hover:text-[#1a73e8] p-2 hover:bg-blue-50 rounded-lg transition-colors" title="Print Invoice">
                          <Printer size={18} />
                        </button>
                        <button onClick={() => handleDeleteSale(sale.id)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete Order">
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

      {/* --- INVOICE MODAL --- */}
      {isInvoiceOpen && selectedSale && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[393px] md:max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:rounded-xl">
            
            <div className="p-4 bg-slate-800 text-white flex justify-between items-center no-print shrink-0">
              <span className="font-bold flex items-center gap-2 text-xs md:text-sm"><CheckCircle size={14} className="text-green-400"/> Invoice View</span>
              
              <div className="flex gap-2">
                 {generatedImage ? (
                   <button onClick={() => setGeneratedImage(null)} className="px-3 py-1.5 bg-slate-600 text-white rounded-lg text-xs md:text-sm font-bold flex items-center gap-1.5 hover:bg-slate-500 transition-colors">
                      <ArrowLeft size={14}/> <span>Back</span>
                   </button>
                 ) : (
                   <button onClick={handleGenerateImage} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs md:text-sm font-bold flex items-center gap-1.5 hover:bg-emerald-600 transition-colors">
                      <ImageIcon size={14}/> <span className="hidden md:inline">Get Image</span><span className="md:hidden">Image</span>
                   </button>
                 )}
                 <button onClick={handlePrint} className="px-3 py-1.5 bg-[#1a73e8] text-white rounded-lg text-xs md:text-sm font-bold flex items-center gap-1.5 hover:bg-blue-600 transition-colors">
                    <Printer size={14}/> <span className="hidden md:inline">Print / PDF</span><span className="md:hidden">Print</span>
                 </button>
                 <button onClick={() => setIsInvoiceOpen(false)} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400"><X size={18} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-100">
              {generatedImage ? (
                <div className="p-4 md:p-8 flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
                  <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs md:text-sm font-bold p-3 rounded-lg w-full mb-4 text-center shadow-sm">
                    📱 Long-press the receipt below to Save to Photos or Share to WhatsApp!
                  </div>
                  <img src={generatedImage} alt="Receipt" className="max-w-full shadow-2xl rounded-xl border border-slate-200" />
                </div>
              ) : (
                <div id="receipt-capture-area" className="flex flex-col p-4 md:p-8 bg-white min-h-max text-slate-800 font-sans">
                  
                  <div className="flex justify-between items-start border-b-2 border-slate-100 pb-4 mb-6 md:pb-6 md:mb-8">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center shrink-0 overflow-hidden border-2 border-slate-100">
                        <img src="/logo.png" alt="Puteri Treats Logo" className="w-full h-full object-contain p-1" />
                      </div>
                      <div>
                        <h1 className="text-xl md:text-3xl font-extrabold text-slate-900 tracking-tight">INVOICE</h1>
                        <p className="text-[10px] md:text-sm font-bold text-[#1a73e8] mt-0.5 md:mt-1">{selectedSale.id}</p>
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
                        <p className="text-sm md:text-base font-bold text-slate-900 capitalize">{selectedSale.name}</p>
                        <p className="text-xs md:text-sm text-slate-600 mt-1 whitespace-pre-wrap">{selectedSale.billTo || "No address provided"}</p>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-1/3 grid grid-cols-2 md:grid-cols-1 gap-2 md:space-y-3">
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</span>
                        <span className="font-bold text-slate-900 text-xs md:text-sm">{selectedSale.date.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivery</span>
                        <span className="font-bold text-slate-900 text-xs md:text-sm">{selectedSale.deliveryDate}</span>
                      </div>
                      <div className="flex justify-between items-center col-span-2 md:col-span-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Method</span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] md:text-xs font-bold text-slate-700 border border-slate-200">
                          {selectedSale.deliveryMethod}
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
                        {selectedSale.items?.map((item, idx) => (
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
                         <span>RM {(selectedSale.total - (parseFloat(selectedSale.deliveryFee) || 0)).toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between text-xs md:text-sm text-slate-800 font-medium border-b border-slate-100 pb-2">
                         <span>Delivery ({selectedSale.deliveryMethod})</span>
                         <span>RM {(parseFloat(selectedSale.deliveryFee) || 0).toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between items-center pt-1">
                         <span className="text-sm md:text-base font-bold text-slate-900">Total Due</span>
                         <span className="text-2xl md:text-3xl font-extrabold text-[#1a73e8]">RM {selectedSale.total.toFixed(2)}</span>
                       </div>
                    </div>
                  </div>

                  <div className="text-center pt-6 pb-2">
                    <p className="text-[10px] md:text-xs font-bold text-slate-900">Thank you for your business!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}