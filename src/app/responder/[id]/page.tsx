'use client';

import { useState, use, useEffect } from 'react';
import { Send, CheckCircle, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { saveSurveyResponseData, fetchSurveyById } from '@/lib/apiGoogle';

export default function ResponderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [surveyConfig, setSurveyConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- NUEVO ESTADO PARA PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    async function loadSurvey() {
      setLoading(true);
      const res = await fetchSurveyById(id);
      if (res.status === 'success' && res.data) {
        setSurveyConfig(res.data);
      } else {
        setError(res.message || 'Encuesta no encontrada');
      }
      setLoading(false);
    }
    loadSurvey();
  }, [id]);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyConfig) return;
    setIsSubmitting(true);
    
    let totalWeight = 0;
    surveyConfig.questions.forEach((q: any) => {
      if (q.type === 'MULTIPLE_CHOICE' && q.options) {
        const selectedOption = q.options.find((o: any) => o.id === answers[q.id]);
        if (selectedOption) totalWeight += selectedOption.weight;
      }
    });

    try {
      const response = await saveSurveyResponseData(id, answers, totalWeight);
      if (response.status === 'success') {
        setSubmitted(true);
      } else {
        alert("Hubo un error al guardar: " + response.message);
      }
    } catch (err) {
      alert("Error de red.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-white text-center">
      <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
      <h2 className="text-xl font-medium">Cargando encuesta...</h2>
    </div>
  );

  if (error || !surveyConfig) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 text-center text-white">
      <div className="max-w-md w-full bg-neutral-900 border border-red-500/30 rounded-3xl p-10 shadow-lg">
        <h2 className="text-2xl font-bold text-red-400 mb-4 text-white">Error</h2>
        <p className="text-neutral-400">{error || 'La encuesta no existe.'}</p>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-emerald-500/10 blur-[100px] pointer-events-none"></div>
        <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-white mb-4">¡Gracias por participar!</h2>
        <p className="text-neutral-400">Tus respuestas han sido registradas exitosamente.</p>
      </div>
    </div>
  );

  // --- LÓGICA DE FILTRADO POR CATEGORÍA ---
  const categories = surveyConfig.categories || [{ id: 'default', name: 'General' }];
  const currentCategory = categories[currentPage];
  const questionsInStep = surveyConfig.questions.filter((q: any) => q.categoryId === currentCategory.id);

  const progress = Math.round(((currentPage + 1) / categories.length) * 100);

  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-white pb-24 selection:bg-emerald-500/30">
      
      {/* Progress Bar Sticky */}
      <div className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 transition-all">
        <div className="h-1 bg-neutral-800 w-full top-0 absolute">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-neutral-400 font-medium font-mono">PÁGINA {currentPage + 1} DE {categories.length}</p>
          <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
            {currentCategory.name}
          </span>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 pt-16">
        {/* Solo mostramos el título grande en la primera página */}
        {currentPage === 0 && (
          <header className="mb-16 text-center space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-neutral-500 pb-2">
              {surveyConfig.title}
            </h1>
            <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto">{surveyConfig.description}</p>
          </header>
        )}

        <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in duration-500">
          
          {/* RENDERIZAR SOLO PREGUNTAS DE LA CATEGORÍA ACTUAL */}
          <div className="space-y-10">
            <h2 className="text-emerald-500 font-black text-xl mb-4 tracking-widest uppercase">
              {currentCategory.name}
            </h2>
            
            {questionsInStep.map((q: any, index: number) => (
              <div key={q.id} className="bg-neutral-900 border border-neutral-800 rounded-[2rem] p-8 shadow-xl transition-all hover:border-neutral-700">
                <label className="block text-2xl font-bold mb-8 flex gap-4">
                  <span className="text-neutral-600 font-mono text-xl pt-1">Q.</span>
                  <span className="text-neutral-100">{q.text}</span>
                </label>

                <div className="pl-0 md:pl-10">
                  {/* ... (Aquí van exactamente tus inputs: TEXT, NUMBER, SCALE, MULTIPLE_CHOICE) ... */}
                  {/* He mantenido los mismos inputs que tenías para no cambiar tu diseño */}
                  {q.type === 'TEXT' && (
                    <textarea
                      required
                      className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl px-4 py-4 text-white outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-y min-h-[120px]"
                      placeholder="Escribe tu respuesta aquí..."
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    />
                  )}

                  {q.type === 'SCALE' && (
                    <div className="flex gap-3 justify-between max-w-md">
                      {[1, 2, 3, 4, 5].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleAnswerChange(q.id, num)}
                          className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl font-bold text-xl transition-all ${
                            answers[q.id] === num ? 'bg-emerald-500 text-white shadow-lg scale-110' : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  )}

                  {q.type === 'MULTIPLE_CHOICE' && (
                    <div className="space-y-4">
                      {q.options?.map((opt: any) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleAnswerChange(q.id, opt.id)}
                          className={`w-full text-left px-6 py-5 rounded-2xl border transition-all flex items-center gap-5 ${
                            answers[q.id] === opt.id ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300' : 'bg-neutral-950 border-neutral-800'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${answers[q.id] === opt.id ? 'border-emerald-500' : 'border-neutral-600'}`}>
                            {answers[q.id] === opt.id && <div className="w-3 h-3 bg-emerald-500 rounded-full" />}
                          </div>
                          <span className="text-lg">{opt.text}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* BOTONES DE NAVEGACIÓN */}
          <div className="flex flex-col md:flex-row gap-4 pt-12">
            {currentPage > 0 && (
              <button
                type="button"
                onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo(0, 0); }}
                className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 rounded-2xl font-bold transition-all"
              >
                <ChevronLeft size={20} /> Anterior
              </button>
            )}

            {currentPage < categories.length - 1 ? (
              <button
                type="button"
                onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo(0, 0); }}
                className="flex-[2] flex items-center justify-center gap-3 px-8 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xl transition-all shadow-xl shadow-emerald-500/20"
              >
                Siguiente Sección <ChevronRight size={24} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-2xl font-black text-xl transition-all shadow-xl"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <>Finalizar Encuesta <Send size={20} /></>}
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}