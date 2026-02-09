
import React, { useState, useRef } from 'react';
import { BrandConfig } from '../types';
import { Save, Upload, CheckCircle2, RefreshCw } from 'lucide-react';

interface SettingsProps {
  config: BrandConfig;
  onSave: (config: BrandConfig) => void;
}

const Settings: React.FC<SettingsProps> = ({ config, onSave }) => {
  const [formData, setFormData] = useState<BrandConfig>(config);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsSaved(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
        setIsSaved(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-800">Personalización de Marca</h1>
        <p className="text-gray-500">Configura el logo y los colores corporativos de tu sistema</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <h3 className="text-lg font-bold text-gray-800">Identidad Visual</h3>
            
            {/* Logo Upload Section */}
            <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="relative group">
                <img 
                  src={formData.logo} 
                  className="w-24 h-24 rounded-xl object-cover border-2 border-white shadow-md bg-white" 
                  alt="Logo preview" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 text-white flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Upload size={20} />
                </button>
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-gray-700">Logo del Negocio</p>
                <p className="text-xs text-gray-400 mb-3">Recomendado: Cuadrado (200x200px)</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleLogoUpload} 
                  className="hidden" 
                  accept="image/*"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  Subir imagen desde mi equipo
                </button>
              </div>
            </div>

            {/* Color Picker Section */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Color Principal</label>
                <div className="flex gap-3 items-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <input
                    type="color"
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={handleChange}
                    className="w-10 h-10 rounded cursor-pointer border-none bg-transparent"
                  />
                  <input 
                    type="text" 
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={handleChange}
                    className="flex-1 bg-transparent text-sm font-mono outline-none" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Color Secundario</label>
                <div className="flex gap-3 items-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <input
                    type="color"
                    name="secondaryColor"
                    value={formData.secondaryColor}
                    onChange={handleChange}
                    className="w-10 h-10 rounded cursor-pointer border-none bg-transparent"
                  />
                  <input 
                    type="text" 
                    name="secondaryColor"
                    value={formData.secondaryColor}
                    onChange={handleChange}
                    className="flex-1 bg-transparent text-sm font-mono outline-none" 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre Comercial</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 text-white rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
            style={{ backgroundColor: formData.primaryColor, boxShadow: `0 10px 15px -3px ${formData.primaryColor}33` }}
          >
            {isSaved ? <CheckCircle2 size={20} /> : <Save size={20} />}
            {isSaved ? '¡Guardado!' : 'Guardar Configuración'}
          </button>
        </form>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-6 flex items-center gap-2">
              <RefreshCw size={12} />
              Vista Previa en Tiempo Real
            </h3>
            
            {/* Mock UI Preview */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-inner">
              <div className="h-8 border-b border-gray-100 bg-gray-50 flex items-center px-3 gap-1">
                <div className="w-2 h-2 rounded-full bg-red-300" />
                <div className="w-2 h-2 rounded-full bg-yellow-300" />
                <div className="w-2 h-2 rounded-full bg-green-300" />
              </div>
              <div className="p-4 flex flex-col items-center gap-4 bg-white">
                <img src={formData.logo} className="w-12 h-12 rounded-lg object-cover shadow-sm" alt="Preview" />
                <div className="text-center">
                  <p className="font-bold text-sm" style={{ color: formData.primaryColor }}>{formData.name}</p>
                  <p className="text-[10px] text-gray-400">Panel de Administración</p>
                </div>
                <div className="w-full h-8 rounded-lg animate-pulse" style={{ backgroundColor: `${formData.primaryColor}22` }} />
                <div className="w-full flex gap-2">
                   <div className="flex-1 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: formData.primaryColor }}>Botón</div>
                   <div className="flex-1 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: formData.secondaryColor }}>Botón</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-3xl text-white">
             <h4 className="text-xs font-bold uppercase mb-2 text-gray-400">Nota técnica</h4>
             <p className="text-[11px] leading-relaxed text-gray-300">
               Los colores se aplican mediante variables CSS nativas. Los navegadores modernos en la red LAN cargarán estos estilos instantáneamente desde el almacenamiento local.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
