"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, Loader2, AlertCircle, ShieldCheck, Scale, ArrowRight, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SetupAdminPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [hasUsers, setHasUsers] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkUsers = async () => {
            const { count, error } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            if (!error && count && count > 0) {
                setHasUsers(true);
            }
            setChecking(false);
        };
        checkUsers();
    }, []);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: 'Administrador Inicial',
                    },
                },
            });

            if (error) throw error;

            setSuccess(true);
            // Logout immediately to force clean login
            await supabase.auth.signOut();
        } catch (err: any) {
            setError(err.message || 'Error al crear administrador');
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            </div>
        );
    }

    if (hasUsers && !success) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-4">Configuración Completada</h1>
                    <p className="text-slate-400 mb-8">
                        Ya existe un administrador en el sistema. Por seguridad, esta página ya no está disponible.
                    </p>
                    <button
                        onClick={() => router.push('/login')}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all"
                    >
                        Ir al Inicio de Sesión
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.1),transparent_70%)]" />

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 shadow-xl shadow-emerald-500/20 mb-6">
                        <Scale className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">LexCRM Setup</h1>
                    <p className="text-emerald-500 font-semibold mt-2 uppercase tracking-widest text-xs">Paso 1: Crear Administrador</p>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
                    {success ? (
                        <div className="text-center py-4 animate-in fade-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                                <ShieldCheck className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">¡Usuario Creado!</h2>
                            <p className="text-slate-400 mb-8">
                                El usuario administrador ha sido registrado correctamente. Ya puedes acceder con tus credenciales.
                            </p>
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                            >
                                Acceder al CRM <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <UserPlus className="w-5 h-5 text-emerald-400" />
                                </div>
                                <h2 className="text-xl font-bold text-white text-left">Registro del Titular</h2>
                            </div>

                            <p className="text-sm text-slate-400 mb-8 text-left leading-relaxed">
                                Este será el usuario principal del despacho. Podrá gestionar expedientes y crear nuevos usuarios para su equipo.
                            </p>

                            <form onSubmit={handleSignup} className="space-y-6">
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-200 leading-tight">{error}</p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Email del Administrador</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="nuria@despacho.com"
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Contraseña de Acceso</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Mínimo 6 caracteres"
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-white hover:bg-slate-100 text-slate-950 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <span>Crear mi Usuario</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
