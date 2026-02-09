
import React from 'react';
import { View, BrandConfig } from '../types';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  History, 
  Upload, 
  Globe, 
  Settings as SettingsIcon,
  Database
} from 'lucide-react';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  config: BrandConfig;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, config }) => {
  const menuItems = [
    { id: View.DASHBOARD, label: 'Panel', icon: LayoutDashboard },
    { id: View.POS, label: 'Punto de Venta', icon: ShoppingCart },
    { id: View.INVENTORY, label: 'Inventario', icon: Package },
    { id: View.SALES_HISTORY, label: 'Ventas', icon: History },
    { id: View.IMPORT, label: 'Carga Masiva', icon: Upload },
    { id: View.SCRAPING, label: 'Extraer Web', icon: Globe },
    { id: View.SOURCES, label: 'Fuentes Externas', icon: Database },
    { id: View.SETTINGS, label: 'Configuración', icon: SettingsIcon },
  ];

  return (
    <div className="w-20 md:w-64 bg-white border-r border-gray-200 flex flex-col no-print">
      <div className="p-4 flex items-center gap-3 border-b border-gray-100">
        <img src={config.logo} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
        <span className="hidden md:block font-bold text-xl text-gray-800 truncate">{config.name}</span>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
              currentView === item.id 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <item.icon size={22} style={{ color: currentView === item.id ? config.primaryColor : undefined }} />
            <span className="hidden md:block font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 text-xs text-gray-400 text-center border-t border-gray-100">
        v1.0.0 Local POS
      </div>
    </div>
  );
};

export default Sidebar;
