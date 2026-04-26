'use client';

import { useState, useEffect } from 'react';
import { useSurveyStore, QuestionType, Option, Question } from '@/store/surveyStore';
import { Plus, Trash2, Settings, ListFilter, Save, Loader2, Copy, CheckCircle, Home, LogOut } from 'lucide-react';
import { saveSurveyData } from '@/lib/apiGoogle';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';

// IMPORTANTE: Importación dinámica para React-Quill en Next.js (Evita errores de SSR)
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css'; // Estilos del editor

const ReactQuillDynamic = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => <p className="text-neutral-500 text-sm">Cargando editor...</p>
});

const ReactQuill = (props: any) => {
  return <ReactQuillDynamic {...props} />;
};

export default function BuilderPage() {
  const router = useRouter();
  const username = useUserStore(state => state.username);
  const logout = useUserStore(state => state.logout);

  const {
    title, description, categories, questions,
    setTitle, setDescription, addCategory, removeCategory,
    addQuestion, updateQuestion, removeQuestion, addOptionToQuestion,
    updateOption, removeOptionFromQuestion
  } = useSurveyStore();

  const [isSaving, setIsSaving] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!username) {
      router.push('/login');
    }
  }, [username, router]);

  if (!username) return null;

  const handleSaveToSheets = async () => {
    setIsSaving(true);
    const newSurveyId = "SURVEY-" + Math.random().toString(36).substring(2, 9).toUpperCase();
    const surveyToSave = {
      id: newSurveyId,
      title,
      description,
      categories,
      questions
    };
    try {
      const response = await saveSurveyData(surveyToSave, username || 'anonymous');
      if (response.status === 'success') {
        setCreatedUrl(window.location.origin + '/responder/' + newSurveyId);
      } else {
        alert('Hubo un error al guardar: ' + response.message);
      }
    } catch (e) {
      alert('Error de conexión con Google Sheets');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (createdUrl) {
      navigator.clipboard.writeText(createdUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    useSurveyStore.getState().reset();
    setCreatedUrl(null);
  };

  const handleCreateQuestion = () => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substring(2, 9),
      text: '',
      type: 'TEXT',
      categoryId: categories[0]?.id || '',
      options: []
    };
    addQuestion(newQuestion);
  };

  const handleCreateCategory = () => {
    const name = prompt('Nombre de la categoría:');
    if (name) addCategory(name);
  };

  const handleAddOption = (qId: string) => {
    const option: Option = {
      id: Math.random().toString(36).substring(2, 9),
      text: 'Nueva Opción'
    };
    addOptionToQuestion(qId, option);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-indigo-500/30">
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-600/10 rounded-full blur-[120px]"></div>
      </div>

      <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
              <Settings size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Editor de Encuesta</h1>
              <span className="text-xs text-neutral-500 uppercase tracking-widest">{username ? `Autor: ${username}` : 'Modo Diseño'}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { logout(); router.push('/login'); }}
              className="text-neutral-400 hover:text-white transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={20} />
            </button>
            <button 
              onClick={createdUrl ? handleReset : handleSaveToSheets}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-full font-medium transition-all shadow-lg shadow-indigo-500/25"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : (createdUrl ? <Plus size={18} /> : <Save size={18} />)}
              <span>{isSaving ? 'Guardando...' : (createdUrl ? 'Nueva' : 'Guardar en Sheets')}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8 pb-32">
        {createdUrl ? (
          // (Tu pantalla de éxito se mantiene igual)
          <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] p-12 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
               <CheckCircle size={40} />
            </div>
            <h2 className="text-3xl font-bold mb-4">¡Encuesta Guardada!</h2>
            <p className="text-neutral-400 mb-8 max-w-lg mx-auto">Tu encuesta se guardó correctamente. Comparte este enlace con tus encuestados.</p>
            
            <div className="flex flex-col sm:flex-row bg-neutral-950 border border-neutral-800 rounded-xl p-2 max-w-xl mx-auto items-center mb-8 gap-2">
              <input type="text" readOnly value={createdUrl} className="w-full sm:flex-1 bg-transparent px-4 py-2 outline-none text-neutral-300 font-mono text-sm text-center sm:text-left" />
              <button 
                onClick={handleCopyLink} 
                className={`w-full sm:w-auto px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 hover:bg-neutral-700 text-white'}`}
              >
                {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button onClick={handleReset} className="px-6 py-3 border border-neutral-700 hover:bg-neutral-800 text-white rounded-xl transition-all font-medium flex-1 sm:flex-none">
                Crear Otra
              </button>
              <Link href="/" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all font-medium flex items-center justify-center gap-2 flex-1 sm:flex-none">
                <Home size={18} /> Volver al Inicio
              </Link>
            </div>
          </div>
        ) : (
          <>
            <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-fuchsia-500"></div>
              <input
                type="text"
                className="w-full bg-transparent text-4xl font-extrabold outline-none placeholder-neutral-600 mb-4 transition-colors"
                placeholder="Título de la Encuesta"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="w-full bg-transparent text-neutral-400 outline-none placeholder-neutral-700 resize-none overflow-hidden"
                placeholder="Describe el propósito de esta encuesta..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </section>

            <section className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                  <ListFilter size={16} /> Categorías
                </h2>
                <button onClick={handleCreateCategory} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1 transition-colors">
                  <Plus size={16} /> Añadir Categoría
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center gap-2 bg-neutral-800 px-3 py-1.5 rounded-lg text-sm border border-neutral-700">
                    <span>{cat.name}</span>
                    {categories.length > 1 && (
                      <button onClick={() => removeCategory(cat.id)} className="text-neutral-500 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              {questions.map((q, index) => (
                <div key={q.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl relative group">
                  <div className="absolute -left-3 top-6 w-6 h-6 bg-neutral-800 text-neutral-500 text-xs font-bold rounded-full flex items-center justify-center border border-neutral-700">
                    {index + 1}
                  </div>
                  
                  <div className="flex gap-4 items-start mb-6 pl-2">
                    <div className="flex-1 space-y-4">
                      {/* TÍTULO DE PREGUNTA / INFO */}
                      <input
                        type="text"
                        className="w-full bg-transparent text-xl font-semibold outline-none placeholder-neutral-600 border-b border-transparent focus:border-indigo-500/50 py-1 transition-colors"
                        placeholder={q.type === 'INFO' ? "Título del bloque de información..." : "Escribe tu pregunta aquí..."}
                        value={q.text}
                        onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                      />
                      
                      {/* NUEVO: EDITOR DE TEXTO ENRIQUECIDO PARA 'INFO' */}
                      {q.type === 'INFO' && (
                        <div className="mt-4 bg-white rounded-xl text-black overflow-hidden border border-neutral-300">
                          <ReactQuill 
                            theme="snow"
                            value={q.description || ''} 
                            onChange={(content : string) => updateQuestion(q.id, { description: content })}
                            placeholder="Añade viñetas, descripciones, y cambia el tamaño de la letra..."
                            className="h-32 mb-10" // Margen inferior para que no se coma la barra de herramientas
                          />
                        </div>
                      )}
                    </div>

                    <button onClick={() => removeQuestion(q.id)} className="text-neutral-500 hover:text-red-400 p-2 hover:bg-neutral-800 rounded-lg transition-colors mt-1">
                      <Trash2 size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 pl-2">
                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-500 font-medium">Tipo</label>
                      <select
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-300 outline-none focus:border-indigo-500"
                        value={q.type}
                        onChange={(e) => updateQuestion(q.id, { type: e.target.value as QuestionType })}
                      >
                        <option value="TEXT">Texto Corto</option>
                        <option value="SCALE">Escala de Valoración</option>
                        <option value="NUMBER">Numérico</option>
                        <option value="MULTIPLE_CHOICE">Opción Múltiple</option>
                        {/* NUEVAS OPCIONES */}
                        <option value="DROPDOWN">Lista Desplegable</option>
                        <option value="INFO">Bloque de Información</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-500 font-medium">Categoría (Sección)</label>
                      <select
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-300 outline-none focus:border-indigo-500"
                        value={q.categoryId}
                        onChange={(e) => updateQuestion(q.id, { categoryId: e.target.value })}
                      >
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* NUEVO: Las opciones ahora aparecen para MULTIPLE_CHOICE y DROPDOWN */}
                  {(q.type === 'MULTIPLE_CHOICE' || q.type === 'DROPDOWN') && (
                    <div className="pl-2 border-t border-neutral-800/60 pt-4 mt-2">
                      <h4 className="text-xs text-neutral-400 font-semibold mb-3">Opciones de Respuesta</h4>
                      <div className="space-y-2">
                        {q.options?.map((opt) => (
                          <div key={opt.id} className="flex items-center gap-3">
                            <input
                              type="text"
                              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
                              value={opt.text}
                              onChange={(e) => updateOption(q.id, opt.id, { text: e.target.value })}
                              placeholder="Escribe una opción"
                            />
                            <button onClick={() => removeOptionFromQuestion(q.id, opt.id)} className="text-neutral-500 hover:text-red-400">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => handleAddOption(q.id)} className="mt-4 flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 font-medium">
                        <Plus size={16} /> Añadir opción
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={handleCreateQuestion}
                className="w-full py-8 border-2 border-dashed border-neutral-800 rounded-2xl text-neutral-500 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Plus size={24} />
                </div>
                <span className="font-medium">Añadir Nueva Pregunta o Info</span>
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}