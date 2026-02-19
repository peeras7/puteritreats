import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, writeBatch, query, orderBy } from "firebase/firestore"; 
import { onAuthStateChanged } from "firebase/auth"; 
import { db, auth } from './firebase'; 

import Sidebar from './components/Sidebar';
import Inventory from './pages/Inventory';
import PosDashboard from './pages/PosDashboard';
import SalesHistory from './pages/SalesHistory'; 
import Login from './pages/Login'; 

export default function App() {
  // Auth State
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [cart, setCart] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true); 

  // --- 1. CHECK LOGIN STATUS ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- 2. FETCH INVENTORY & SALES ---
  useEffect(() => {
    if (!user) return; 

    // Fetch Inventory
    const unsubInv = onSnapshot(collection(db, "inventory"), (snapshot) => {
      const inventoryList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setInventory(inventoryList);
      setLoading(false);
    });

    // Fetch Sales (Ordered by newest first)
    const q = query(collection(db, "sales"), orderBy("date", "desc"));
    const unsubSales = onSnapshot(q, (snapshot) => {
      const salesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date() 
      }));
      setSales(salesList);
      setSalesLoading(false);
    });

    return () => {
      unsubInv();
      unsubSales();
    };
  }, [user]); 

  // --- 3. CART LOGIC ---
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
  };
  
  const updateQty = (id, delta) => setCart((prev) => prev.map(item => item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item).filter(item => item.qty > 0));
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // --- 4. CHECKOUT LOGIC ---
  const handleCheckout = async (invoiceData) => {
    try {
      const batch = writeBatch(db);
      // Use the custom ID (e.g., pt001) instead of a random string
      const saleRef = doc(db, "sales", invoiceData.id); 
      const finalTotal = cartTotal + (parseFloat(invoiceData.deliveryFee) || 0);
      
      batch.set(saleRef, {
        ...invoiceData,
        items: cart,
        total: finalTotal,
        date: new Date(),
        userId: user.uid 
      });

      // Deduct stock levels in inventory (Optional - simple version)
      cart.forEach(cartItem => {
         const invItem = inventory.find(i => i.id === cartItem.id);
         if(invItem) {
             const invRef = doc(db, "inventory", invItem.id);
             batch.update(invRef, { qty: Math.max(0, invItem.qty - cartItem.qty) });
         }
      });

      await batch.commit();
      alert(`Order ${invoiceData.id} Successfully Saved!`);
      setCart([]); 
      return true;
    } catch (e) {
      console.error("Error saving order: ", e);
      alert("Failed to save order.");
      return false;
    }
  };

  // --- RENDER ---
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#eef2f6]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a73e8]"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen md:p-8 flex justify-center items-center selection:bg-blue-100 text-slate-800 bg-[#eef2f6]">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
      </style>
      
      <div className="bg-white/50 md:backdrop-blur-3xl md:rounded-[32px] w-full max-w-[1400px] h-screen md:h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-none md:shadow-2xl ring-0 md:ring-1 ring-white/60">
        
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="flex-1 bg-[#f8fafc] w-full h-full overflow-hidden md:rounded-l-[32px] shadow-none md:shadow-[inset_4px_0_24px_rgba(0,0,0,0.02)] border-l border-white/50 relative flex flex-col pb-20 md:pb-0">
          
          {(loading || salesLoading) && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a73e8]"></div>
            </div>
          )}

          <div className="flex-1 h-full w-full overflow-hidden relative">
            {activeTab === 'inventory' && <Inventory inventory={inventory} />}
            
            {activeTab === 'dashboard' && (
              <PosDashboard 
                inventory={inventory} 
                cart={cart} 
                setCart={setCart} 
                addToCart={addToCart} 
                updateQty={updateQty} 
                cartTotal={cartTotal}
                onCheckout={(data) => handleCheckout(data)}
                sales={sales}
              />
            )}

            {activeTab === 'sales' && (
              <SalesHistory sales={sales} loading={salesLoading} /> 
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}