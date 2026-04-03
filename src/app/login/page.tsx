"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const login = useUserStore((state) => state.login);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
  e.preventDefault();
  if (username.trim().toLowerCase() === 'admin!') { 
    login('Admin!'); 
    router.push('/dashboard');
  } else {
    alert('Acceso denegado');
  }
};

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          App de encuestas 
        </h1>

        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-100">
          <div className="space-y-1 mb-6">
            <h2 className="text-2xl font-bold text-slate-800">
              Iniciar Sesión
            </h2>
            <p className="text-sm text-slate-500">
              Ingresa un nombre de usuario para gestionar tus encuestas
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-sm font-medium leading-none text-slate-700"
              >
                Nombre de Usuario
              </label>
              <input
                id="username"
                placeholder="Ej: administrador"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex h-12 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600 focus-visible:border-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600 disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white shadow hover:bg-indigo-700 h-12 w-full text-lg"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
