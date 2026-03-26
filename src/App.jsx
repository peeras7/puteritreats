import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, writeBatch, query, orderBy } from "firebase/firestore"; 
import { onAuthStateChanged } from "firebase/auth"; 
import { db, auth } from './firebase'; 

import Sidebar from './components/Sidebar';
import Inventory from './pages/Inventory';
import PosDashboard from './pages/PosDashboard';
import SalesHistory from './pages/SalesHistory'; 
import SupplierPayout from './pages/SupplierPayout'; 
import PayoutHistory from './pages/PayoutHistory'; // --- NEW IMPORT ---
import Login from './pages/Login'; 

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]); 
  const [payouts, setPayouts] = useState([]); // --- NEW STATE FOR PAYOUTS ---
  
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true); 
  const [payoutsLoading, setPayoutsLoading] = useState(true);

  const [payoutToEdit, setPayoutToEdit] = useState(null); // Tracks if we are editing a payout

  const createEmptyCart = () => ({
    id: Date.now().toString(), 
    name: '', 
    items: [],
    deliveryFee: '',
    deliveryMethod: 'Grab',
    billTo: '',
    deliveryDate: new Date().toISOString().split('T')[0]
  });

  const [carts, setCarts] = useState([createEmptyCart()]);
  const [activeCartId, setActiveCartId] = useState(carts[0].id);
  const activeCart = carts.find(c => c.id === activeCartId) || carts[0];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return; 

    const unsubInv = onSnapshot(collection(db, "inventory"), (snapshot) => {
      const inventoryList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setInventory(inventoryList);
      setLoading(false);
    });

    const qSales = query(collection(db, "sales"), orderBy("date", "desc"));
    const unsubSales = onSnapshot(qSales, (snapshot) => {
      const salesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date() 
      }));
      setSales(salesList);
      setSalesLoading(false);
    });

    // --- FETCH PAYOUTS ---
    const qPayouts = query(collection(db, "payouts"), orderBy("date", "desc"));
    const unsubPayouts = onSnapshot(qPayouts, (snapshot) => {
      const payoutsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date() 
      }));
      setPayouts(payoutsList);
      setPayoutsLoading(false);
    });

    return () => { unsubInv(); unsubSales(); unsubPayouts(); };
  }, [user]); 

  // ... (POS CART FUNCTIONS STAY THE SAME)
  const handleAddCart = () => { const newCart = createEmptyCart(); setCarts([...carts, newCart]); setActiveCartId(newCart.id); };
  const handleRemoveCart = (id) => { if (carts.length === 1) { const newCart = createEmptyCart(); setCarts([newCart]); setActiveCartId(newCart.id); } else { const newCarts = carts.filter(c => c.id !== id); setCarts(newCarts); if (activeCartId === id) setActiveCartId(newCarts[0].id); } };
  const updateCartName = (newName) => { setCarts(carts.map(c => c.id === activeCartId ? { ...c, name: newName } : c)); };
  const addToCart = (product) => { setCarts(carts.map(c => { if (c.id === activeCartId) { const existing = c.items.find(item => item.id === product.id); if (existing) return { ...c, items: c.items.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item) }; return { ...c, items: [...c.items, { ...product, qty: 1 }] }; } return c; })); };
  const updateQty = (id, delta) => { setCarts(carts.map(c => { if (c.id === activeCartId) { return { ...c, items: c.items.map(item => item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item).filter(item => item.qty > 0) }; } return c; })); };
  const cartTotal = activeCart.items.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleEditPastOrder = (order) => {
    const existingTab = carts.find(c => c.id === order.id);
    if (!existingTab) {
      setCarts([...carts, {
        id: order.id, name: order.name || '', items: order.items || [], deliveryFee: order.deliveryFee || '',
        deliveryMethod: order.deliveryMethod || 'Grab', billTo: order.billTo || '', deliveryDate: order.deliveryDate || new Date().toISOString().split('T')[0]
      }]);
    }
    setActiveCartId(order.id);
    setActiveTab('dashboard'); 
  };

  const handleCheckout = async (invoiceData, cartIdToRemove) => {
    try {
      const batch = writeBatch(db);
      const saleRef = doc(db, "sales", invoiceData.id); 
      batch.set(saleRef, { ...invoiceData, date: new Date(), userId: user.uid });
      await batch.commit();
      handleRemoveCart(cartIdToRemove);
      return true;
    } catch (e) {
      console.error("Error saving order: ", e);
      alert("Failed to save order.");
      return false;
    }
  };

  // --- NEW: SAVE PAYOUT TO FIREBASE ---
  const handleSavePayout = async (payoutData) => {
    try {
      const batch = writeBatch(db);
      const ref = doc(db, "payouts", payoutData.id); 
      batch.set(ref, { ...payoutData, date: new Date(), userId: user.uid });
      await batch.commit();
      return true;
    } catch (e) {
      console.error("Error saving payout: ", e);
      alert("Failed to save payout.");
      return false;
    }
  };

  // --- NEW: EDIT PAYOUT TRIGGER ---
  const handleEditPayout = (payout) => {
    setPayoutToEdit(payout);
    setActiveTab('payout');
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-[#eef2f6]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a73e8]"></div></div>;
  if (!user) return <Login />;

  return (
    <div className="min-h-screen md:p-8 flex justify-center items-center selection:bg-blue-100 text-slate-800 bg-[#eef2f6]">
      <style>@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');</style>
      
      <div className="bg-white/50 md:backdrop-blur-3xl md:rounded-[32px] w-full max-w-[1400px] h-screen md:h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-none md:shadow-2xl ring-0 md:ring-1 ring-white/60">
        
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="flex-1 bg-[#f8fafc] w-full h-full overflow-hidden md:rounded-l-[32px] shadow-none md:shadow-[inset_4px_0_24px_rgba(0,0,0,0.02)] border-l border-white/50 relative flex flex-col pb-20 md:pb-0">
          
          {(loading || salesLoading || payoutsLoading) && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a73e8]"></div>
            </div>
          )}

          <div className="flex-1 h-full w-full overflow-hidden relative">
            {activeTab === 'inventory' && <Inventory inventory={inventory} />}
            
            {activeTab === 'dashboard' && (
              <div className="h-full w-full overflow-auto p-4 md:p-8">
                <PosDashboard 
                  inventory={inventory} carts={carts} activeCartId={activeCartId} setActiveCartId={setActiveCartId}
                  activeCart={activeCart} handleAddCart={handleAddCart} handleRemoveCart={handleRemoveCart} updateCartName={updateCartName}
                  addToCart={addToCart} updateQty={updateQty} cartTotal={cartTotal} onCheckout={handleCheckout} sales={sales}
                />
              </div>
            )}

            {activeTab === 'sales' && (
              <div className="h-full w-full overflow-auto p-4 md:p-8">
                <SalesHistory sales={sales} loading={salesLoading} onEditOrder={handleEditPastOrder} /> 
              </div>
            )}

            {/* PAYOUT CALCULATOR */}
            {activeTab === 'payout' && (
              <div className="h-full w-full overflow-auto p-4 md:p-8">
                <SupplierPayout 
                  inventory={inventory} 
                  payouts={payouts} 
                  onSavePayout={handleSavePayout} 
                  payoutToEdit={payoutToEdit}
                  clearEdit={() => setPayoutToEdit(null)}
                />
              </div>
            )}

            {/* PAYOUT HISTORY */}
            {activeTab === 'payoutHistory' && (
              <div className="h-full w-full overflow-auto p-4 md:p-8">
                <PayoutHistory payouts={payouts} loading={payoutsLoading} onEditPayout={handleEditPayout} />
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}