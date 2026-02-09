import React, { useState, useMemo } from 'react';
import { Product, BrandConfig } from '../types';
import { Plus, Edit2, Trash2, PackageX, Filter, Search as SearchIcon } from 'lucide-react';
import { db } from '../db';

interface InventoryProps {
  products: Product[];
  onUpdate: () => void;
  config: BrandConfig;
}

interface ColumnFilters {
  code: string;
  name: string;
  category: string;
  price: string;
  stock: string;
}

const Inventory: React.FC<InventoryProps> = ({ products, onUpdate, config }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filters, setFilters] = useState<ColumnFilters>({
    code: '',
    name: '',
    category: '',
    price: '',
    stock: ''
  });

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCode = p.code.toLowerCase().includes(filters.code.toLowerCase());
      const matchName = p.name.toLowerCase().includes(filters.name.toLowerCase());
      const matchCat = p.category.toLowerCase().includes(filters.category.toLowerCase());
      
      // Filtro de precio (ej: "> 100" o "100")
      let matchPrice = true;
      if (filters.price) {
        // Fix: Removed || 0 to ensure matchPrice remains a boolean
        if (filters.price.startsWith('>')) matchPrice = p.price > parseFloat(filters.price.slice(1));
        else if (filters.price.startsWith('<')) matchPrice = p.price < parseFloat(filters.price.slice(1));
        else matchPrice = p.price.toString().includes(filters.price);
      }

      // Filtro de stock
      let matchStock = true;
      if (filters.stock) {
        // Fix: Removed || 0 to ensure matchStock remains a boolean
        if (filters.stock.startsWith('>')) matchStock = p.stock > parseInt(filters.stock.slice(1));
        else if (filters.stock.startsWith('<')) matchStock = p.stock < parseInt(filters.stock.slice(1));
        else matchStock = p.stock.toString().includes(filters.stock);
      }

      return matchCode && matchName && matchCat && matchPrice && matchStock;
    });
  }, [products, filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const product: Product = {
      id: editingProduct?.id || crypto.randomUUID(),
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      price: Number(formData.get('price')),
      cost: Number(formData.get('cost')),
      stock: Number(formData.get('stock')),
      category: formData.get('category') as string,
      source: 'local'
    };
    await db.saveProduct(product);
    onUpdate();
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar producto?')) {
      await db.deleteProduct(id);
      onUpdate();
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventario Inteligente</h1>
          <p className="text-gray-500">Usa los encabezados para filtrar de forma avanzada</p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex items-center gap-2 transition-all"
        >
          <Plus size={20} /> Nuevo Producto
        </button>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4">
                  <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">SKU</span>
                  <input name="code" value={filters.code} onChange={handleFilterChange} placeholder="Filtrar..." className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500" />
                </th>
                <th className="px-6 py-4">
                  <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Nombre</span>
                  <input name="name" value={filters.name} onChange={handleFilterChange} placeholder="Filtrar..." className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500" />
                </th>
                <th className="px-6 py-4">
                  <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Categoría</span>
                  <input name="category" value={filters.category} onChange={handleFilterChange} placeholder="Filtrar..." className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500" />
                </th>
                <th className="px-6 py-4">
                  <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Precio</span>
                  <input name="price" value={filters.price} onChange={handleFilterChange} placeholder="Ej: >100" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500" />
                </th>
                <th className="px-6 py-4">
                  <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Stock</span>
                  <input name="stock" value={filters.stock} onChange={handleFilterChange} placeholder="Ej: <10" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500" />
                </th>
                <th className="px-6 py-4 text-right">
                  <Filter size={16} className="text-gray-300 ml-auto" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm">{p.code}</td>
                  <td className="px-6 py-4 font-medium text-gray-700">{p.name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-md text-[10px] font-bold uppercase">{p.category}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-indigo-600">{config.currency}{p.price.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${p.stock < 10 ? 'bg-red-500' : 'bg-green-500'}`} />
                      <span className="text-sm font-semibold">{p.stock}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <PackageX className="mx-auto mb-4 opacity-10" size={64} />
                    <p className="text-gray-400 font-medium">No se encontraron productos con esos filtros</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-bold">{editingProduct ? 'Editar' : 'Nuevo'} Producto</h3>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Código / SKU</label>
                  <input name="code" defaultValue={editingProduct?.code} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Categoría</label>
                  <input name="category" defaultValue={editingProduct?.category} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Nombre</label>
                <input name="name" defaultValue={editingProduct?.name} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Costo</label>
                  <input name="cost" type="number" step="0.01" defaultValue={editingProduct?.cost} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Precio</label>
                  <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Stock</label>
                  <input name="stock" type="number" defaultValue={editingProduct?.stock} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;