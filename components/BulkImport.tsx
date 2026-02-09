
import React, { useState } from 'react';
import { db } from '../db';
import { Product, BrandConfig } from '../types';
import { Upload, CheckCircle2, AlertTriangle, FileSpreadsheet, Download, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface BulkImportProps {
  onComplete: () => void;
  config: BrandConfig;
}

interface ValidationError {
  row: number;
  message: string;
}

const BulkImport: React.FC<BulkImportProps> = ({ onComplete, config }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const downloadTemplate = () => {
    const headers = [["SKU", "Nombre", "Categoría", "Precio_Costo", "Precio_Venta", "Stock_Actual", "ID_Externo"]];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    XLSX.writeFile(wb, "NovaPOS_Plantilla_Productos.xlsx");
  };

  const validateData = (rawData: any[]): { valid: any[], errors: ValidationError[] } => {
    const validRows: any[] = [];
    const foundErrors: ValidationError[] = [];

    rawData.forEach((row, index) => {
      const rowNum = index + 2; // +1 por header, +1 por index 0
      const missingFields = [];

      if (!row.SKU) missingFields.push("SKU");
      if (!row.Nombre) missingFields.push("Nombre");
      if (row.Precio_Venta === undefined || row.Precio_Venta === null) missingFields.push("Precio_Venta");
      
      if (missingFields.length > 0) {
        foundErrors.push({ 
          row: rowNum, 
          message: `Faltan campos obligatorios: ${missingFields.join(', ')}` 
        });
      } else {
        validRows.push(row);
      }
    });

    return { valid: validRows, errors: foundErrors };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrors([]);
    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const results = XLSX.utils.sheet_to_json(sheet);
      
      const { valid, errors: validationErrors } = validateData(results);
      setData(valid);
      setErrors(validationErrors);
      setLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  const processImport = async () => {
    if (data.length === 0) return;
    setLoading(true);
    try {
      for (const row of data) {
        const product: Product = {
          id: row.ID_Externo || crypto.randomUUID(),
          code: String(row.SKU),
          name: String(row.Nombre),
          price: Number(row.Precio_Venta),
          cost: Number(row.Precio_Costo || 0),
          stock: Number(row.Stock_Actual || 0),
          category: String(row.Categoría || 'General'),
        };
        await db.saveProduct(product);
      }
      setStatus('success');
      onComplete();
      setData([]);
    } catch (e) {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Carga Masiva</h1>
          <p className="text-gray-500">Importa tus productos desde un archivo Excel</p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 text-indigo-600 font-bold hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all"
        >
          <Download size={18} />
          Descargar Plantilla
        </button>
      </header>

      <div className="bg-white p-8 rounded-3xl shadow-sm border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-6">
        <div className="bg-indigo-50 p-6 rounded-full" style={{ backgroundColor: `${config.primaryColor}15` }}>
          <FileSpreadsheet className="w-12 h-12" style={{ color: config.primaryColor }} />
        </div>
        
        <div className="text-center">
          <p className="text-lg font-medium">Sube tu archivo .xlsx</p>
          <p className="text-sm text-gray-400">Verificaremos automáticamente que no falten datos.</p>
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
          className="bg-white border-2 px-8 py-3 rounded-xl font-bold cursor-pointer hover:bg-gray-50 transition-all"
          style={{ borderColor: config.primaryColor, color: config.primaryColor }}
        >
          Seleccionar Archivo
        </label>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
            <XCircle size={18} />
            Se encontraron {errors.length} errores de validación:
          </div>
          <ul className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
            {errors.map((err, i) => (
              <li key={i}>• Fila {err.row}: {err.message}</li>
            ))}
          </ul>
        </div>
      )}

      {data.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom duration-300">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <p className="font-bold text-gray-700">{data.length} productos listos para importar</p>
            <button
              onClick={processImport}
              disabled={loading}
              className="text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: config.primaryColor }}
            >
              {loading ? 'Procesando...' : 'Confirmar e Importar'}
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-400 uppercase font-bold sticky top-0">
                <tr>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Precio Venta</th>
                  <th className="px-4 py-3">Categoría</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-mono">{row.SKU}</td>
                    <td className="px-4 py-3 font-medium">{row.Nombre}</td>
                    <td className="px-4 py-3">{config.currency}{row.Precio_Venta}</td>
                    <td className="px-4 py-3">{row.Categoría}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 />
          ¡Importación completada! Los productos válidos han sido guardados.
        </div>
      )}
    </div>
  );
};

export default BulkImport;
