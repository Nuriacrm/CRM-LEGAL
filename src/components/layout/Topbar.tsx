"use client";

import { Search, Bell, LogOut, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function Topbar() {
    const { user, signOut } = useAuth();

    // Obtener inicial del email o nombre
    const initial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

    return (
        <header className="h-20 bg-slate-900 border-b border-slate-800 sticky top-0 z-30 flex items-center justify-between px-6 shrink-0 shadow-sm">
            {/* Logo y Título */}
            <div className="flex items-center gap-4 min-w-max text-white">
                <Link href="/" className="flex items-center gap-4">
                    <div className="w-16 h-16 relative overflow-hidden flex-shrink-0">
                        <Image
                            src="/logo.jpg"
                            alt="Nuria Arau Logo"
                            fill
                            className="object-contain drop-shadow-md mix-blend-screen"
                            priority
                        />
                    </div>
                    <div className="hidden lg:block">
                        <h1 className="text-lg font-semibold text-emerald-500 tracking-wide uppercase leading-tight">
                            Nuria Arau
                        </h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-medium">
                            Mediación y Abogacía
                        </p>
                    </div>
                </Link>
            </div>

            {/* Buscador */}
            <div className="flex-1 max-w-2xl mx-8 relative hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Buscar expedientes, clientes, documentos..."
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-full pl-12 pr-6 py-2.5 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium backdrop-blur-sm"
                />
            </div>

            {/* Acciones de usuario */}
            <div className="flex items-center gap-4 ml-4">
                <button className="relative text-slate-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700">
                    <Bell className="w-6 h-6" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
                </button>

                <div className="h-10 w-[1px] bg-slate-800 mx-2 hidden sm:block" />

                <div className="flex items-center gap-3 pl-2">
                    <Link
                        href="/ajustes/perfil"
                        className="flex flex-col items-end hidden sm:flex hover:opacity-80 transition-opacity"
                        title="Ir a Mi Perfil"
                    >
                        <span className="text-xs font-bold text-white truncate max-w-[150px]">{user?.email?.split('@')[0]}</span>
                        <span className="text-[10px] text-slate-500 font-medium">Administrador</span>
                    </Link>
                    <Link
                        href="/ajustes/perfil"
                        className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform"
                        title="Ir a Mi Perfil"
                    >
                        {initial}
                    </Link>
                    <button
                        onClick={() => signOut()}
                        title="Cerrar Sesión"
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-500/20 transition-all group"
                    >
                        <LogOut className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </div>
        </header>
    );
}
