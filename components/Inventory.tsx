
import React, { useState } from 'react';
import { Product, BrandConfig } from '../types';
import { Plus, Edit2, Trash2, Search, PackageX } from 'lucide-react';
import { db } from '../db';

interface InventoryProps {
  products: Product[];
  onUpdate: () => void;
  config: BrandConfig;
}

const Inventory: React.FC<InventoryProps> = ({ products, onUpdate, config }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

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
    };
    await db.saveProduct(product);
    onUpdate();
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      await db.deleteProduct(id);
      onUpdate();
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Inventario</h1>
          <p className="text-gray-500">Administra tus productos y niveles de stock</p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2 transition-all"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Filtrar por nombre..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Precio</th>
                <th className="px-6 py-4">Costo</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm">{p.code}</td>
                  <td className="px-6 py-4 font-medium">{p.name}</td>
                  <td className="px-6 py-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{p.category}</span></td>
                  <td className="px-6 py-4 font-bold text-indigo-600">{config.currency}{p.price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-400">{config.currency}{p.cost.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.stock < 10 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      {p.stock} unid.
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="text-gray-400 hover:text-indigo-600 p-1"><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <PackageX size={48} className="opacity-20" />
                      No se encontraron productos
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
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
