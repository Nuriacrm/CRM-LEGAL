"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import {
    Users, UserPlus, Shield, User as UserIcon, Mail, Trash2,
    Search, ShieldAlert, Loader2, X, CheckCircle2, AlertCircle, Lock as LockIcon
} from 'lucide-react';

// Cliente secundario para no cerrar sesión al admin al crear un usuario
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qjkckvjbnrfsmhmsbvyn.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqa2NrdmpibnJmc21obXNidnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjE4NTAsImV4cCI6MjA4NzMzNzg1MH0.1nbJ00LRt4nss70aqDMF5KOPI0mCqPCdWDO7QMnYNlU';
const authCreatorClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
});

export default function GestionUsuariosPage() {
    const { isAdmin, user: currentUser } = useAuth();
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);

    // Form states
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
    const [creating, setCreating] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState(false);

    const fetchProfiles = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error) setProfiles(data || []);
        setLoading(false);
    };

    useEffect(() => {
        if (isAdmin) fetchProfiles();
    }, [isAdmin]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setFormError(null);
        setFormSuccess(false);

        try {
            // Creamos el usuario con el cliente secundario
            const { data, error } = await authCreatorClient.auth.signUp({
                email: newEmail,
                password: newPassword,
                options: {
                    data: {
                        full_name: newName,
                        // Nota: el trigger se encargará de crear el perfil con role='user' por defecto.
                        // Si queremos que el admin elija el rol, el perfil se insertará vía trigger,
                        // pero luego el admin podría actualizarlo.
                    }
                }
            });

            if (error) throw error;

            // Si el rol es admin, lo actualizamos manualmente después de que el trigger lo cree
            if (newRole === 'admin' && data.user) {
                await supabase
                    .from('profiles')
                    .update({ role: 'admin' })
                    .eq('id', data.user.id);
            }

            setFormSuccess(true);
            setNewEmail('');
            setNewPassword('');
            setNewName('');
            fetchProfiles();
            setTimeout(() => {
                setShowModal(false);
                setFormSuccess(false);
            }, 2000);
        } catch (err: any) {
            setFormError(err.message || 'Error al crear usuario');
        } finally {
            setCreating(false);
        }
    };

    const deleteProfile = async (id: string) => {
        if (id === currentUser?.id) return;
        if (!confirm('¿Estás seguro de eliminar este acceso? El usuario no podrá entrar más.')) return;

        // Solo eliminamos el perfil, el usuario de auth quedaría, pero sin perfil no tiene rol admin.
        // Nota: El trigger CASCADE en la DB se encarga si borramos de auth, pero aquí solo borramos perfil.
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (!error) fetchProfiles();
    };

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Acceso Restringido</h1>
                <p className="text-slate-400 max-w-md">
                    Solo los administradores del sistema pueden gestionar usuarios y permisos.
                </p>
            </div>
        );
    }

    const filteredProfiles = profiles.filter(p =>
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Users className="w-8 h-8 text-emerald-500" />
                        Gestión de Usuarios
                    </h1>
                    <p className="text-slate-400 mt-2">Control de accesos y roles del despacho</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
                >
                    <UserPlus className="w-5 h-5" />
                    Nuevo Usuario
                </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-800 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                    </div>
                    <div className="text-xs text-slate-500 font-medium ml-auto">
                        Total: {profiles.length} usuarios
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/50 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Rol</th>
                                <th className="px-6 py-4">F. Registro</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                        Cargando usuarios...
                                    </td>
                                </tr>
                            ) : filteredProfiles.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                                        No se encontraron usuarios
                                    </td>
                                </tr>
                            ) : filteredProfiles.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-500 transition-colors">
                                                <UserIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{p.full_name || 'Sin nombre'}</p>
                                                <p className="text-xs text-slate-500">{p.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${p.role === 'admin'
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            }`}>
                                            {p.role === 'admin' ? <Shield className="w-3 h-3" /> : null}
                                            {p.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500">
                                        {new Date(p.created_at).toLocaleDateString('es-ES')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {p.id !== currentUser?.id && (
                                            <button
                                                onClick={() => deleteProfile(p.id)}
                                                className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Nuevo Usuario */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-emerald-400" />

                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                                        <UserPlus className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Nuevo Usuario</h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {formSuccess ? (
                                <div className="text-center py-8 animate-in zoom-in duration-300">
                                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">¡Completado!</h3>
                                    <p className="text-slate-400">El usuario ha sido creado correctamente.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleCreateUser} className="space-y-5">
                                    {formError && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                            <p className="text-sm text-red-200 leading-tight">{formError}</p>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Nombre Completo</label>
                                        <input
                                            type="text" required value={newName} onChange={e => setNewName(e.target.value)}
                                            placeholder="Ej: Juan Pérez"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Email Acceso</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <input
                                                type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)}
                                                placeholder="juan@despacho.com"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Contraseña Inicial</label>
                                        <div className="relative">
                                            <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <input
                                                type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Rol de Usuario</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setNewRole('user')}
                                                className={`py-3 rounded-xl text-xs font-bold border transition-all ${newRole === 'user'
                                                    ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                                                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                                                    }`}
                                            >
                                                Estándar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNewRole('admin')}
                                                className={`py-3 rounded-xl text-xs font-bold border transition-all ${newRole === 'admin'
                                                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                                                    }`}
                                            >
                                                Administrador
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl mt-4 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Crear Usuario</span>}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
