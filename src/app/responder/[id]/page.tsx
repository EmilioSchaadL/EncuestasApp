'use client';

import { useState, use, useEffect } from 'react';
import { Send, CheckCircle, Loader2 } from 'lucide-react';
import { saveSurveyResponseData, fetchSurveyById } from '@/lib/apiGoogle';

export default function ResponderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [surveyConfig, setSurveyConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    
    // Calcular peso total
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
      alert("Error de red intentando comunicarse con Google Sheets.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
        <h2 className="text-xl font-medium">Cargando encuesta...</h2>
      </div>
    );
  }

  if (error || !surveyConfig) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-neutral-900 border border-red-500/30 rounded-3xl p-10 shadow-lg border-2">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-neutral-400">{error || 'La encuesta no existe o ha sido eliminada.'}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-emerald-500/10 blur-[100px] pointer-events-none"></div>
          <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">¡Gracias por participar!</h2>
          <p className="text-neutral-400 mb-8">Tus respuestas han sido registradas exitosamente.</p>
        </div>
      </div>
    );
  }

  const progress = Math.round((Object.keys(answers).length / surveyConfig.questions.length) * 100);

  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-white pb-24 selection:bg-emerald-500/30">
      {/* Progress Bar Header */}
      <div className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 transition-all">
        <div className="h-1 bg-neutral-800 w-full top-0 absolute">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-neutral-400 font-medium">Progreso: {progress}%</p>
          <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            Modo Público
          </span>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 pt-16">
        <header className="mb-16 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-neutral-500 pb-2">
            {surveyConfig.title}
          </h1>
          <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto">{surveyConfig.description}</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in zoom-in-95 duration-700 delay-150 fill-mode-both">
          {surveyConfig.questions.map((q: any, index: number) => (
            <div key={q.id} className="bg-neutral-900 border border-neutral-800 rounded-[2rem] p-8 shadow-xl transition-all focus-within:border-emerald-500/50 hover:border-neutral-700 group">
              <label className="block text-2xl font-bold mb-8 flex gap-4">
                <span className="text-neutral-600 font-mono text-xl pt-1">{index + 1}.</span>
                <span className="text-neutral-100">{q.text}</span>
              </label>

              <div className="pl-4 md:pl-10">
                {q.type === 'TEXT' && (
                  <textarea
                    required
                    className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl px-4 py-4 text-white outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-y min-h-[120px] shadow-inner"
                    placeholder="Escribe tu respuesta aquí..."
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  />
                )}

                {q.type === 'NUMBER' && (
                  <input
                    required
                    type="number"
                    className="w-full max-w-xs bg-neutral-950/50 border border-neutral-800 rounded-xl px-4 py-4 text-white outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-mono text-xl shadow-inner"
                    placeholder="0"
                    onChange={(e) => handleAnswerChange(q.id, Number(e.target.value))}
                  />
                )}

                {q.type === 'SCALE' && (
                  <div className="flex gap-3 justify-between max-w-md">
                    {[1, 2, 3, 4, 5].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={(e) => { e.preventDefault(); handleAnswerChange(q.id, num); }}
                        className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl font-bold text-xl transition-all ${
                          answers[q.id] === num 
                            ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.6)] scale-110 -translate-y-2' 
                            : 'bg-neutral-800/80 text-neutral-400 hover:bg-neutral-700 hover:-translate-y-1'
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
                        onClick={(e) => { e.preventDefault(); handleAnswerChange(q.id, opt.id); }}
                        className={`w-full text-left px-6 py-5 rounded-2xl border transition-all flex items-center gap-5 ${
                          answers[q.id] === opt.id
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)] scale-[1.01]'
                            : 'bg-neutral-950/50 border-neutral-800 hover:border-neutral-600 text-neutral-300'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex flex-shrink-0 items-center justify-center transition-colors ${
                          answers[q.id] === opt.id ? 'border-emerald-500' : 'border-neutral-600'
                        }`}>
                          {answers[q.id] === opt.id && <div className="w-3 h-3 bg-emerald-500 rounded-full animate-in zoom-in" />}
                        </div>
                        <span className="text-lg">{opt.text}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="pt-12">
            <button
              type="submit"
              disabled={Object.keys(answers).length < surveyConfig.questions.length || isSubmitting}
              className="w-full flex items-center justify-center gap-3 px-8 py-6 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:from-neutral-800 disabled:to-neutral-900 disabled:text-neutral-600 disabled:shadow-none text-white font-bold rounded-2xl text-xl transition-all shadow-xl shadow-emerald-500/25 group"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <span>Enviar Mis Respuestas Completas</span>
                  <Send size={24} className="group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
            <p className="text-center text-neutral-500 mt-6 text-sm font-medium">Al enviar, confirmas que has verificado todas tus respuestas.</p>
          </div>
        </form>
      </main>
    </div>
  );
}
