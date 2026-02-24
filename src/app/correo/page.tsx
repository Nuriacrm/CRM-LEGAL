"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Mail, Search, RefreshCw, Loader2, Plus,
    User, ArrowRight, CornerDownRight, Clock, AlertTriangle, ChevronRight, ExternalLink
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { SendEmailModal } from "@/components/gmail/SendEmailModal";
import Link from "next/link";

export default function CorreoGlobalPage() {
    const { isAdmin, profile } = useAuth();
    const [emails, setEmails] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [needsAuth, setNeedsAuth] = useState(false);
    const [authUrl, setAuthUrl] = useState("");
    const [searchClient, setSearchClient] = useState("");
    const [selectedClientEmail, setSelectedClientEmail] = useState<string | null>(null);
    const [selectedExpedienteId, setSelectedExpedienteId] = useState<string | null>(null);
    const [isSendModalOpen, setIsSendModalOpen] = useState(false);

    const fetchEmails = useCallback(async (emailFilter: string | null = null) => {
        setLoading(true);
        setError(null);
        try {
            const url = emailFilter
                ? `/api/gmail/threads?email=${encodeURIComponent(emailFilter)}`
                : "/api/gmail/threads";

            const res = await fetch(url);
            const data = await res.json();

            if (!res.ok) {
                if (data.needsAuth) {
                    setNeedsAuth(true);
                    setAuthUrl(data.authUrl);
                } else {
                    throw new Error(data.error || "Error al obtener correos");
                }
            } else {
                setEmails(data.threads || []);
                setNeedsAuth(false);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchClients = useCallback(async () => {
        const { data, error } = await supabase
            .from("clientes")
            .select("id, nombre, apellidos, email")
            .order("nombre", { ascending: true });

        if (!error) setClients(data || []);
    }, []);

    useEffect(() => {
        if (isAdmin) {
            fetchEmails();
            fetchClients();
        }
    }, [isAdmin, fetchEmails, fetchClients]);

    const filteredClients = clients.filter(c =>
        (c.nombre + " " + (c.apellidos || "")).toLowerCase().includes(searchClient.toLowerCase()) ||
        (c.email || "").toLowerCase().includes(searchClient.toLowerCase())
    ).slice(0, 5);

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-950">
                <div className="bg-red-500/10 p-6 rounded-3xl border border-red-500/20 max-w-md">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-white mb-2">Acceso Denegado</h1>
                    <p className="text-slate-400 text-sm">
                        Solo los administradores pueden acceder a la central de correo Gmail.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-950">
            {/* Header */}
            <div className="p-8 border-b border-slate-800 bg-slate-900/30 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-blue-600/20 p-2.5 rounded-2xl">
                                <Mail className="w-6 h-6 text-blue-400" />
                            </div>
                            <h1 className="text-3xl font-extrabold text-white tracking-tight">Central de Correo</h1>
                        </div>
                        <p className="text-slate-400 text-sm ml-12">Gestiona todas tus comunicaciones profesionales desde un solo lugar.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <a
                            href="https://mail.google.com/mail/u/?authuser=Arau.derechoymediacion@gmail.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all font-bold text-sm"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Ir a Gmail
                        </a>
                        <button
                            onClick={() => setIsSendModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/30 active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            Nuevo Mensaje
                        </button>
                        <button
                            onClick={() => fetchEmails(selectedClientEmail)}
                            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl border border-slate-700 text-slate-400 hover:text-white transition-all active:scale-95"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            <main className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Lateral: Filtros y Clientes */}
                <aside className="w-full md:w-80 border-r border-slate-800 p-6 space-y-8 bg-slate-900/10 overflow-y-auto">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-4 ml-1">Filtro por Cliente</label>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar nombre o email..."
                                value={searchClient}
                                onChange={(e) => setSearchClient(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
                            />
                        </div>

                        {searchClient && (
                            <div className="mt-3 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-2">
                                {filteredClients.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={async () => {
                                            setSelectedClientEmail(c.email);
                                            setSearchClient("");
                                            fetchEmails(c.email);

                                            // Buscar el expediente más reciente de este cliente para vincular correos
                                            const { data: expData } = await supabase
                                                .from('expedientes')
                                                .select('id')
                                                .eq('cliente_id', c.id)
                                                .order('created_at', { ascending: false })
                                                .limit(1)
                                                .single();

                                            if (expData) setSelectedExpedienteId(expData.id);
                                            else setSelectedExpedienteId(null);
                                        }}
                                        className="w-full px-4 py-3 text-left hover:bg-slate-800 flex items-center justify-between group transition-colors border-b border-slate-800 last:border-0"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{c.nombre} {c.apellidos}</p>
                                            <p className="text-[10px] text-slate-500 truncate">{c.email || "Sin email"}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                                {filteredClients.length === 0 && (
                                    <p className="p-4 text-xs text-slate-500 text-center italic">No se encontraron clientes</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <button
                            onClick={() => {
                                setSelectedClientEmail(null);
                                fetchEmails(null);
                            }}
                            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all border ${!selectedClientEmail ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 shadow-lg shadow-blue-500/5' : 'text-slate-400 hover:bg-slate-800 border-transparent'}`}
                        >
                            <Mail className="w-4 h-4" />
                            <span className="text-sm font-bold tracking-tight">Bandeja Global</span>
                        </button>
                    </div>

                    {selectedClientEmail && (
                        <div className="p-5 bg-blue-900/10 border border-blue-500/20 rounded-2xl animate-in zoom-in-95">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-blue-500/20 p-2 rounded-xl">
                                    <User className="w-4 h-4 text-blue-400" />
                                </div>
                                <span className="text-xs font-bold text-blue-300">Filtro Activo</span>
                            </div>
                            <p className="text-xs text-white font-medium mb-1 truncate">{selectedClientEmail}</p>
                            <button
                                onClick={() => {
                                    setSelectedClientEmail(null);
                                    fetchEmails(null);
                                }}
                                className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider"
                            >
                                Quitar Filtro
                            </button>
                        </div>
                    )}
                </aside>

                {/* Contenido: Listado de Emails */}
                <section className="flex-1 overflow-y-auto p-8 relative">
                    {needsAuth ? (
                        <div className="h-full flex flex-col items-center justify-center animate-in fade-in duration-500">
                            <div className="bg-slate-900 p-10 rounded-[32px] border border-slate-800 shadow-2xl max-w-md text-center">
                                <div className="bg-blue-600/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-blue-600/5">
                                    <Mail className="w-10 h-10 text-blue-500" />
                                </div>
                                <h2 className="text-2xl font-black text-white mb-4 tracking-tight">Google no conectado</h2>
                                <p className="text-slate-400 text-sm mb-10 leading-relaxed font-medium">
                                    Para gestionar tus correos globales necesitamos acceso a tu cuenta profesional de Google Workspace.
                                </p>
                                <a
                                    href={authUrl}
                                    className="block bg-white text-slate-950 px-8 py-4 rounded-2xl font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
                                >
                                    Conectar Google Workspace
                                </a>
                            </div>
                        </div>
                    ) : loading ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                                    <Mail className="w-4 h-4 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">Sincronizando Correo...</p>
                            </div>
                        </div>
                    ) : emails.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <Mail className="w-16 h-16 text-slate-800 mb-6 opacity-20" />
                            <h3 className="text-xl font-bold text-slate-600 tracking-tight">No hay mensajes recientes</h3>
                            <p className="text-slate-700 text-sm mt-2 max-w-xs">{selectedClientEmail ? "No se han encontrado correos con este cliente." : "Tu bandeja de entrada está limpia."}</p>
                        </div>
                    ) : (
                        <div className="max-w-5xl mx-auto space-y-4">
                            <div className="flex items-center justify-between mb-8 opacity-50">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Últimos Hilos</span>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gmail Sync Activo</span>
                            </div>

                            <div className="grid gap-3">
                                {emails.map((email) => (
                                    <div key={email.id} className="group bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/30 rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10">
                                        <div className="flex items-start gap-5">
                                            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 group-hover:bg-blue-600/10 group-hover:border-blue-500/50 transition-all shadow-inner">
                                                <Mail className="w-5 h-5 text-slate-500 group-hover:text-blue-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                                                    <h4 className="text-lg font-bold text-white tracking-tight truncate max-w-md group-hover:text-blue-500 transition-colors">{email.subject}</h4>
                                                    <div className="flex items-center gap-3">
                                                        {email.msgCount > 1 && (
                                                            <span className="bg-slate-950 text-slate-400 px-3 py-1 rounded-full text-[10px] font-bold border border-slate-800 shadow-sm">
                                                                {email.msgCount} mensajes
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap bg-slate-950/50 px-2 py-1 rounded-lg">
                                                            {new Date(email.date).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 mb-3">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <span className="text-[10px] font-bold text-slate-600 uppercase">De:</span>
                                                        <span className="text-xs text-blue-400 font-bold truncate max-w-[200px]">{email.from}</span>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed italic opacity-80">{email.snippet}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            </main>

            <SendEmailModal
                isOpen={isSendModalOpen}
                onClose={() => setIsSendModalOpen(false)}
                recipientEmail={selectedClientEmail || ""}
                initialSubject={selectedClientEmail ? "Información sobre su expediente" : ""}
                expedienteId={selectedExpedienteId || undefined}
                onSent={() => fetchEmails(selectedClientEmail)}
            />
        </div>
    );
}
