'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, LogOut, LayoutDashboard, PlusCircle, Menu, X } from 'lucide-react';
import { useUserStore } from '@/store/userStore';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { username, logout } = useUserStore();
  
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Evitar errores de hidratación (esperar al cliente)
  if (!mounted) return null;

  // 2. RUTAS DONDE EL NAVBAR NO DEBE APARECER NUNCA:
  // - En las encuestas (/responder)
  // - En el login (/login)
  if (pathname.startsWith('/responder') || pathname === '/login') {
    return null;
  }

  // 3. LÓGICA PARA LA LANDING PAGE (/)
  // Solo mostramos la barra en el inicio si ya estás logueado como Admin!
  const isAdmin = username === 'Admin!';
  if (pathname === '/' && !isAdmin) return null;

  return (
    <nav className="top-0 md:top-4 left-0 md:left-1/2 md:-translate-x-1/2 z-[100] w-full md:w-auto px-0 md:px-4">
      <div className="bg-neutral-900/90 backdrop-blur-xl border-b md:border border-neutral-800 md:rounded-2xl px-4 py-3 md:p-2 shadow-2xl flex items-center justify-between md:gap-4">
        
        {/* LOGO / ACCESO RÁPIDO */}
        <Link 
          href={isAdmin ? "/" : "/"} 
          className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-800 rounded-xl transition-all group"
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
            <Home size={18} className="text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight">Encuestas<span className="text-indigo-500">App</span></span>
        </Link>

        {/* BOTÓN MENÚ MÓVIL */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-neutral-400 hover:text-white transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* NAVEGACIÓN ESCRITORIO (PC) */}
        <div className="hidden md:flex items-center gap-1">
          <div className="w-[1px] h-4 bg-neutral-800 mx-2" />
          
          <NavLink href="/dashboard" active={pathname === '/dashboard'} icon={<LayoutDashboard size={16} />}>
            Panel
          </NavLink>

          <NavLink href="/builder" active={pathname === '/builder'} icon={<PlusCircle size={16} />}>
            Creador
          </NavLink>

          <div className="w-[1px] h-4 bg-neutral-800 mx-2" />

          <button 
            onClick={() => {
              logout();
              router.push('/');
              router.refresh();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-neutral-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={16} />
            Salir
          </button>
        </div>
      </div>

      {/* MENÚ DESPLEGABLE (MÓVIL) */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-neutral-900 border-b border-neutral-800 p-4 space-y-2 shadow-2xl animate-in slide-in-from-top duration-300">
          <Link 
            href="/dashboard" 
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 p-4 rounded-xl font-bold ${pathname === '/dashboard' ? 'bg-indigo-600 text-white' : 'bg-neutral-800/50 text-neutral-300'}`}
          >
            <LayoutDashboard size={20} /> Panel de Control
          </Link>
          
          <Link 
            href="/builder" 
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 p-4 rounded-xl font-bold ${pathname === '/builder' ? 'bg-indigo-600 text-white' : 'bg-neutral-800/50 text-neutral-300'}`}
          >
            <PlusCircle size={20} /> Crear Encuesta
          </Link>

          <div className="h-[1px] bg-neutral-800 my-2" />

          <button 
            onClick={() => {
              setIsOpen(false);
              logout();
              router.push('/');
            }}
            className="w-full flex items-center gap-3 p-4 rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-bold"
          >
            <LogOut size={20} /> Cerrar Sesión
          </button>
        </div>
      )}
    </nav>
  );
}

// COMPONENTE AUXILIAR NavLink
function NavLink({ href, active, children, icon }: { href: string, active: boolean, children: React.ReactNode, icon: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
        active 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
          : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}