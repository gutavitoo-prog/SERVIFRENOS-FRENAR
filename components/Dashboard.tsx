
import React from 'react';
import { Product, Sale, BrandConfig } from '../types';
import { TrendingUp, Package, ShoppingBag, DollarSign } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend 
} from 'recharts';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
  config: BrandConfig;
}

const Dashboard: React.FC<DashboardProps> = ({ products, sales, config }) => {
  const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);
  const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
  const lowStockCount = products.filter(p => p.stock < 10).length;

  // Prepare chart data
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const chartData = last7Days.map(date => {
    const daySales = sales.filter(s => new Date(s.timestamp).toISOString().split('T')[0] === date);
    return {
      date: date.split('-').slice(2).join('/'),
      total: daySales.reduce((acc, s) => acc + s.total, 0)
    };
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-800">Bienvenido, {config.name}</h1>
        <p className="text-gray-500">Aquí tienes el resumen de hoy</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<DollarSign className="text-green-600" />} 
          label="Ingresos Totales" 
          value={`${config.currency}${totalRevenue.toLocaleString()}`} 
          color="bg-green-50"
        />
        <StatCard 
          icon={<ShoppingBag className="text-blue-600" />} 
          label="Ventas Realizadas" 
          value={sales.length.toString()} 
          color="bg-blue-50"
        />
        <StatCard 
          icon={<Package className="text-purple-600" />} 
          label="Stock Total" 
          value={totalStock.toString()} 
          color="bg-purple-50"
        />
        <StatCard 
          icon={<TrendingUp className="text-orange-600" />} 
          label="Bajo Stock" 
          value={lowStockCount.toString()} 
          color="bg-orange-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6">Ventas de los Últimos 7 Días</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill={config.primaryColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Productos con Bajo Stock</h3>
          <div className="space-y-4">
            {products.filter(p => p.stock < 10).slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">{p.name}</span>
                <span className="text-sm font-bold text-red-500">{p.stock} unidades</span>
              </div>
            ))}
            {lowStockCount === 0 && <p className="text-gray-400 text-center py-8">¡Buen trabajo! No hay stock bajo.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
    <div className={`${color} p-3 rounded-xl`}>{icon}</div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

export default Dashboard;
