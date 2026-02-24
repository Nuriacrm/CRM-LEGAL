"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { PLANTILLAS, rellenarPlantilla, type PlantillaId } from "@/lib/plantillasFirma";
import SignaturePad, { type SignaturePadRef } from "@/components/ui/SignaturePad";
import {
    FileSignature, Send, Copy, ExternalLink, CheckCheck,
    Clock, AlertCircle, Plus, ChevronRight, Loader2,
    FileText, Users, PenLine, ArrowLeft, Eye, EyeOff, X
} from "lucide-react";

type SolicitudFirma = {
    id: string; token: string; cliente_nombre: string;
    titulo_documento: string; estado: "pendiente" | "firmado" | "expirado";
    created_at: string; firmado_at: string | null;
};

// ---- Fetch de clientes para el selector ----
type ClienteOption = { id: string; nombre: string; apellidos: string | null; dni_nie: string | null };

export default function FirmasPage() {
    const [solicitudes, setSolicitudes] = useState<SolicitudFirma[]>([]);
    const [clientes, setClientes] = useState<ClienteOption[]>([]);
    const [cargando, setCargando] = useState(true);
    const [vista, setVista] = useState<"lista" | "nueva">("lista");

    // Form nueva solicitud
    const [plantillaId, setPlantillaId] = useState<PlantillaId>("rgpd");
    const [clienteId, setClienteId] = useState("");
    const [varsAdicionales, setVarsAdicionales] = useState<Record<string, string>>({});
    const [previstaVisible, setPrevistaVisible] = useState(false);
    const [generando, setGenerando] = useState(false);
    const [enlaceGenerado, setEnlaceGenerado] = useState<string | null>(null);

    const plantillaActual = PLANTILLAS.find(p => p.id === plantillaId)!;
    const clienteActual = clientes.find(c => c.id === clienteId);

    // Construir vars para preview
    const vars = {
        nombre: `${clienteActual?.nombre ?? "{{nombre}}"}${clienteActual?.apellidos ? " " + clienteActual.apellidos : ""}`,
        dni: clienteActual?.dni_nie ?? "{{dni}}",
        fecha: new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }),
        ...varsAdicionales,
    };
    const textoPreview = rellenarPlantilla(plantillaActual, vars);

    useEffect(() => {
        const fetchAll = async () => {
            setCargando(true);
            const [{ data: sols }, { data: cls }] = await Promise.all([
                supabase.from("solicitudes_firma")
                    .select("id,token,cliente_nombre,titulo_documento,estado,created_at,firmado_at")
                    .order("created_at", { ascending: false }),
                supabase.from("clientes")
                    .select("id,nombre,apellidos,dni_nie")
                    .order("nombre", { ascending: true }),
            ]);
            setSolicitudes(sols ?? []);
            setClientes(cls ?? []);
            setCargando(false);
        };
        fetchAll();
    }, []);

    // Cuando cambia plantilla, resetear vars adicionales
    useEffect(() => {
        setVarsAdicionales({});
    }, [plantillaId]);

    const handleCrear = async () => {
        if (!clienteId || !plantillaActual) return;
        setGenerando(true);

        const clienteNombre = `${clienteActual?.nombre} ${clienteActual?.apellidos ?? ""}`.trim();
        const { data, error } = await supabase
            .from("solicitudes_firma")
            .insert([{
                cliente_id: clienteId,
                cliente_nombre: clienteNombre,
                tipo_documento: plantillaId,
                titulo_documento: plantillaActual.titulo,
                contenido_documento: textoPreview,
            }])
            .select("token")
            .single();

        setGenerando(false);
        if (error || !data) { alert("Error al crear solicitud: " + error?.message); return; }

        const enlace = `${window.location.origin}/firmar/${data.token}`;
        setEnlaceGenerado(enlace);
        setSolicitudes(prev => [{
            id: "", token: data.token, cliente_nombre: clienteNombre,
            titulo_documento: plantillaActual.titulo,
            estado: "pendiente", created_at: new Date().toISOString(), firmado_at: null,
        }, ...prev]);
    };

    const copiar = (texto: string) => navigator.clipboard.writeText(texto);

    // ---- Stats ----
    const total = solicitudes.length;
    const firmados = solicitudes.filter(s => s.estado === "firmado").length;
    const pendientes = solicitudes.filter(s => s.estado === "pendiente").length;

    if (cargando) return (
        <div className="flex items-center justify-center h-60 gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
            Cargando módulo de firma digital…
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Firma Digital</h1>
                    <p className="text-slate-400">Genera y envía documentos para firma electrónica al cliente.</p>
                </div>
                <button
                    onClick={() => { setVista(v => v === "lista" ? "nueva" : "lista"); setEnlaceGenerado(null); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg ${vista === "nueva"
                        ? "bg-slate-700 hover:bg-slate-600 text-white"
                        : "bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/20"}`}
                >
                    {vista === "nueva" ? <><ArrowLeft className="w-4 h-4" /> Ver Historial</> : <><Plus className="w-4 h-4" /> Nueva Solicitud</>}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Total Enviados", value: total, icon: FileText, color: "text-slate-400 bg-slate-800" },
                    { label: "Pendientes", value: pendientes, icon: Clock, color: "text-amber-400 bg-amber-500/10" },
                    { label: "Firmados", value: firmados, icon: CheckCheck, color: "text-emerald-400 bg-emerald-500/10" },
                ].map(s => (
                    <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${s.color.split(" ")[1]}`}>
                            <s.icon className={`w-6 h-6 ${s.color.split(" ")[0]}`} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{s.value}</p>
                            <p className="text-sm text-slate-400">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Vista: Nueva Solicitud */}
            {vista === "nueva" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Formulario */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <PenLine className="w-5 h-5 text-violet-400" /> Configurar Documento
                        </h2>

                        {/* Cliente */}
                        <div>
                            <label className="text-xs font-medium text-slate-400 block mb-1.5">Cliente *</label>
                            <select value={clienteId} onChange={e => setClienteId(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                                <option value="">— Selecciona un cliente —</option>
                                {clientes.map(c => (
                                    <option key={c.id} value={c.id}>{c.nombre} {c.apellidos ?? ""} {c.dni_nie ? `· ${c.dni_nie}` : ""}</option>
                                ))}
                            </select>
                        </div>

                        {/* Plantilla */}
                        <div>
                            <label className="text-xs font-medium text-slate-400 block mb-1.5">Plantilla de documento *</label>
                            <div className="grid grid-cols-1 gap-2">
                                {PLANTILLAS.map(p => (
                                    <button key={p.id} onClick={() => setPlantillaId(p.id)}
                                        className={`text-left px-4 py-3 rounded-xl border transition-all ${plantillaId === p.id
                                            ? "border-violet-500/50 bg-violet-500/10 text-white"
                                            : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"}`}>
                                        <p className="text-sm font-semibold">{p.titulo}</p>
                                        <p className="text-xs mt-0.5 opacity-70">{p.descripcion}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Variables adicionales */}
                        {plantillaActual.variables.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Datos adicionales</p>
                                {plantillaActual.variables.map(v => (
                                    <div key={v}>
                                        <label className="text-xs font-medium text-slate-400 block mb-1 capitalize">{v.replace(/_/g, " ")}</label>
                                        {v === "concepto_reclamacion" || v === "servicios" || v === "contenido" ? (
                                            <textarea rows={4} value={varsAdicionales[v] ?? ""}
                                                onChange={e => setVarsAdicionales(prev => ({ ...prev, [v]: e.target.value }))}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                                                placeholder={`Describe ${v.replace(/_/g, " ")}…`} />
                                        ) : (
                                            <input type="text" value={varsAdicionales[v] ?? ""}
                                                onChange={e => setVarsAdicionales(prev => ({ ...prev, [v]: e.target.value }))}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                                placeholder={v.replace(/_/g, " ")} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Botones */}
                        {!enlaceGenerado ? (
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setPrevistaVisible(v => !v)}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors">
                                    {previstaVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    {previstaVisible ? "Ocultar" : "Vista Previa"}
                                </button>
                                <button onClick={handleCrear} disabled={!clienteId || generando}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors shadow-lg shadow-violet-600/20">
                                    {generando ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando…</> : <><Send className="w-4 h-4" /> Generar Enlace de Firma</>}
                                </button>
                            </div>
                        ) : (
                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-3">
                                <p className="text-sm font-bold text-emerald-400">✅ Enlace generado — válido 72 horas</p>
                                <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 border border-slate-700">
                                    <code className="flex-1 text-xs text-violet-300 truncate">{enlaceGenerado}</code>
                                    <button onClick={() => copiar(enlaceGenerado)} title="Copiar"
                                        className="text-slate-400 hover:text-violet-400 transition-colors shrink-0">
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Hola " + (clienteActual?.nombre ?? "") + ", aquí tienes el documento para firmar: " + enlaceGenerado)}`}
                                        target="_blank" rel="noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/30 rounded-xl transition-colors">
                                        <Send className="w-3.5 h-3.5" /> WhatsApp
                                    </a>
                                    <a href={`mailto:?subject=${encodeURIComponent(plantillaActual.titulo)}&body=${encodeURIComponent("Accede al documento para firmar: " + enlaceGenerado)}`}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors">
                                        <ExternalLink className="w-3.5 h-3.5" /> Email
                                    </a>
                                    <button onClick={() => { setEnlaceGenerado(null); setClienteId(""); setVarsAdicionales({}); }}
                                        className="px-3 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Preview del documento */}
                    <div className={`transition-all ${previstaVisible ? "block" : "hidden lg:block opacity-40"}`}>
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 h-full">
                            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
                                <FileText className="w-4 h-4 text-slate-400" />
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vista previa del documento</p>
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 mb-4">{plantillaActual.titulo}</h2>
                            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-mono bg-slate-50 rounded-xl p-4 max-h-[500px] overflow-y-auto border border-slate-100">
                                {textoPreview}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Vista: Historial */}
            {vista === "lista" && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-300">Historial de Solicitudes</p>
                        <p className="text-xs text-slate-500">{solicitudes.length} total</p>
                    </div>
                    {solicitudes.length === 0 ? (
                        <div className="py-16 text-center space-y-3">
                            <FileSignature className="w-10 h-10 text-slate-700 mx-auto" />
                            <p className="text-slate-500">Todavía no hay solicitudes de firma.</p>
                            <button onClick={() => setVista("nueva")}
                                className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
                                Crear la primera →
                            </button>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-800">
                            {solicitudes.map((s, i) => (
                                <li key={s.token + i} className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/40 transition-colors group">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className={`p-2 rounded-lg shrink-0 ${s.estado === "firmado" ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>
                                            {s.estado === "firmado"
                                                ? <CheckCheck className="w-4 h-4 text-emerald-400" />
                                                : <Clock className="w-4 h-4 text-amber-400" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-white truncate">{s.titulo_documento}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {s.cliente_nombre} · {new Date(s.created_at).toLocaleDateString("es-ES")}
                                                {s.firmado_at && <> · Firmado el {new Date(s.firmado_at).toLocaleDateString("es-ES")}</>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-4">
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.estado === "firmado"
                                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                            }`}>
                                            {s.estado === "firmado" ? "✅ Firmado" : "🟡 Pendiente"}
                                        </span>
                                        {s.estado === "pendiente" && (
                                            <>
                                                <button onClick={() => copiar(`${window.location.origin}/firmar/${s.token}`)}
                                                    className="p-1.5 text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Copiar enlace">
                                                    <Copy className="w-3.5 h-3.5" />
                                                </button>
                                                <a href={`/firmar/${s.token}`} target="_blank" rel="noreferrer"
                                                    className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Abrir enlace">
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            </>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
