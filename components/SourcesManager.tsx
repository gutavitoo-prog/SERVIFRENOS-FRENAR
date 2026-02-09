
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { ExternalSource, BrandConfig } from '../types';
import { Plus, Edit2, Trash2, Database, ShieldCheck, ShieldAlert, Key, UserCheck, ExternalLink } from 'lucide-react';
import { SearchService } from '../services/SearchService';

interface SourcesManagerProps {
  onUpdate: () => void;
  config: BrandConfig;
}

const SourcesManager: React.FC<SourcesManagerProps> = ({ onUpdate, config }) => {
  const [sources, setSources] = useState<ExternalSource[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<ExternalSource | null>(null);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    const data = await db.getAllExternalSources();
    setSources(data);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const source: ExternalSource = {
      id: editingSource?.id || crypto.randomUUID(),
      nombre: formData.get('nombre') as string,
      url_base: formData.get('url_base') as string,
      color_identificador: formData.get('color_identificador') as string,
      logo_path: formData.get('logo_path') as string,
      selector_precio_css: formData.get('selector_precio_css') as string,
      cookies_config: formData.get('cookies_config') as string,
      requires_login: formData.get('requires_login') === 'on',
      active: true
    };
    await db.saveExternalSource(source);
    await loadSources();
    onUpdate();
    setIsModalOpen(false);
    setEditingSource(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar esta fuente?')) {
      await db.deleteExternalSource(id);
      await loadSources();
      onUpdate();
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fuentes de Scraping</h1>
          <p className="text-gray-500">Gestor universal de scraping con sesiones independientes</p>
        </div>
        <button
          onClick={() => { setEditingSource(null); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex items-center gap-2 transition-all"
        >
          <Plus size={20} /> Nueva Fuente
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map(source => (
          <div key={source.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm overflow-hidden" style={{ backgroundColor: source.color_identificador }}>
                  {source.logo_path ? <img src={source.logo_path} className="w-full h-full object-cover" alt={source.nombre} /> : <Database size={24} />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{source.nombre}</h3>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase">
                    {source.active ? <ShieldCheck size={10} className="text-green-500" /> : <ShieldAlert size={10} className="text-gray-300" />}
                    {source.active ? 'Activa' : 'Inactiva'}
                    {source.requires_login && <span className="ml-2 bg-amber-50 text-amber-600 px-1 rounded">Login Req.</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingSource(source); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(source.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
              </div>
            </div>

            <div className="flex-1 space-y-2 mb-4">
              <div className="p-2 bg-gray-50 rounded-lg text-[10px] font-mono text-gray-500 truncate">{source.url_base}</div>
              <div className="p-2 bg-indigo-50 rounded-lg text-[10px] font-bold text-indigo-600 font-mono">Selector: {source.selector_precio_css}</div>
            </div>

            {source.requires_login && (
              <button 
                onClick={() => SearchService.manageSession(source)}
                className="w-full py-2 bg-amber-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-amber-600 transition-all text-xs"
              >
                <UserCheck size={14} /> Gestionar Sesión
              </button>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
              <Database className="text-indigo-600" size={20} />
              <h3 className="text-xl font-bold">Configurar Fuente Universal</h3>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Nombre del Proveedor</label>
                <input name="nombre" defaultValue={editingSource?.nombre} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">URL Base ([QUERY] para búsqueda)</label>
                <input name="url_base" placeholder="https://site.com/search?q=[QUERY]" defaultValue={editingSource?.url_base} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Selector CSS Precio</label>
                  <input name="selector_precio_css" placeholder=".main-price" defaultValue={editingSource?.selector_precio_css} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Color Identificador</label>
                  <input type="color" name="color_identificador" defaultValue={editingSource?.color_identificador || '#6366f1'} className="w-full h-11 rounded-xl cursor-pointer border-none bg-transparent" />
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-2xl border border-amber-100">
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-800">¿Requiere Inicio de Sesión?</p>
                  <p className="text-[10px] text-amber-600">Habilita Puppeteer para gestionar cookies persistentes.</p>
                </div>
                <input type="checkbox" name="requires_login" defaultChecked={editingSource?.requires_login} className="w-5 h-5 accent-amber-500" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2"><Key size={12} /> Cookies Manuales (Opcional)</label>
                <textarea name="cookies_config" defaultValue={editingSource?.cookies_config} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs h-20 resize-none" placeholder="session_id=...; auth=..." />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">Guardar Proveedor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SourcesManager;
