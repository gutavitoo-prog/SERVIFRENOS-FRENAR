
import React, { useState } from 'react';
import { db } from '../db';
import { Product, BrandConfig } from '../types';
import { Globe, Sparkles, Loader2, Plus } from 'lucide-react';
import { extractProductsFromText } from '../geminiService';

interface ScrapingProps {
  onComplete: () => void;
  config: BrandConfig;
}

const Scraping: React.FC<ScrapingProps> = ({ onComplete, config }) => {
  const [rawText, setRawText] = useState('');
  const [extractedProducts, setExtractedProducts] = useState<Partial<Product>[]>([]);
  const [loading, setLoading] = useState(false);

  const handleExtract = async () => {
    if (!rawText.trim()) return;
    setLoading(true);
    try {
      const results = await extractProductsFromText(rawText);
      setExtractedProducts(results);
    } catch (e) {
      console.error(e);
      alert('Error extrayendo datos. Intenta con un fragmento más pequeño.');
    } finally {
      setLoading(false);
    }
  };

  const addToInventory = async (p: Partial<Product>) => {
    const newProduct: Product = {
      id: crypto.randomUUID(),
      code: p.code || `WEB-${Math.floor(Math.random() * 10000)}`,
      name: p.name || 'Sin nombre',
      price: p.price || 0,
      cost: 0,
      stock: 0,
      category: p.category || 'Importado',
      source: 'external' // MARCADO COMO EXTERNO
    };
    await db.saveProduct(newProduct);
    setExtractedProducts(prev => prev.filter(item => item !== p));
    onComplete();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-800">AI Product Scraper</h1>
        <p className="text-gray-500">Pega texto o código HTML de una web externa para extraer productos automáticamente.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <label className="block text-sm font-bold text-gray-500 mb-2 uppercase">Datos en Bruto (HTML/Texto)</label>
            <textarea
              className="w-full h-80 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
              placeholder="Copia y pega aquí la información de la web..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
            <button
              onClick={handleExtract}
              disabled={loading || !rawText}
              className="w-full mt-4 bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-100"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
              {loading ? 'Analizando con IA...' : 'Extraer Productos'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase">Productos Detectados</h3>
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm min-h-[300px] overflow-hidden">
            {extractedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-12 text-center gap-4 text-gray-400">
                <Globe size={48} className="opacity-10" />
                <p>Usa el panel de la izquierda para extraer productos.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {extractedProducts.map((p, i) => (
                  <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">{p.name}</p>
                      <div className="flex gap-4 text-xs text-gray-500 mt-1">
                        <span>Ref: {p.code || 'Auto'}</span>
                        <span className="font-bold text-indigo-600">{config.currency}{p.price}</span>
                        <span className="bg-indigo-50 text-indigo-600 px-1.5 rounded">{p.category}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => addToInventory(p)}
                      className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-all"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scraping;
