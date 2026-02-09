
import React, { useState } from 'react';
import { db } from '../db';
import { Product, BrandConfig } from '../types';
import { Upload, CheckCircle2, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface BulkImportProps {
  onComplete: () => void;
  config: BrandConfig;
}

const BulkImport: React.FC<BulkImportProps> = ({ onComplete, config }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const results = XLSX.utils.sheet_to_json(sheet);
      setData(results);
      setLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  const processImport = async () => {
    setLoading(true);
    try {
      for (const row of data) {
        const product: Product = {
          id: crypto.randomUUID(),
          code: String(row.codigo || row.code || ''),
          name: String(row.nombre || row.name || ''),
          price: Number(row.precio || row.price || 0),
          cost: Number(row.costo || row.cost || 0),
          stock: Number(row.stock || 0),
          category: String(row.categoria || row.category || 'General'),
        };
        await db.saveProduct(product);
      }
      setStatus('success');
      onComplete();
    } catch (e) {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-800">Carga Masiva de Productos</h1>
        <p className="text-gray-500">Importa tus productos desde un archivo Excel (.xlsx)</p>
      </header>

      <div className="bg-white p-8 rounded-3xl shadow-sm border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-6">
        <div className="bg-indigo-50 p-6 rounded-full">
          <FileSpreadsheet className="text-indigo-600 w-12 h-12" />
        </div>
        
        <div className="text-center">
          <p className="text-lg font-medium">Selecciona tu archivo de Excel</p>
          <p className="text-sm text-gray-400">Columnas esperadas: codigo, nombre, precio, costo, stock, categoria</p>
        </div>

        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="bg-white border-2 border-indigo-600 text-indigo-600 px-8 py-3 rounded-xl font-bold cursor-pointer hover:bg-indigo-50 transition-all"
        >
          Explorar Archivos
        </label>
      </div>

      {data.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom duration-300">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <p className="font-bold text-gray-700">{data.length} productos detectados</p>
            <button
              onClick={processImport}
              disabled={loading}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Confirmar Importación'}
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs text-gray-400 uppercase font-bold sticky top-0">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.slice(0, 50).map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-sm">{row.codigo || row.code}</td>
                    <td className="px-4 py-3 text-sm font-medium">{row.nombre || row.name}</td>
                    <td className="px-4 py-3 text-sm">{config.currency}{(row.precio || row.price)}</td>
                    <td className="px-4 py-3 text-sm">{row.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length > 50 && <p className="p-4 text-center text-gray-400 text-xs italic">... y {data.length - 50} productos más</p>}
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 />
          ¡Importación completada con éxito!
        </div>
      )}
    </div>
  );
};

export default BulkImport;
