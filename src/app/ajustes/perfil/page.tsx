"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import {
    User, Mail, Shield, Save, Loader2, AlertCircle, CheckCircle2,
    ArrowLeft, Lock, BadgeCheck
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MiPerfilPage() {
    const { user, profile, isAdmin } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Form states
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setEmail(profile.email || '');
        }
    }, [profile]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(null);
        setError(null);

        try {
            // 1. Update Name in profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ full_name: fullName })
                .eq('id', user?.id);

            if (profileError) throw profileError;

            // 2. Update Email in Auth (if changed)
            if (email !== user?.email) {
                const { error: authError } = await supabase.auth.updateUser({
                    email: email,
                });
                if (authError) throw authError;
                setSuccess('Perfil actualizado. Se ha enviado un correo de verificación a la nueva dirección.');
            } else {
                setSuccess('Perfil actualizado correctamente.');
            }
        } catch (err: any) {
            setError(err.message || 'Error al actualizar el perfil');
        } finally {
            setLoading(false);
            setTimeout(() => setSuccess(null), 5000);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex items-center gap-4">
                <Link href="/" className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <User className="w-8 h-8 text-emerald-500" />
                        Mi Perfil
                    </h1>
                    <p className="text-slate-400 mt-1">Gestiona tus datos personales y credenciales de acceso</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 mx-auto mb-4 flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-emerald-500/20">
                            {profile?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <h2 className="text-xl font-bold text-white mb-1">{profile?.full_name || 'Usuario'}</h2>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest ${isAdmin
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}>
                            {isAdmin ? <Shield className="w-3 h-3" /> : null}
                            {isAdmin ? 'Administrador' : 'Usuario Estándar'}
                        </div>
                        <p className="text-xs text-slate-500 mt-6 pt-6 border-t border-slate-800">
                            Email actual:<br />
                            <span className="text-slate-300 font-medium">{user?.email}</span>
                        </p>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <BadgeCheck className="w-4 h-4 text-emerald-500" />
                            Seguridad del Datos
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Los cambios de email requieren doble verificación para asegurar la integridad de tu cuenta. Recibirás un correo en ambas direcciones.
                        </p>
                    </div>
                </div>

                {/* Main Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleUpdateProfile} className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                <Save className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Editar Información</h2>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 animate-in shake duration-500">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-200 leading-tight">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2 duration-500">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-emerald-200 leading-tight">{success}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Nombre Completo</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                                    <input
                                        type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                                        placeholder="Tu nombre completo"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Correo Electrónico</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                                    <input
                                        type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                        placeholder="nuria@despacho.com"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex flex-col sm:flex-row gap-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            <span>Guardar Cambios</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.push('/ajustes/password')}
                                    disabled={true}
                                    className="sm:px-8 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-4 rounded-2xl transition-all border border-slate-700 flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Lock className="w-5 h-5" />
                                    <span className="hidden sm:inline">Cambiar Clave</span>
                                </button>
                            </div>
                        </div>
                    </form>

                    <div className="mt-8 p-6 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Ayuda del Sistema</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Si pierdes el acceso a tu correo electrónico principal, contacta con el soporte técnico para restaurar tu cuenta manualmente mediante verificación de identidad.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
