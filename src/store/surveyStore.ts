import { create } from 'zustand';

export type QuestionType = 'TEXT' | 'MULTIPLE_CHOICE' | 'SCALE' | 'NUMBER' | 'DROPDOWN' | 'INFO';

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  description?: string;
  type: QuestionType;
  categoryId: string;
  options?: Option[];
   // Used only for MULTIPLE_CHOICE
}

export interface Category {
  id: string;
  name: string;
}

interface SurveyState {
  title: string;
  description: string;
  categories: Category[];
  questions: Question[];
  setTitle: (title: string) => void;
  setDescription: (desc: string) => void;
  addCategory: (name: string) => void;
  removeCategory: (id: string) => void;
  addQuestion: (q: Question) => void;
  updateQuestion: (id: string, q: Partial<Question>) => void;
  removeQuestion: (id: string) => void;
  addOptionToQuestion: (qId: string, option: Option) => void;
  updateOption: (qId: string, oId: string, option: Partial<Option>) => void;
  removeOptionFromQuestion: (qId: string, oId: string) => void;
  reset: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useSurveyStore = create<SurveyState>((set) => ({
  title: 'Nueva Encuesta',
  description: 'Descripción de la encuesta...',
  categories: [{ id: 'cat-1', name: 'General' }],
  questions: [],

  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),
  
  reset: () => set({
    title: 'Nueva Encuesta',
    description: 'Descripción de la encuesta...',
    categories: [{ id: 'cat-1', name: 'General' }],
    questions: []
  }),

  addCategory: (name) => set((state) => ({
    categories: [...state.categories, { id: generateId(), name }]
  })),
  removeCategory: (id) => set((state) => ({
    categories: state.categories.filter(c => c.id !== id)
  })),

  addQuestion: (q) => set((state) => ({
    questions: [...state.questions, q]
  })),
  updateQuestion: (id, updatedQ) => set((state) => ({
    questions: state.questions.map(q => q.id === id ? { ...q, ...updatedQ } : q)
  })),
  removeQuestion: (id) => set((state) => ({
    questions: state.questions.filter(q => q.id !== id)
  })),

  addOptionToQuestion: (qId, option) => set((state) => ({
    questions: state.questions.map(q => {
      if (q.id === qId) {
        return { ...q, options: [...(q.options || []), option] };
      }
      return q;
    })
  })),
  updateOption: (qId, oId, updatedOpt) => set((state) => ({
    questions: state.questions.map(q => {
      if (q.id === qId && q.options) {
        return {
          ...q,
          options: q.options.map(o => o.id === oId ? { ...o, ...updatedOpt } : o)
        };
      }
      return q;
    })
  })),
  removeOptionFromQuestion: (qId, oId) => set((state) => ({
    questions: state.questions.map(q => {
      if (q.id === qId && q.options) {
        return {
          ...q,
          options: q.options.filter(o => o.id !== oId)
        };
      }
      return q;
    })
  }))
}));
