
import React from 'react';
import { Sale, BrandConfig } from '../types';
import { Calendar, CreditCard, Banknote, Landmark, Eye } from 'lucide-react';

interface SalesHistoryProps {
  sales: Sale[];
  config: BrandConfig;
}

const SalesHistory: React.FC<SalesHistoryProps> = ({ sales, config }) => {
  const sortedSales = [...sales].sort((a, b) => b.timestamp - a.timestamp);

  const getPaymentIcon = (method: Sale['paymentMethod']) => {
    switch (method) {
      case 'cash': return <Banknote className="text-green-500" size={16} />;
      case 'card': return <CreditCard className="text-blue-500" size={16} />;
      case 'transfer': return <Landmark className="text-purple-500" size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-800">Historial de Ventas</h1>
        <p className="text-gray-500">Consulta todas las transacciones realizadas</p>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">ID Venta</th>
              <th className="px-6 py-4">Fecha y Hora</th>
              <th className="px-6 py-4">Artículos</th>
              <th className="px-6 py-4">Pago</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedSales.map(sale => (
              <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-gray-400">#{sale.id.slice(0, 8)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={14} className="text-gray-400" />
                    {new Date(sale.timestamp).toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-gray-100 px-2 py-1 rounded-full text-xs font-medium">
                    {sale.items.length} prod. ({sale.items.reduce((a, b) => a + b.quantity, 0)} unid.)
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm capitalize">
                    {getPaymentIcon(sale.paymentMethod)}
                    {sale.paymentMethod}
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-indigo-600">
                  {config.currency}{sale.total.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-gray-400 hover:text-indigo-600">
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  Aún no hay ventas registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesHistory;
