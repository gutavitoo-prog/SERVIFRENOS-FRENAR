
import React, { useState } from 'react';
import { BrandConfig } from '../types';
import { Save, Image as ImageIcon } from 'lucide-react';

interface SettingsProps {
  config: BrandConfig;
  onSave: (config: BrandConfig) => void;
}

const Settings: React.FC<SettingsProps> = ({ config, onSave }) => {
  const [formData, setFormData] = useState<BrandConfig>(config);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    alert('Configuración guardada correctamente');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-800">Configuración de Marca</h1>
        <p className="text-gray-500">Personaliza la apariencia y datos de tu sistema POS</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Información General</h3>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre del Negocio</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Moneda (Simbolo)</label>
                <input
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">URL del Logo</label>
                <input
                  name="logo"
                  value={formData.logo}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pie de Ticket</label>
              <textarea
                name="receiptFooter"
                value={formData.receiptFooter}
                onChange={handleChange}
                rows={3}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Identidad Visual</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Color Primario</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={handleChange}
                    className="w-12 h-12 rounded-lg cursor-pointer border-none"
                  />
                  <span className="text-sm font-mono text-gray-500">{formData.primaryColor}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Color Secundario</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    name="secondaryColor"
                    value={formData.secondaryColor}
                    onChange={handleChange}
                    className="w-12 h-12 rounded-lg cursor-pointer border-none"
                  />
                  <span className="text-sm font-mono text-gray-500">{formData.secondaryColor}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Guardar Cambios
          </button>
        </form>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Previsualización</h3>
            <div className="border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-4">
              <img src={formData.logo} className="w-16 h-16 rounded-xl object-cover shadow-sm" alt="Preview" />
              <div className="text-center">
                <p className="font-bold text-lg" style={{ color: formData.primaryColor }}>{formData.name}</p>
                <div className="flex gap-2 mt-2">
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: formData.primaryColor }}></div>
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: formData.secondaryColor }}></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-600 p-6 rounded-3xl text-white">
            <h4 className="font-bold mb-2">Optimización LAN</h4>
            <p className="text-sm text-indigo-100 leading-relaxed">
              Este sistema está diseñado para funcionar en red local. Asegúrate de que el servidor (esta máquina) tenga una IP estática para que otras estaciones puedan acceder vía navegador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
