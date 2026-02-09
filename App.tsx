
import React, { useState, useEffect, useCallback } from 'react';
import { db } from './db';
import { Product, View, BrandConfig, Sale } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import SalesHistory from './components/SalesHistory';
import BulkImport from './components/BulkImport';
import Scraping from './components/Scraping';
import Settings from './components/Settings';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  History, 
  Upload, 
  Globe, 
  Settings as SettingsIcon 
} from 'lucide-react';

const DEFAULT_BRAND: BrandConfig = {
  name: 'NovaPOS',
  logo: 'https://picsum.photos/200/200',
  primaryColor: '#6366f1',
  secondaryColor: '#4f46e5',
  currency: '$',
  receiptFooter: '¡Gracias por su compra!'
};

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.DASHBOARD);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [config, setConfig] = useState<BrandConfig>(DEFAULT_BRAND);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    await db.init();
    const p = await db.getAllProducts();
    const s = await db.getAllSales();
    const c = await db.getConfig();
    setProducts(p);
    setSales(s);
    if (c) setConfig(c);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const updateConfig = async (newConfig: BrandConfig) => {
    await db.saveConfig(newConfig);
    setConfig(newConfig);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const renderView = () => {
    switch (view) {
      case View.DASHBOARD:
        return <Dashboard products={products} sales={sales} config={config} />;
      case View.POS:
        return <POS products={products} onSaleComplete={refreshData} config={config} />;
      case View.INVENTORY:
        return <Inventory products={products} onUpdate={refreshData} config={config} />;
      case View.SALES_HISTORY:
        return <SalesHistory sales={sales} config={config} />;
      case View.IMPORT:
        return <BulkImport onComplete={refreshData} config={config} />;
      case View.SCRAPING:
        return <Scraping onComplete={refreshData} config={config} />;
      case View.SETTINGS:
        return <Settings config={config} onSave={updateConfig} />;
      default:
        return <Dashboard products={products} sales={sales} config={config} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar currentView={view} setView={setView} config={config} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
