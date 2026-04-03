'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Database, Loader2, Link as LinkIcon, RefreshCw, Trash2, Plus, ExternalLink, ClipboardCheck, Users } from 'lucide-react';
import { fetchDashboardData, deleteSurveyById } from '@/lib/apiGoogle';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const username = useUserStore(state => state.username);
  
  // --- ESTADOS DE CONTROL ---
  const [mounted, setMounted] = useState(false); // Para esperar al navegador
  const [loading, setLoading] = useState(true);  // Para la carga de la API
  const [data, setData] = useState<{ surveys: any[], responses: any[] }>({ surveys: [], responses: [] });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 1. EFECTO DE MONTAJE: Evita que el SSR (Servidor) intente adivinar el usuario
  useEffect(() => {
    setMounted(true);
  }, []);

  // 2. PROTECCIÓN DE RUTA: Solo actúa cuando el cliente está listo (mounted)
  useEffect(() => {
    if (mounted && username !== 'Admin!') {
      router.replace('/login');
    }
  }, [username, router, mounted]);

  // 3. CARGA DE DATOS DESDE GOOGLE SHEETS
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchDashboardData();
      if (res.status === 'success' && res.data) {
        setData(res.data);
      }
    } catch (error) {
      console.error("Error al conectar con la API:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && username === 'Admin!') {
      loadData();
    }
  }, [username, mounted]);

  // 4. FUNCIÓN PARA COPIAR LINKS
  const handleCopy = (id: string) => {
    const url = `${window.location.origin}/responder/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta encuesta? Los datos no se podrán recuperar.')) {
      await deleteSurveyById(id);
      loadData();
    }
  };

  // --- ESCUDO VISUAL: Mientras carga el LocalStorage o si no es admin ---
  if (!mounted || username !== 'Admin!') {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="animate-spin text-indigo-500" />
        <p className="text-neutral-500 text-sm animate-pulse">Verificando sesión...</p>
      </div>
    );
  }

  // Cálculos rápidos para las métricas
  const totalParticipants = data.responses.length;
  const totalSurveys = data.surveys.length;
  const avgWeight = totalParticipants > 0 
    ? Math.round(data.responses.reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0) / totalParticipants) 
    : 0;

  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#22c55e', '#f59e0b'];

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans pt-24 pb-12">
      <main className="max-w-6xl mx-auto px-6 space-y-8">
        
        {/* ENCABEZADO INTERNO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-8">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3">
              <Database className="text-indigo-500" size={32} /> Panel Admin
            </h1>
            <p className="text-neutral-500 text-sm mt-1">Gestión de encuestas </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/builder" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20">
              <Plus size={18} /> Nueva Encuesta
            </Link>
            <button onClick={loadData} disabled={loading} className="p-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-400 hover:text-white transition-all active:scale-95">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-neutral-900/20 rounded-3xl border border-neutral-800 border-dashed">
            <Loader2 size={40} className="animate-spin text-indigo-500 mb-4" />
            <p className="text-neutral-500">Sincronizando con la base de datos...</p>
          </div>
        ) : (
          <>
            {/* CARDS DE MÉTRICAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Respuestas</p>
                <p className="text-4xl font-black text-white">{totalParticipants}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Encuestas</p>
                <p className="text-4xl font-black text-white">{totalSurveys}</p>
              </div>
            </div>

            {/* LISTADO DE ENCUESTAS */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                <LinkIcon size={16} /> Enlaces Generados
              </h2>
              
              <div className="grid gap-4">
                {data.surveys.length > 0 ? (
                  data.surveys.map((s) => {
                    const count = data.responses.filter(r => r.surveyId === s.id).length;
                    return (
                      <div key={s.id} className="group bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex items-center justify-between hover:border-neutral-600 transition-all">
                        <div className="flex-1 truncate mr-4">
                          <h3 className="font-bold text-white text-lg truncate group-hover:text-indigo-400 transition-colors">{s.title || 'Encuesta sin título'}</h3>
                          <div className="flex items-center gap-4 mt-1">
                             <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                               <Users size={12}/> {count} completadas
                             </span>
                             <span className="text-[10px] text-neutral-600 font-mono bg-black px-2 py-0.5 rounded uppercase">ID: {s.id}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleCopy(s.id)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                              copiedId === s.id ? 'bg-emerald-500/20 text-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            }`}
                          >
                            {copiedId === s.id ? <ClipboardCheck size={14} /> : <LinkIcon size={14} />}
                            {copiedId === s.id ? '¡Copiado!' : 'Copiar Link'}
                          </button>
                          
                          <Link href={`/responder/${s.id}`} target="_blank" className="p-2.5 bg-neutral-800 text-neutral-400 hover:text-white rounded-xl transition-all">
                            <ExternalLink size={18} />
                          </Link>

                          <button onClick={() => handleDelete(s.id)} className="p-2.5 text-neutral-700 hover:text-red-500 transition-all">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 bg-neutral-900/50 border border-dashed border-neutral-800 rounded-3xl">
                    <p className="text-neutral-600">No hay encuestas activas.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}