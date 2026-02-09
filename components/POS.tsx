
import React, { useState, useMemo, useRef } from 'react';
import { Product, SaleItem, BrandConfig, Sale } from '../types';
// Fixed: Added ShoppingCart to the list of icons imported from lucide-react
import { Search, Trash2, Plus, Minus, Printer, CreditCard, Banknote, Landmark, ShoppingCart } from 'lucide-react';
import { db } from '../db';

interface POSProps {
  products: Product[];
  onSaleComplete: () => void;
  config: BrandConfig;
}

const POS: React.FC<POSProps> = ({ products, onSaleComplete, config }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('cash');
  const printRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const finalizeSale = async () => {
    if (cart.length === 0) return;

    const newSale: Sale = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      items: [...cart],
      total,
      paymentMethod
    };

    await db.saveSale(newSale);
    
    // Print logic
    window.print();
    
    setCart([]);
    onSaleComplete();
  };

  return (
    <div className="flex h-full gap-6">
      <div className="flex-1 flex flex-col gap-6 no-print">
        <div className="relative">
          < Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar producto por nombre o código..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={product.stock <= 0}
              className={`bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left flex flex-col ${product.stock <= 0 ? 'opacity-50 grayscale' : ''}`}
            >
              <img src={product.image || `https://picsum.photos/seed/${product.id}/200`} className="w-full h-32 object-cover rounded-xl mb-3" />
              <p className="font-bold text-gray-800 line-clamp-1">{product.name}</p>
              <p className="text-xs text-gray-400 mb-2">Ref: {product.code}</p>
              <div className="mt-auto flex justify-between items-center">
                <span className="text-lg font-bold text-indigo-600">{config.currency}{product.price.toLocaleString()}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${product.stock > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  Stock: {product.stock}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="w-96 bg-white border border-gray-200 rounded-2xl shadow-lg flex flex-col no-print">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Carrito de Venta</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
              <ShoppingCart size={48} className="opacity-20" />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-3 items-center p-2 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-800 line-clamp-1">{item.name}</p>
                  <p className="text-xs text-gray-400">{config.currency}{item.price.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-200 rounded"><Minus size={14} /></button>
                  <span className="w-8 text-center font-bold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-200 rounded"><Plus size={14} /></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-gray-50 rounded-b-2xl border-t border-gray-200">
          <div className="mb-4 space-y-2">
            <p className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{config.currency}{(total * 0.82).toLocaleString()}</span>
            </p>
            <p className="flex justify-between text-gray-600">
              <span>IVA (18%)</span>
              <span>{config.currency}{(total * 0.18).toLocaleString()}</span>
            </p>
            <p className="flex justify-between text-2xl font-bold text-gray-800 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>{config.currency}{total.toLocaleString()}</span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            <PaymentBtn active={paymentMethod === 'cash'} onClick={() => setPaymentMethod('cash')} icon={<Banknote size={20} />} label="Efectivo" />
            <PaymentBtn active={paymentMethod === 'card'} onClick={() => setPaymentMethod('card')} icon={<CreditCard size={20} />} label="Tarjeta" />
            <PaymentBtn active={paymentMethod === 'transfer'} onClick={() => setPaymentMethod('transfer')} icon={<Landmark size={20} />} label="Transf." />
          </div>

          <button
            onClick={finalizeSale}
            disabled={cart.length === 0}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:shadow-none"
          >
            <Printer size={20} />
            Finalizar e Imprimir
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div className="print-only p-4 text-center text-sm w-[80mm]">
        <img src={config.logo} className="w-20 mx-auto mb-2 grayscale" />
        <h1 className="text-xl font-bold uppercase">{config.name}</h1>
        <p className="text-xs mb-4">Ticket de Venta #{Math.floor(Math.random() * 1000000)}</p>
        <div className="border-t border-b border-black py-2 my-2 text-left">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between py-1">
              <span>{item.quantity}x {item.name}</span>
              <span>{config.currency}{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="text-right font-bold text-lg mb-4">
          Total: {config.currency}{total.toLocaleString()}
        </div>
        <p className="text-xs mb-2">Método: {paymentMethod === 'cash' ? 'Efectivo' : paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}</p>
        <p className="mt-4">{config.receiptFooter}</p>
        <p className="text-[10px] mt-2">{new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

const PaymentBtn = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'}`}
  >
    {icon}
    <span className="text-[10px] uppercase font-bold">{label}</span>
  </button>
);

export default POS;
