'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Database, Loader2, Link as LinkIcon, RefreshCw, Trash2, Plus, ChevronRight, BarChart3, ArrowLeft, ClipboardCheck } from 'lucide-react';
import { fetchDashboardData, deleteSurveyById } from '@/lib/apiGoogle';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';

// --- NUEVO: Componente para mostrar el número y porcentaje al pasar el ratón ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-neutral-900 border border-neutral-700 p-3 rounded-lg shadow-xl">
        <p className="text-white font-medium mb-1">{label}</p>
        <p className="text-indigo-400 font-bold">
          Votos: {data.votos} <span className="text-neutral-400 text-sm font-normal">({data.porcentaje}%)</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const router = useRouter();
  const username = useUserStore(state => state.username);
  
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ surveys: any[], responses: any[] }>({ surveys: [], responses: [] });
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && username !== 'Admin!') router.replace('/login');
  }, [username, router, mounted]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchDashboardData();
      if (res.status === 'success' && res.data) setData(res.data);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (mounted && username === 'Admin!') loadData();
  }, [username, mounted]);

  // --- LÓGICA DE ESTADÍSTICAS (Ahora con porcentajes) ---
  const selectedSurvey = data.surveys.find(s => s.id === selectedSurveyId);
  const filteredResponses = data.responses.filter(r => String(r.surveyId) === String(selectedSurveyId));

  const getQuestionStats = () => {
    if (!selectedSurvey || !selectedSurvey.questions) return [];
    
    return selectedSurvey.questions.map((q: any, qIdx: number) => {
      const questionTitle = q.text || q.title || `Pregunta ${qIdx + 1}`;
      const rawOptions = Array.isArray(q.options) ? q.options : [];
      let optionsList = rawOptions.map((opt : any) => typeof opt === 'object' && opt.text ? opt.text : String(opt));

      if (optionsList.length === 0) {
        const uniqueAnswers = new Set<string>();
        filteredResponses.forEach(r => {
          let userAnswers = r.answers;
          if (typeof userAnswers === 'string') {
            try { userAnswers = JSON.parse(userAnswers); } catch { return; }
          }
          if (userAnswers && typeof userAnswers === 'object' && userAnswers[q.id]) {
            uniqueAnswers.add(String(userAnswers[q.id]));
          }
        });
        optionsList = Array.from(uniqueAnswers).sort();
      }
      
      let totalVotesForQuestion = 0;

      const optionsStats = optionsList.map((optText: string, index: number) => {
        const votes = filteredResponses.filter(r => {
          let userAnswers = r.answers;
          if (typeof userAnswers === 'string') {
            try { userAnswers = JSON.parse(userAnswers); } catch { return false; }
          }
          if (!userAnswers || typeof userAnswers !== 'object') return false;

          let answerValue = userAnswers[q.id];
          if (answerValue === undefined || answerValue === null) return false;

          const valStr = String(answerValue).trim().toLowerCase();
          const optStr = String(optText).trim().toLowerCase();
          const optId = typeof rawOptions[index] === 'object' && rawOptions[index].id ? String(rawOptions[index].id).toLowerCase() : null;
          
          const isExactMatch = valStr === optStr;
          const isIdMatch = optId && valStr === optId;
          const isIndexMatch = valStr === String(index + 1) || valStr === String(index);

          return isExactMatch || isIdMatch || isIndexMatch;
        }).length;
        
        totalVotesForQuestion += votes;
        return { name: optText, votos: votes };
      });

      // Calculamos el porcentaje
      const statsWithPercentages = optionsStats.map(stat => ({
        ...stat,
        porcentaje: totalVotesForQuestion > 0 
          ? ((stat.votos / totalVotesForQuestion) * 100).toFixed(1) 
          : "0"
      }));

      return { title: questionTitle, stats: statsWithPercentages, totalVotes: totalVotesForQuestion };
    });
  };

  const handleCopy = (id: string) => {
    const url = `${window.location.origin}/responder/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar esta encuesta?')) {
      await deleteSurveyById(id);
      loadData();
    }
  };

  if (!mounted || username !== 'Admin!') return null;

  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#22c55e', '#f59e0b'];

  return (
    <div className="min-h-screen bg-neutral-950 text-white pt-24 pb-12 px-6 font-sans">
      <main className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-neutral-800 pb-8">
          {selectedSurveyId ? (
            <button onClick={() => setSelectedSurveyId(null)} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-all">
              <ArrowLeft size={20} /> <span className="font-bold">Volver al Panel de estadisticas</span>
            </button>
          ) : (
            <div>
              <h1 className="text-3xl font-black flex items-center gap-3 ">
                <Database className="text-indigo-500" size={32} /> Estadisticas de Encuestas
              </h1>
              <p className="text-neutral-500 text-sm mt-1 uppercase tracking-widest font-bold">Estadisticas</p>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <button onClick={loadData} className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400">
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <Link href="/builder" className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-black flex items-center gap-2">
              <Plus size={18} /> NUEVA
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>
        ) : !selectedSurveyId ? (
          /* --- LISTADO DE CARDS --- */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.surveys.map(s => {
              const count = data.responses.filter(r => String(r.surveyId) === String(s.id)).length;
              return (
                <div key={s.id} className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl hover:border-indigo-500/50 transition-all group flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-500"><BarChart3 size={20} /></div>
                      <div className="flex gap-1">
                        <button onClick={() => handleCopy(s.id)} className="p-2 bg-neutral-800 rounded-lg text-neutral-400 hover:text-emerald-500 transition-colors">
                          {copiedId === s.id ? <ClipboardCheck size={16} /> : <LinkIcon size={16} />}
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-2 bg-neutral-800 rounded-lg text-neutral-400 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-1 truncate">{s.title || 'Sin Título'}</h3>
                    <p className="text-xs text-neutral-500 font-mono mb-4">ID: {s.id}</p>
                    <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black w-fit uppercase tracking-tighter">
                      {count} Respuestas Recibidas
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedSurveyId(s.id)}
                    className="mt-6 w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    Ver Estadísticas <ChevronRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          /* --- ESTADÍSTICAS INDIVIDUALES --- */
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-neutral-900 border border-indigo-500/30 p-8 rounded-3xl relative overflow-hidden">
               <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-600/10 blur-3xl rounded-full" />
               <h2 className="text-4xl font-black text-white">{selectedSurvey?.title}</h2>
               <p className="text-indigo-400 font-bold mt-2 flex items-center gap-2">
                 <Users size={18} /> Mostrando resultados para {filteredResponses.length} participantes
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {getQuestionStats().map((q, idx) => (
                <div key={idx} className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl">
                  <h4 className="font-bold text-neutral-400 mb-8 uppercase text-[10px] tracking-[0.2em] border-l-2 border-indigo-500 pl-4">{q.title}</h4>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={q.stats} layout="vertical" margin={{ left: 10, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" stroke="#737373" fontSize={10} width={100} tickFormatter={(val) => val.length > 15 ? `${val.substring(0,15)}...` : val} />
                        
                        {/* AQUÍ SE USA EL TOOLTIP NUEVO */}
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                        
                        <Bar dataKey="votos" radius={[0, 4, 4, 0]} barSize={25}>
                          {q.stats.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}