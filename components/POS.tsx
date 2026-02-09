
import React, { useState, useEffect, useCallback } from 'react';
import { Product, SaleItem, BrandConfig, Sale, ExternalSource, UnifiedSearchResult } from '../types';
import { Search, Trash2, Plus, Minus, Printer, ShoppingCart, Globe, Loader2, Star, ExternalLink, Zap, ZapOff, ShieldAlert, Key, Eye, Image as ImageIcon, Lock, Package, CheckCircle2, CreditCard, Banknote, Landmark, X } from 'lucide-react';
import { db } from '../db';
import { SearchService } from '../services/SearchService';

interface POSProps {
  products: Product[];
  onSaleComplete: () => void;
  config: BrandConfig;
  externalSources?: ExternalSource[];
  onToggleSearch: () => void;
}

type PaymentMethod = 'cash' | 'card' | 'transfer';

const POS: React.FC<POSProps> = ({ products, onSaleComplete, config, externalSources = [], onToggleSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [results, setResults] = useState<UnifiedSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  // Estados para el flujo de cobro
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');
  const [surcharge, setSurcharge] = useState(0); // Para recargo de tarjeta
  const [showTicket, setShowTicket] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const performSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setImageErrors({});
    try {
      const unifiedResults = await SearchService.search(searchTerm, products, config);
      setResults(unifiedResults);
    } catch (e) {
      console.error("Search failed", e);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, products, config]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) performSearch();
    }, 600);
    return () => clearTimeout(timer);
  }, [searchTerm, performSearch]);

  const addToCart = (result: UnifiedSearchResult) => {
    // Si es externo, creamos un objeto Producto temporal
    const cartId = result.tipo === 'local' ? result.id : `ext_${result.id}_${Date.now()}`;
    
    setCart(prev => {
      const existing = prev.find(item => item.id === cartId);
      if (existing) {
        return prev.map(item => item.id === cartId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      
      const newProduct: SaleItem = {
        id: cartId,
        code: result.sku || 'N/A',
        name: result.nombre,
        price: typeof result.precio === 'number' ? result.precio : 0,
        cost: 0,
        stock: result.stock || 0,
        category: 'Venta',
        image: result.image,
        quantity: 1,
        source: result.tipo
      };
      return [...prev, newProduct];
    });
  };

  const updateCartItem = (id: string, field: keyof SaleItem, value: any) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => (item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item)));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const finalTotal = selectedPayment === 'card' ? subtotal + surcharge : subtotal;

  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setSelectedPayment('cash');
    setSurcharge(subtotal * 0.15); // Default 15% recargo tarjeta
    setShowPaymentModal(true);
  };

  const finalizeSale = async () => {
    const newSale: Sale = { 
      id: crypto.randomUUID(), 
      timestamp: Date.now(), 
      items: [...cart], 
      total: finalTotal, 
      paymentMethod: selectedPayment 
    };
    
    await db.saveSale(newSale);
    setLastSale(newSale);
    setShowPaymentModal(false);
    setShowTicket(true);
  };

  const handlePrint = () => {
    window.print();
    setCart([]);
    setShowTicket(false);
    onSaleComplete();
  };

  const formatCurrency = (val: number | string) => {
    if (typeof val === 'string') return val;
    return val.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    });
  };

  const handleManualLogin = (res: UnifiedSearchResult) => {
    const source = externalSources.find(s => s.nombre === res.fuente);
    if (source) SearchService.manageSession(source);
  };

  return (
    <div className="flex h-full gap-6 relative">
      {/* Search and Results Section */}
      <div className="flex-1 flex flex-col gap-6 no-print">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 group">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${loading ? 'text-indigo-500 animate-pulse' : 'text-gray-400'}`} size={20} />
            <input
              type="text"
              placeholder={`Buscar en ${config.searchMode === 'local' ? 'Inventario Local' : 'Todo el Sistema'}...`}
              className="w-full pl-12 pr-12 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {loading && <div className="absolute right-4 top-1/2 -translate-y-1/2"><Loader2 size={20} className="animate-spin text-indigo-500" /></div>}
          </div>
          
          <button 
            onClick={onToggleSearch}
            className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all border ${config.searchMode === 'global' ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-100' : 'bg-white text-gray-600 border-gray-200'}`}
          >
            {config.searchMode === 'global' ? <Zap size={18} /> : <ZapOff size={18} />}
            <span className="hidden xl:inline tracking-tight">{config.searchMode === 'global' ? 'Búsqueda Global' : 'Solo Local'}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-5 pb-8">
          {results.map((res) => {
            const hasImageError = imageErrors[res.id];
            return (
              <div key={res.id} className={`bg-white rounded-3xl border shadow-sm overflow-hidden flex hover:shadow-xl transition-all duration-300 ${res.isBestPrice ? 'border-green-300 ring-1 ring-green-100' : 'border-gray-100'} ${res.status === 'requires_login' ? 'border-amber-400 ring-1 ring-amber-100 bg-amber-50/5' : ''}`}>
                <div className="w-40 md:w-56 bg-white flex-shrink-0 relative overflow-hidden group border-r border-gray-50 flex items-center justify-center">
                  {res.image && !hasImageError ? (
                    <img 
                      src={res.image} 
                      alt={res.nombre} 
                      className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                      onError={() => setImageErrors(prev => ({ ...prev, [res.id]: true }))}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-200 gap-2">
                      <Package size={56} className="opacity-40" />
                      <span className="text-[10px] font-bold text-gray-300 uppercase">Sin Imagen</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                     <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-md border-2 border-white" style={{ backgroundColor: res.color }}>
                        {res.logo ? <img src={res.logo} className="w-full h-full object-cover" /> : <Globe size={14} />}
                     </div>
                  </div>
                </div>

                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1 mb-1" style={{ color: res.color }}>{res.fuente}</p>
                    <a 
                      href={res.link !== '#' ? res.link : undefined} 
                      target="_blank" rel="noopener noreferrer" 
                      className="font-bold text-gray-900 text-lg md:text-xl leading-snug line-clamp-2 hover:text-indigo-600 transition-colors"
                    >
                      {res.nombre}
                    </a>
                  </div>

                  <div className="flex items-end justify-between mt-4">
                    <div className="flex flex-col">
                      {res.status === 'requires_login' ? (
                        <div className="flex items-center gap-2 text-amber-600 font-black bg-amber-100/50 px-3 py-1.5 rounded-lg border border-amber-200">
                          <Lock size={16} /> <span className="text-xs uppercase">🔒 Login Requerido</span>
                        </div>
                      ) : (
                        <span className="text-4xl font-black text-gray-900 tracking-tighter">
                          {formatCurrency(res.precio)}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-3">
                      {res.status === 'requires_login' ? (
                        <button onClick={() => handleManualLogin(res)} className="px-5 py-3 bg-amber-500 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-amber-600 shadow-lg shadow-amber-100 transition-all text-sm">
                          <Key size={16} /> Iniciar Sesión
                        </button>
                      ) : (
                        <button onClick={() => addToCart(res)} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-100">
                          <Plus size={22} /> AGREGAR
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-96 bg-white border border-gray-200 rounded-[2.5rem] shadow-2xl flex flex-col no-print border-l-4 border-l-indigo-500 overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-indigo-50/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
              <ShoppingCart size={20} />
            </div>
            <h2 className="text-xl font-black text-gray-800">Carrito</h2>
          </div>
          <span className="bg-white px-3 py-1 rounded-full text-xs font-black text-indigo-600 border border-indigo-100">
            {cart.reduce((a, b) => a + b.quantity, 0)} Items
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.map(item => (
            <div key={item.id} className="flex gap-4 items-center p-4 rounded-3xl bg-gray-50 border border-gray-100 group hover:border-indigo-200 transition-all">
              <div className="flex-1 space-y-2">
                {/* Nombre editable */}
                <input 
                  type="text" 
                  value={item.name}
                  onChange={(e) => updateCartItem(item.id, 'name', e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 p-0 font-black text-sm text-gray-800 outline-none"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Precio Unit.</span>
                  <input 
                    type="number"
                    value={item.price}
                    onChange={(e) => updateCartItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                    className="w-24 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-black text-indigo-600 outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
                <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-xl"><Minus size={14} /></button>
                <span className="w-6 text-center font-black text-sm text-gray-700">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-xl"><Plus size={14} /></button>
              </div>
              <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-8 bg-white border-t border-gray-100">
          <div className="mb-6 p-6 bg-gray-900 text-white rounded-[2rem] flex flex-col gap-1 shadow-2xl">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Subtotal</span>
            <div className="flex justify-between items-baseline">
              <span className="text-3xl font-black">{formatCurrency(subtotal)}</span>
              <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest">ARS</span>
            </div>
          </div>
          <button 
            onClick={handleOpenPayment} 
            disabled={cart.length === 0} 
            className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-xl hover:bg-indigo-700 disabled:opacity-30 transition-all flex items-center justify-center gap-3"
          >
            <Printer size={22} /> CONTINUAR A COBRO
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-xl p-10 space-y-8 animate-in zoom-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Método de Pago</h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200"><X size={24} /></button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'cash', label: 'Efectivo', icon: Banknote, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
                { id: 'card', label: 'Tarjeta', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                { id: 'transfer', label: 'Transferencia', icon: Landmark, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' }
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id as PaymentMethod)}
                  className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border-4 transition-all ${selectedPayment === method.id ? 'border-indigo-600 bg-indigo-50 shadow-xl' : 'border-transparent bg-gray-50'}`}
                >
                  <method.icon className={`mb-3 ${selectedPayment === method.id ? 'text-indigo-600' : method.color}`} size={32} />
                  <span className={`font-black text-sm uppercase tracking-tighter ${selectedPayment === method.id ? 'text-indigo-700' : 'text-gray-500'}`}>{method.label}</span>
                </button>
              ))}
            </div>

            {selectedPayment === 'card' && (
              <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2rem] space-y-3 animate-in slide-in-from-top">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-blue-800 uppercase tracking-widest">Recargo Financiero (15%)</span>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-blue-200 shadow-sm">
                    <span className="text-blue-600 font-black">$</span>
                    <input 
                      type="number"
                      value={surcharge}
                      onChange={(e) => setSurcharge(parseFloat(e.target.value) || 0)}
                      className="w-24 bg-transparent border-none outline-none font-black text-blue-900"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-blue-500 font-medium">Puedes editar el monto del recargo manualmente según las cuotas.</p>
              </div>
            )}

            <div className="p-8 bg-gray-900 rounded-[2rem] text-white space-y-4">
              <div className="flex justify-between items-center text-gray-400">
                <span className="text-xs font-bold uppercase tracking-widest">Subtotal</span>
                <span className="font-bold">{formatCurrency(subtotal)}</span>
              </div>
              {selectedPayment === 'card' && (
                <div className="flex justify-between items-center text-blue-400">
                  <span className="text-xs font-bold uppercase tracking-widest">Recargo</span>
                  <span className="font-bold">+ {formatCurrency(surcharge)}</span>
                </div>
              )}
              <div className="h-px bg-gray-800 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-xl font-black uppercase tracking-tighter">Total Final</span>
                <span className="text-4xl font-black text-indigo-400 tracking-tighter">{formatCurrency(finalTotal)}</span>
              </div>
            </div>

            <button 
              onClick={finalizeSale}
              className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-4"
            >
              <CheckCircle2 size={28} /> CONFIRMAR VENTA
            </button>
          </div>
        </div>
      )}

      {/* Ticket Preview Overlay */}
      {showTicket && lastSale && (
        <div className="fixed inset-0 bg-white z-[100] overflow-y-auto no-scrollbar">
          <div className="max-w-[400px] mx-auto p-12 bg-white flex flex-col items-center">
             <div className="text-center space-y-2 mb-8 no-print">
               <h2 className="text-2xl font-black">Venta Exitosa</h2>
               <p className="text-gray-500">Vista previa del ticket térmico</p>
             </div>
             
             {/* Thermal Receipt Body */}
             <div className="w-full border p-8 shadow-sm font-mono text-sm leading-tight text-black bg-white receipt-container">
                <div className="text-center mb-6 space-y-1">
                  <h3 className="text-xl font-bold uppercase tracking-tight">{config.name}</h3>
                  <p className="text-[10px]">{new Date(lastSale.timestamp).toLocaleString()}</p>
                  <p className="text-[10px] border-y border-dashed py-1">TICKET # {lastSale.id.slice(0, 8).toUpperCase()}</p>
                </div>

                <div className="space-y-3 mb-6">
                  {lastSale.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between gap-4">
                      <div className="flex-1">
                        <p className="uppercase">{item.name}</p>
                        <p className="text-[10px] text-gray-600">{item.quantity} x {formatCurrency(item.price)}</p>
                      </div>
                      <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed pt-4 space-y-1">
                  {lastSale.paymentMethod === 'card' && (
                    <div className="flex justify-between text-[10px]">
                      <span>RECARGO TARJETA</span>
                      <span>{formatCurrency(surcharge)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold">
                    <span>TOTAL</span>
                    <span>{formatCurrency(lastSale.total)}</span>
                  </div>
                  <p className="text-xs uppercase mt-2">FORMA DE PAGO: {lastSale.paymentMethod}</p>
                </div>

                <div className="mt-10 text-center space-y-4">
                  <p className="text-[10px] uppercase">{config.receiptFooter}</p>
                  <p className="text-[10px]">GRACIAS POR SU COMPRA</p>
                  <div className="w-full h-8 bg-black mt-2 opacity-5 flex items-center justify-center">
                    <span className="text-[8px] tracking-[1rem]">BARCODE SIM</span>
                  </div>
                </div>
             </div>

             <div className="mt-12 flex gap-4 w-full no-print">
               <button onClick={() => setShowTicket(false)} className="flex-1 py-4 border-2 border-gray-200 rounded-2xl font-black text-gray-500 hover:bg-gray-50">CERRAR</button>
               <button onClick={handlePrint} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 flex items-center justify-center gap-2">
                 <Printer size={20} /> IMPRIMIR TICKET
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Estilos para impresión y recibo */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .receipt-container, .receipt-container * { visibility: visible; }
          .receipt-container { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            border: none;
            padding: 0;
            box-shadow: none;
          }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default POS;
