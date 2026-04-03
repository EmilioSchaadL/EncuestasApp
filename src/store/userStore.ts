import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UserState {
  username: string | null;
  login: (name: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      username: null,
      login: (name) => set({ username: name }),
      logout: () => set({ username: null }),
    }),
    {
      name: 'survey-user-storage', // Nombre de la llave en LocalStorage
      storage: createJSONStorage(() => localStorage), // Aseguramos que use localStorage
    }
  )
);