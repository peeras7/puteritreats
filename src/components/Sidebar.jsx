import React from 'react';
import { LayoutDashboard, Layers, ShoppingBag, LogOut, Wallet, History } from 'lucide-react'; // Added History icon
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function Sidebar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'POS', desktopLabel: 'Dashboard (POS)' },
    { id: 'inventory', icon: Layers, label: 'Stock', desktopLabel: 'Inventory' },
    { id: 'sales', icon: ShoppingBag, label: 'Sales', desktopLabel: 'Sales History' },
    { id: 'payout', icon: Wallet, label: 'Payout', desktopLabel: 'Supplier POS' },
    { id: 'payoutHistory', icon: History, label: 'History', desktopLabel: 'Supplier History' } // --- NEW TAB ADDED HERE ---
  ];

  const handleLogout = () => {
    if (window.confirm("Log out of Treats?")) {
      signOut(auth);
    }
  };

  return (
    <>
      <div className="hidden md:flex w-[260px] bg-white flex-col z-10 p-6 h-full border-r border-slate-100/50">
        <div className="flex items-center space-x-3 mb-10 pl-2">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden border border-slate-100">
            <img src="/logo.png" alt="Puteri Treats Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight tracking-tight text-slate-800">Treats</h1>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Admin Panel</p>
          </div>
        </div>
        
        <div className="flex-1 space-y-2">
          {tabs.map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium text-[15px] 
              ${activeTab === tab.id 
                ? 'bg-[#1a73e8] text-white shadow-md shadow-blue-500/20' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            >
              <tab.icon size={20} className={activeTab === tab.id ? "text-white" : "text-slate-400"} />
              <span>{tab.desktopLabel}</span>
            </button>
          ))}
        </div>

        <button 
          onClick={handleLogout}
          className="mt-auto flex items-center space-x-3 px-4 py-3.5 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors font-medium text-[15px]"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 z-[50] pb-safe">
        <div className="flex justify-around items-center h-16 px-1">
          {tabs.map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              className={`flex flex-col items-center justify-center w-full h-full space-y-1
              ${activeTab === tab.id ? 'text-[#1a73e8]' : 'text-slate-400'}`}
            >
              <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
              <span className="text-[9px] font-bold">{tab.label}</span>
            </button>
          ))}
          <button 
            onClick={handleLogout}
            className="flex flex-col items-center justify-center w-full h-full space-y-1 text-red-400"
          >
            <LogOut size={22} strokeWidth={2} />
            <span className="text-[9px] font-bold">Exit</span>
          </button>
        </div>
      </div>
    </>
  );
}