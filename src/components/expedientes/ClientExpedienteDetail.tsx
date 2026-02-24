"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Tabs } from "@/components/ui/Tabs";
import {
    ArrowLeft, Briefcase, FileText, Scale, Users, Gavel, AlertTriangle,
    ArrowRightCircle, Search, ChevronDown, ExternalLink, X, User, Building2, Mail, Phone
} from "lucide-react";
import Link from "next/link";
import { CalculadoraExpediente } from "@/components/expedientes/CalculadoraExpediente";
import { ModuloMediacion } from "@/components/expedientes/ModuloMediacion";
import { WhatsAppModal } from "@/components/whatsapp/WhatsAppModal";
import { MessageSquare, Loader2, RefreshCw, Mail as MailIcon, Clock, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { SendEmailModal } from "@/components/gmail/SendEmailModal";

type ClienteData = { id: string; nombre: string; apellidos: string | null; telefono: string | null; email: string | null };
type ContrarioItem = { id: string; nombre: string; tipo: string; despacho: string | null; telefono: string | null; ciudad: string | null };
type JuzgadoItem = { id: string; nombre: string; tipo: string | null; ciudad: string | null; partido_judicial: string | null };

// ---- Searchable dropdown picker ----
function AgendaPicker<T extends { id: string; nombre: string }>({
    label, value, onSelect, onClear, items, loading, placeholder, renderBadge
}: {
    label: string; value: T | null; onSelect: (item: T) => void; onClear: () => void;
    items: T[]; loading: boolean; placeholder: string;
    renderBadge?: (item: T) => React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filtered = items.filter(i => i.nombre.toLowerCase().includes(q.toLowerCase()));

    return (
        <div className="relative" ref={ref}>
            <label className="text-xs font-medium text-slate-400 block mb-1">{label}</label>
            {value ? (
                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{value.nombre}</p>
                        {renderBadge && renderBadge(value)}
                    </div>
                    <button onClick={onClear} className="text-slate-500 hover:text-red-400 transition-colors shrink-0">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            ) : (
                <button onClick={() => setOpen(o => !o)}
                    className="w-full flex items-center justify-between gap-2 bg-slate-900 border border-slate-700 hover:border-emerald-500/50 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors">
                    <span>{placeholder}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
            )}

            {open && !value && (
                <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                    <div className="p-2 border-b border-slate-700">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                            <input autoFocus type="text" value={q} onChange={e => setQ(e.target.value)}
                                placeholder="Buscar…"
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
                        </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {loading ? (
                            <p className="text-xs text-slate-500 p-3">Cargando…</p>
                        ) : filtered.length === 0 ? (
                            <div className="p-3 text-xs text-slate-500 text-center">
                                {q ? `Sin resultados para "${q}"` : "Agenda vacía"}<br />
                                <Link href="/contrarios" target="_blank" className="text-emerald-400 hover:text-emerald-300">
                                    Añadir en la agenda →
                                </Link>
                            </div>
                        ) : filtered.map(item => (
                            <button key={item.id} onClick={() => { onSelect(item); setOpen(false); setQ(""); }}
                                className="w-full text-left px-3 py-2.5 hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0">
                                <p className="text-sm font-medium text-white">{item.nombre}</p>
                                {renderBadge && <div className="mt-0.5">{renderBadge(item)}</div>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export function ClientExpedienteDetail({ id }: { id: string }) {
    // 1. Estados
    const [fase, setFase] = useState<'Extrajudicial' | 'Judicial'>('Extrajudicial');
    const [autos, setAutos] = useState('');
    const [fechaSalto, setFechaSalto] = useState<string | null>(null);
    const [parteContraria, setParteContraria] = useState('');

    // Datos reales del expediente
    const [numeroExpediente, setNumeroExpediente] = useState<string | null>(null);
    const [caratula, setCaratula] = useState<string | null>(null);

    // Contrarios y Juzgados desde agenda
    const [contrarios, setContrarios] = useState<ContrarioItem[]>([]);
    const [juzgados, setJuzgados] = useState<JuzgadoItem[]>([]);
    const [loadingContrarios, setLoadingContrarios] = useState(true);
    const [loadingJuzgados, setLoadingJuzgados] = useState(true);
    const [contrarioSel, setContrarioSel] = useState<ContrarioItem | null>(null);
    const [juzgadoSel, setJuzgadoSel] = useState<JuzgadoItem | null>(null);

    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
    const [clienteExp, setClienteExp] = useState<ClienteData | null>(null);
    const [loadingCliente, setLoadingCliente] = useState(true);

    useEffect(() => {
        const fetchExpedienteData = async () => {
            // Cargar datos del expediente (incluyendo titulo real y cliente)
            const { data: expData } = await supabase
                .from('expedientes')
                .select('cliente_id, numero_expediente, caratula, categoria')
                .eq('id', id)
                .single();

            if (expData) {
                setNumeroExpediente(expData.numero_expediente ?? null);
                setCaratula(expData.caratula ?? null);
                // Sincronizar fase si viene de BD
                if (expData.categoria === 'Judicial') setFase('Judicial');

                if (expData.cliente_id) {
                    const { data: cliData } = await supabase
                        .from('clientes')
                        .select('id, nombre, apellidos, telefono, email')
                        .eq('id', expData.cliente_id)
                        .single();
                    if (cliData) setClienteExp(cliData);
                }
            }
            setLoadingCliente(false);
        };
        fetchExpedienteData();

        supabase.from("contrarios").select("id,nombre,tipo,despacho,telefono,ciudad").order("nombre")
            .then(({ data }) => { setContrarios(data ?? []); setLoadingContrarios(false); });
        supabase.from("juzgados").select("id,nombre,tipo,ciudad,partido_judicial").order("nombre")
            .then(({ data }) => { setJuzgados(data ?? []); setLoadingJuzgados(false); });
    }, [id]);

    // Modal para pasar a judicial
    const [showModal, setShowModal] = useState(false);
    const [tempJuzgado, setTempJuzgado] = useState('');
    const [tempAutos, setTempAutos] = useState('');
    const [toastMensaje, setToastMensaje] = useState<{ titulo: string, descripcion: string } | null>(null);

    const handlePasarJudicial = () => {
        setAutos(tempAutos);
        if (tempJuzgado) {
            // Buscar en agenda por nombre exacto
            const found = juzgados.find(j => j.nombre.toLowerCase() === tempJuzgado.toLowerCase());
            setJuzgadoSel(found ?? null);
        }
        setFase('Judicial');
        setFechaSalto(new Date().toLocaleDateString('es-ES'));
        setShowModal(false);
        setToastMensaje({
            titulo: 'Nuevo Hito: Judicializado',
            descripcion: 'Se ha activado "Plazo para contestación/demanda". Revisa la Calculadora de Plazos.'
        });
        setTimeout(() => setToastMensaje(null), 5000);
    };

    // Pestañas
    const TabDatosGenerales = (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-emerald-500" />
                    Detalles del Caso
                </h3>
                <div className="space-y-4 text-sm relative z-10">
                    <div className="grid grid-cols-3 gap-2 border-b border-slate-800/50 pb-3">
                        <span className="text-slate-400">Fase</span>
                        <div className="col-span-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${fase === 'Extrajudicial'
                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                                : 'bg-blue-600 text-white border-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.5)]'
                                }`}>
                                {fase}
                            </span>
                        </div>
                    </div>
                    {fase === 'Judicial' && (
                        <>
                            <div className="grid grid-cols-3 gap-2 border-b border-slate-800/50 pb-3 animate-in fade-in slide-in-from-top-2">
                                <span className="text-slate-400">Juzgado</span>
                                <span className="col-span-2 text-slate-200 font-medium">
                                    {juzgadoSel?.nombre || tempJuzgado || 'Pendiente'}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-b border-slate-800/50 pb-3 animate-in fade-in slide-in-from-top-2">
                                <span className="text-slate-400">Nº Autos</span>
                                <span className="col-span-2 text-slate-200 font-bold text-blue-400">{autos || 'Pendiente'}</span>
                            </div>
                            {fechaSalto && (
                                <div className="grid grid-cols-3 gap-2 border-b border-slate-800/50 pb-3 animate-in fade-in slide-in-from-top-2">
                                    <span className="text-slate-400">Fecha del Salto</span>
                                    <span className="col-span-2 text-slate-200 text-xs italic">{fechaSalto}</span>
                                </div>
                            )}
                        </>
                    )}
                    <div className="grid grid-cols-3 gap-2 border-b border-slate-800/50 pb-3">
                        <span className="text-slate-400">Estado</span>
                        <span className="col-span-2 text-emerald-400 font-medium">En curso</span>
                    </div>
                </div>

                {fase === 'Judicial' && (
                    <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none">
                        <Gavel className="w-48 h-48" />
                    </div>
                )}
            </div>

            {/* Partes Implicadas — con pickers de agenda */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Partes Implicadas
                </h3>

                {/* Parte contraria (texto libre) */}
                <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> Parte Contraria (persona/empresa)
                    </label>
                    <input type="text" value={parteContraria} onChange={e => setParteContraria(e.target.value)}
                        placeholder="Nombre de la parte contraria…"
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-rose-400 font-semibold placeholder-slate-600 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-colors" />
                </div>

                {/* Abogado/contrario desde agenda */}
                <AgendaPicker<ContrarioItem>
                    label="Abogado Contrario / Procurador (agenda)"
                    value={contrarioSel}
                    onSelect={setContrarioSel}
                    onClear={() => setContrarioSel(null)}
                    items={contrarios}
                    loading={loadingContrarios}
                    placeholder="Seleccionar de la agenda de contrarios…"
                    renderBadge={(c) => (
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{c.tipo}</span>
                            {c.despacho && <span className="text-[10px] text-slate-400">{c.despacho}</span>}
                            {c.ciudad && <span className="text-[10px] text-slate-500">{c.ciudad}</span>}
                        </div>
                    )}
                />
                {contrarioSel && (
                    <div className="flex items-center justify-between text-xs text-slate-500 -mt-2 pl-1">
                        <span>{contrarioSel.telefono && `📞 ${contrarioSel.telefono}`}</span>
                        <Link href="/contrarios" target="_blank" className="flex items-center gap-1 text-emerald-400/70 hover:text-emerald-400">
                            Ver en agenda <ExternalLink className="w-3 h-3" />
                        </Link>
                    </div>
                )}

                {/* Juzgado desde agenda */}
                <AgendaPicker<JuzgadoItem>
                    label="Juzgado (agenda)"
                    value={juzgadoSel}
                    onSelect={v => { setJuzgadoSel(v); }}
                    onClear={() => setJuzgadoSel(null)}
                    items={juzgados}
                    loading={loadingJuzgados}
                    placeholder="Seleccionar juzgado de la agenda…"
                    renderBadge={(j) => (
                        <div className="flex items-center gap-2 mt-0.5">
                            {j.tipo && <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{j.tipo}</span>}
                            {j.ciudad && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Building2 className="w-2.5 h-2.5" />{j.ciudad}</span>}
                        </div>
                    )}
                />
                {juzgadoSel && (
                    <div className="flex items-center justify-end -mt-2">
                        <Link href="/contrarios?tab=juzgados" target="_blank" className="flex items-center gap-1 text-xs text-emerald-400/70 hover:text-emerald-400">
                            Ver en agenda <ExternalLink className="w-3 h-3" />
                        </Link>
                    </div>
                )}

                {/* Nº de Autos (si hay juzgado selecto) */}
                {(juzgadoSel || fase === 'Judicial') && (
                    <div>
                        <label className="text-xs font-medium text-slate-400 block mb-1">Nº de Autos</label>
                        <input type="text" value={autos} onChange={e => setAutos(e.target.value)}
                            placeholder="Ej: PO 123/2026"
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-blue-400 font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-colors" />
                    </div>
                )}
            </div>
        </div>
    );

    const TabMediacion = <ModuloMediacion expedienteId={id} />;

    const TabPlazos = (
        <div className="space-y-6">
            <CalculadoraExpediente defaultTipoProceso={fase} />
        </div>
    );

    const TabDocumentacion = (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    Documentos del Expediente
                </h3>
                <button className="text-sm bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors border border-slate-700">
                    Subir Archivo
                </button>
            </div>
            <ul className="divide-y divide-slate-800/50">
                {[1, 2, 3].map((doc) => (
                    <li key={doc} className="p-4 hover:bg-slate-800/30 flex items-center justify-between group transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-200">Escrito_Demanda_Draft_v{doc}.pdf</p>
                                <p className="text-xs text-slate-500">Subido el 20 Feb 2026 • 245 KB</p>
                            </div>
                        </div>
                        <button className="text-emerald-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Descargar
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );

    const TabCorreo = () => {
        const [emails, setEmails] = useState<any[]>([]);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const [needsAuth, setNeedsAuth] = useState(false);
        const [authUrl, setAuthUrl] = useState<string>("");
        const [isSendModalOpen, setIsSendModalOpen] = useState(false);

        const fetchEmails = async () => {
            if (!clienteExp?.email) return;
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/gmail/threads?email=${clienteExp.email}`);
                const data = await res.json();
                if (!res.ok) {
                    if (data.needsAuth) {
                        setNeedsAuth(true);
                        setAuthUrl(data.authUrl);
                    } else {
                        setError(data.error);
                    }
                } else {
                    setEmails(data.threads || []);
                }
            } catch (err) {
                setError("Error al conectar con el servidor");
            } finally {
                setLoading(false);
            }
        };

        useEffect(() => {
            if (activeTab === 'correo') fetchEmails();
        }, [clienteExp?.email, activeTab]);

        if (!clienteExp?.email) {
            return (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                    <MailIcon className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-400">El cliente no tiene un correo electrónico configurado.</p>
                </div>
            );
        }

        if (needsAuth) {
            return (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                    <div className="bg-blue-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <MailIcon className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Conecta tu Gmail profesional</h3>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto">
                        Para ver los correos de este caso, necesitamos permiso para acceder a tu bandeja de entrada de forma segura.
                    </p>
                    <a href={authUrl} className="inline-flex items-center gap-2 bg-white text-slate-950 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all shadow-lg shadow-white/5">
                        Conectar con Google Workspace
                    </a>
                </div>
            );
        }

        return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <MailIcon className="w-5 h-5 text-cyan-400" />
                            Historial de Correos
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Hilos recientes con {clienteExp.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsSendModalOpen(true)}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-900/20 group"
                        >
                            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                            Redactar
                        </button>
                        <button onClick={fetchEmails} disabled={loading}
                            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all disabled:opacity-50 border border-slate-700">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <SendEmailModal
                    isOpen={isSendModalOpen}
                    onClose={() => setIsSendModalOpen(false)}
                    recipientEmail={clienteExp.email}
                    initialSubject={`Expediente: ${caratula ?? numeroExpediente ?? ''}`}
                    onSent={() => {
                        fetchEmails();
                        setToastMensaje({
                            titulo: 'Email enviado correctamente',
                            descripcion: `Se ha enviado el correo a ${clienteExp.email} y quedará registrado en el historial.`
                        });
                        setTimeout(() => setToastMensaje(null), 5000);
                    }}
                />

                {loading && emails.length === 0 ? (
                    <div className="p-20 text-center">
                        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-4" />
                        <p className="text-slate-500 text-sm">Sincronizando con Gmail…</p>
                    </div>
                ) : error ? (
                    <div className="p-12 text-center">
                        <AlertTriangle className="w-10 h-10 text-red-500/50 mx-auto mb-4" />
                        <p className="text-red-400 text-sm">{error}</p>
                        <button onClick={fetchEmails} className="mt-4 text-xs text-emerald-400 hover:underline">Reintentar</button>
                    </div>
                ) : emails.length === 0 ? (
                    <div className="p-20 text-center text-slate-500">
                        <p className="text-sm">No se han encontrado correos intercambiados con este cliente.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-800/50">
                        {emails.map((t) => (
                            <div key={t.id} className="p-5 hover:bg-slate-800/40 transition-colors group cursor-default">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-200 text-sm group-hover:text-cyan-400 transition-colors truncate pr-4">
                                        {t.subject}
                                    </h4>
                                    <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap bg-slate-800 px-2 py-0.5 rounded-full">
                                        {new Date(t.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                                    {t.snippet}
                                </p>
                                <div className="flex items-center gap-4 text-[10px] text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" /> {t.from.split('<')[0].trim()}
                                    </span>
                                    <span className="bg-slate-800/50 px-1.5 py-0.5 rounded transition-colors group-hover:bg-cyan-500/10 group-hover:text-cyan-400">
                                        {t.msgCount} {t.msgCount === 1 ? 'mensaje' : 'mensajes'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="p-4 bg-slate-950/30 border-t border-slate-800">
                    <p className="text-[10px] text-slate-600 text-center flex items-center justify-center gap-1.5">
                        <Clock className="w-3 h-3" /> Sincronización en tiempo real con Workspace · Solo visible para Administradores
                    </p>
                </div>
            </div>
        );
    };

    const { isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState("datos-generales");

    const tabs = [
        { id: "datos-generales", label: "Datos Generales", content: TabDatosGenerales },
        { id: "plazos", label: "Cálculo de Plazos", content: TabPlazos },
        { id: "mediacion", label: "Mediación", content: TabMediacion },
        { id: "documentacion", label: "Documentación", content: TabDocumentacion },
    ];

    if (isAdmin) {
        tabs.push({ id: "correo", label: "Correo", content: <TabCorreo /> });
    }

    return (
        <div className="max-w-5xl mx-auto pb-12 relative animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-8">
                <Link href="/expedientes" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4" />
                    Volver a Expedientes
                </Link>
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-slate-800 text-slate-300 text-xs font-medium px-2.5 py-1 rounded-md font-mono">
                                {numeroExpediente ?? `Exp. #${id.slice(0, 8)}`}
                            </span>
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${fase === 'Extrajudicial'
                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                : 'bg-blue-600 text-white border-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.5)]'
                                }`}>
                                {fase}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                            {caratula ?? 'Cargando expediente…'}
                        </h1>
                        {/* Resumen partes en header */}
                        <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                            {parteContraria && <span className="text-rose-400/80">vs. {parteContraria}</span>}
                            {contrarioSel && <span>· <span className="text-blue-400/80">Abog: {contrarioSel.nombre}</span></span>}
                            {juzgadoSel && <span>· <span className="text-emerald-400/80">Juzg: {juzgadoSel.nombre}</span></span>}
                            {autos && <span>· <span className="text-slate-300 font-mono">{autos}</span></span>}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end mt-2 md:mt-0">
                        {fase === 'Extrajudicial' && (
                            <button
                                onClick={() => setShowModal(true)}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-blue-600/25 flex items-center gap-2 group border border-blue-400/30"
                            >
                                <Gavel className="w-4 h-4 group-hover:-rotate-12 transition-transform" />
                                Pasar a Judicial
                                <ArrowRightCircle className="w-5 h-5 ml-1 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </button>
                        )}
                        {clienteExp?.telefono && (
                            <button
                                onClick={() => setIsWhatsAppModalOpen(true)}
                                className="bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white px-5 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 border border-emerald-500/30 group"
                                title="Enviar WhatsApp al cliente"
                            >
                                <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                WhatsApp Cliente
                            </button>
                        )}
                        <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-700">
                            Editar Expediente
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Barra de Herramientas de Comunicación ── */}
            {clienteExp && (clienteExp.telefono || clienteExp.email) && (
                <div className="mb-8 flex flex-wrap gap-3">
                    {/* WhatsApp directo */}
                    {clienteExp.telefono && (
                        <a
                            href={`https://wa.me/${clienteExp.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Estimado/a ${clienteExp.nombre}, le contacto desde el despacho de Nuria Arau Mediación y Abogacía en relación a su expediente${caratula ? ` (${caratula})` : ''}. Quedo a su disposición.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-2.5 px-4 py-2.5 bg-[#25D366]/10 hover:bg-[#25D366] border border-[#25D366]/30 hover:border-[#25D366] rounded-xl text-[#25D366] hover:text-white transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-[0_0_20px_rgba(37,211,102,0.3)]"
                        >
                            {/* WhatsApp SVG icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            WhatsApp
                        </a>
                    )}

                    {/* SMS */}
                    {clienteExp.telefono && (
                        <a
                            href={`sms:${clienteExp.telefono.replace(/\D/g, '')}?&body=${encodeURIComponent(`Recordatorio de cita en Nuria Arau Mediación y Abogacía${caratula ? ` — Exp: ${caratula}` : ''}. Por favor, confirme su asistencia.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-2.5 px-4 py-2.5 bg-cyan-500/10 hover:bg-cyan-500 border border-cyan-500/30 hover:border-cyan-500 rounded-xl text-cyan-400 hover:text-slate-950 transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                        >
                            <Phone className="w-4 h-4 shrink-0" />
                            SMS
                        </a>
                    )}

                    {/* Email */}
                    {clienteExp.email && (
                        <a
                            href={`mailto:${clienteExp.email}?subject=${encodeURIComponent(`Expediente: ${caratula ?? numeroExpediente ?? 'Consulta'}`)}&body=${encodeURIComponent(`Estimado/a ${clienteExp.nombre},\n\nAdjunto le enviamos información relacionada con su expediente${caratula ? ` «${caratula}»` : ''}.\n\nQuedamos a su disposición para cualquier consulta.\n\nAtentamente,\nNuria Arau\nMediación y Abogacía`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-2.5 px-4 py-2.5 bg-cyan-500/10 hover:bg-cyan-500 border border-cyan-500/30 hover:border-cyan-500 rounded-xl text-cyan-400 hover:text-slate-950 transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                        >
                            <Mail className="w-4 h-4 shrink-0" />
                            Email
                        </a>
                    )}

                    {/* Separador + datos de contacto */}
                    <div className="flex items-center gap-2 ml-2 text-xs text-slate-500 border-l border-slate-800 pl-4">
                        {clienteExp.telefono && <span className="font-mono">{clienteExp.telefono}</span>}
                        {clienteExp.telefono && clienteExp.email && <span>·</span>}
                        {clienteExp.email && <span>{clienteExp.email}</span>}
                    </div>
                </div>
            )}

            {/* WhatsApp Modal */}
            {clienteExp && (
                <WhatsAppModal
                    isOpen={isWhatsAppModalOpen}
                    onClose={() => setIsWhatsAppModalOpen(false)}
                    cliente={clienteExp}
                />
            )}

            {/* Tabs */}
            <Tabs tabs={tabs} defaultTab="datos-generales" onTabChange={(id) => setActiveTab(id)} />

            {/* Toast Alerta */}
            {toastMensaje && (
                <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right-8 fade-in duration-300">
                    <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3 shadow-2xl shadow-emerald-900/20 max-w-sm">
                        <div className="p-2 bg-emerald-500/20 rounded-lg shrink-0 mt-0.5">
                            <AlertTriangle className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white mb-1">{toastMensaje.titulo}</h4>
                            <p className="text-sm text-slate-300 leading-snug">{toastMensaje.descripcion}</p>
                        </div>
                        <button onClick={() => setToastMensaje(null)} className="text-slate-400 hover:text-white ml-2 flex-shrink-0">×</button>
                    </div>
                </div>
            )}

            {/* Modal Pasar a Judicial — con selector de juzgado de agenda */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
                        <div className="flex items-center gap-3 mb-4 text-blue-400">
                            <Gavel className="w-6 h-6" />
                            <h2 className="text-xl font-bold text-white">Transición a Judicial</h2>
                        </div>
                        <p className="text-sm text-slate-300 mb-6">
                            Estás a punto de judicializar este expediente. El sistema activará el cómputo estricto de días hábiles.
                        </p>

                        <div className="space-y-4 mb-8">
                            {/* Selector de juzgado desde agenda */}
                            <AgendaPicker<JuzgadoItem>
                                label="Juzgado Asignado (desde agenda)"
                                value={juzgadoSel}
                                onSelect={v => { setJuzgadoSel(v); setTempJuzgado(v.nombre); }}
                                onClear={() => { setJuzgadoSel(null); setTempJuzgado(""); }}
                                items={juzgados}
                                loading={loadingJuzgados}
                                placeholder="Seleccionar juzgado…"
                                renderBadge={(j) => j.ciudad ? <span className="text-[10px] text-slate-400">{j.ciudad}</span> : null}
                            />
                            {/* Texto libre si no está en agenda */}
                            {!juzgadoSel && (
                                <input type="text" placeholder="O escribe el nombre del juzgado…"
                                    value={tempJuzgado} onChange={e => setTempJuzgado(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-slate-600 text-sm" />
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Número de Autos</label>
                                <input type="text" placeholder="Ej. PO 123/2026"
                                    value={tempAutos} onChange={e => setTempAutos(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-slate-600" />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowModal(false)}
                                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
                                Cancelar
                            </button>
                            <button onClick={handlePasarJudicial} disabled={!tempJuzgado || !tempAutos}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2">
                                Confirmar Salto
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
