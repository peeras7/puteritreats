import React, { useState } from 'react';
import { Box, AlertTriangle, Package, Edit2, Trash2, Plus, X, Save, Search } from 'lucide-react';
import { doc, deleteDoc, updateDoc, addDoc, collection } from "firebase/firestore";
import { db } from '../firebase'; 

export default function Inventory({ inventory }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', category: 'Cookies', qty: 0, price: 0, commission: 0
  });

  const lowStockItems = inventory.filter(i => i.qty <= 5);
  
  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
    } else {
      setEditingItem(null);
      setFormData({ name: '', category: 'Cookies', qty: 0, price: 0, commission: 0 });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      await deleteDoc(doc(db, "inventory", id));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      qty: parseInt(formData.qty),
      price: parseFloat(formData.price),
      commission: parseFloat(formData.commission)
    };

    try {
      if (editingItem) {
        await updateDoc(doc(db, "inventory", editingItem.id), dataToSave);
      } else {
        await addDoc(collection(db, "inventory"), dataToSave);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product.");
    }
  };

  return (
    <div className="flex flex-col h-full w-full text-slate-800 p-4 md:p-8 overflow-hidden">
      
      {/* Header Section */}
      <div className="shrink-0 mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-[28px] font-bold tracking-tight">Inventory Management</h2>
          <p className="text-sm md:text-base text-slate-500 mt-1">Manage products and stock levels efficiently</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-[#1a73e8] hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all active:scale-95"
        >
          <Plus size={20} /> <span className="hidden md:inline">Add Product</span><span className="md:hidden">Add</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="shrink-0 grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Products</p>
                <h3 className="text-3xl font-extrabold text-slate-900">{inventory.length}</h3>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><Box size={20} /></div>
        </div>

        <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Low Stock</p>
                <h3 className="text-3xl font-extrabold text-red-500">{lowStockItems.length}</h3>
            </div>
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center"><AlertTriangle size={20} /></div>
        </div>

        <div className="bg-red-50 rounded-[20px] p-5 border border-red-100 flex flex-col justify-center">
           <div className="flex items-center gap-2 text-red-600 font-bold mb-1">
             <AlertTriangle size={18} /> Needs Restock
           </div>
           {lowStockItems.length > 0 ? (
             <div className="flex justify-between items-center mt-1">
               <div className="truncate pr-2">
                 <p className="text-sm font-bold text-slate-800 truncate">{lowStockItems[0].name}</p>
                 <p className="text-xs text-red-500 font-medium">{lowStockItems[0].qty} left</p>
               </div>
               <button onClick={() => openModal(lowStockItems[0])} className="shrink-0 text-[10px] bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-lg font-bold">Update</button>
             </div>
           ) : (
             <p className="text-xs text-green-600 font-bold mt-1">All stock levels look good!</p>
           )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col overflow-hidden min-h-0">
        
        {/* Toolbar */}
        <div className="shrink-0 p-4 md:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Package size={20} /></div>
             <h3 className="text-lg font-bold">All Products</h3>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 pl-10 pr-4 py-2 rounded-xl text-sm font-medium outline-none focus:ring-2 ring-blue-100 transition-all"
            />
          </div>
        </div>

        {/* Scrollable Table Area */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price</th>
                <th className="hidden md:table-cell py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-emerald-600">Commission</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-bold text-sm text-slate-700">
                    {item.name}
                  </td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${item.qty <= 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                      {item.qty}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm font-bold text-slate-800">RM {item.price?.toFixed(2)}</td>
                  <td className="hidden md:table-cell py-4 px-6 text-sm font-bold text-emerald-600">RM {item.commission?.toFixed(2)}</td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openModal(item)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="h-16 md:h-0"></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD / EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[24px] shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">{editingItem ? 'Edit Product' : 'New Product'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Product Name</label>
                <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 ring-blue-500/20" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 ring-blue-500/20"
                  value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option>Cookies</option>
                  <option>Hamper</option>
                  <option>Dulang Raja</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stock</label>
                  <input required type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 ring-blue-500/20" 
                    value={formData.qty} onChange={e => setFormData({...formData, qty: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price</label>
                  <input required type="number" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-blue-600 focus:outline-none focus:ring-2 ring-blue-500/20" 
                    value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-600 uppercase mb-1">Comm.</label>
                  <input required type="number" step="0.01" className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 font-bold text-emerald-700 focus:outline-none focus:ring-2 ring-emerald-500/20" 
                    value={formData.commission} onChange={e => setFormData({...formData, commission: e.target.value})} />
                </div>
              </div>

              <button type="submit" className="w-full bg-[#1a73e8] hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 mt-4 transition-all hover:-translate-y-1">
                <Save size={20} /> Save Product
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}