"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
    Plus, Pencil, Trash2, FileText, Search, X, Save,
    Copy, Eye, ChevronDown, Loader2, BookOpen, Tag, Wand2
} from "lucide-react";

type Plantilla = {
    id: string; titulo: string; categoria: string;
    descripcion: string | null; contenido: string;
    variables: string[]; usos: number; updated_at: string;
};

const CATEGORIAS = ["Todas", "Reclamaciones", "Encargos", "Requerimientos", "Contratos", "RGPD", "Mediación", "General"];

// Detecta automáticamente las variables {{xxx}} en el contenido
const detectarVariables = (texto: string): string[] => {
    const matches = texto.matchAll(/{{(\w+)}}/g);
    return [...new Set([...matches].map(m => m[1]))];
};

// Sustituye variables en el texto
const rellenar = (texto: string, vars: Record<string, string>): string => {
    let result = texto;
    for (const [k, v] of Object.entries(vars)) {
        result = result.replace(new RegExp(`{{${k}}}`, "g"), v || `{{${k}}}`);
    }
    return result;
};

// Nombres legibles para las variables comunes
const LABELS: Record<string, string> = {
    nombre: "Nombre cliente", apellidos: "Apellidos", dni: "DNI/NIE",
    telefono: "Teléfono", email: "Email", direccion: "Dirección cliente",
    fecha: "Fecha", ciudad: "Ciudad",
    destinatario: "Destinatario (parte contraria)", direccion_destinatario: "Dirección destinatario",
    domicilio_destinatario: "Domicilio destinatario",
    abogado_contrario: "Abogado contrario", procurador_contrario: "Procurador contrario",
    juzgado: "Juzgado", autos: "Nº de Autos",
    cantidad: "Cantidad reclamada (€)", plazo_dias: "Plazo (días hábiles)",
    descripcion_hechos: "Descripción de los hechos", texto_requerimiento: "Texto del requerimiento",
    objeto_encargo: "Objeto del encargo", honorarios: "Honorarios pactados",
    forma_pago: "Forma de pago", importe_total: "Importe total",
    servicios: "Servicios contratados", concepto: "Concepto",
};

export default function PlantillasPage() {
    const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");

    // Estados modales
    const [modalEditor, setModalEditor] = useState<"nueva" | Plantilla | null>(null);
    const [modalUso, setModalUso] = useState<Plantilla | null>(null);

    // Form editor
    const [formTitulo, setFormTitulo] = useState("");
    const [formCategoria, setFormCategoria] = useState("General");
    const [formDescripcion, setFormDescripcion] = useState("");
    const [formContenido, setFormContenido] = useState("");
    const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
    const mostrarToast = (msg: string, type: "ok" | "err" = "ok") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const guardarPlantilla = async () => {
        if (!formTitulo.trim() || !formContenido.trim()) return;
        const vars = detectarVariables(formContenido);
        const payload = {
            titulo: formTitulo.trim(),
            categoria: formCategoria,
            descripcion: formDescripcion.trim() || null,
            contenido: formContenido,
            variables: vars,
        };

        const esNueva = modalEditor === "nueva";
        const idEditar = esNueva ? null : (modalEditor as Plantilla).id;

        // ---- Optimistic update: cerrar modal AL INSTANTE ----
        if (esNueva) {
            const tempId = `temp-${Date.now()}`;
            setPlantillas(prev => [
                { ...payload, id: tempId, descripcion: payload.descripcion ?? null, usos: 0, updated_at: new Date().toISOString() },
                ...prev,
            ]);
        } else {
            setPlantillas(prev => prev.map(p =>
                p.id === idEditar
                    ? { ...p, ...payload, descripcion: payload.descripcion ?? null, updated_at: new Date().toISOString() }
                    : p
            ));
        }
        setModalEditor(null);

        // ---- Persistir en background ----
        try {
            if (esNueva) {
                const { error } = await supabase.from("plantillas_documentos").insert([payload]);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("plantillas_documentos").update(payload).eq("id", idEditar!);
                if (error) throw error;
            }
            mostrarToast(esNueva ? "✅ Plantilla guardada correctamente" : "✅ Plantilla actualizada");
            fetchPlantillas(); // Sincronizar IDs reales
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Error desconocido";
            mostrarToast("❌ Error al guardar: " + msg, "err");
            fetchPlantillas(); // Revertir optimistic update
        }
    };

    // Form uso / relleno
    const [varsRelleno, setVarsRelleno] = useState<Record<string, string>>({});
    const [vistaPrevia, setVistaPrevia] = useState(false);
    const [guardando] = useState(false); // kept for button disabled compat — actual save is instant

    // Cargar plantillas
    const fetchPlantillas = async () => {
        setCargando(true);
        const { data } = await supabase
            .from("plantillas_documentos")
            .select("*")
            .order("updated_at", { ascending: false });
        setPlantillas(data ?? []);
        setCargando(false);
    };
    useEffect(() => { fetchPlantillas(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Abrir editor
    const abrirEditor = (plantilla: "nueva" | Plantilla) => {
        if (plantilla === "nueva") {
            setFormTitulo(""); setFormCategoria("General");
            setFormDescripcion(""); setFormContenido("");
        } else {
            setFormTitulo(plantilla.titulo); setFormCategoria(plantilla.categoria);
            setFormDescripcion(plantilla.descripcion ?? ""); setFormContenido(plantilla.contenido);
        }
        setModalEditor(plantilla);
    };

    const eliminarPlantilla = async (id: string) => {

        if (!confirm("¿Eliminar esta plantilla?")) return;
        await supabase.from("plantillas_documentos").delete().eq("id", id);
        setPlantillas(prev => prev.filter(p => p.id !== id));
    };

    // Abrir modal de uso
    const abrirUso = (plantilla: Plantilla) => {
        const vars = detectarVariables(plantilla.contenido);
        const init: Record<string, string> = {};
        // Pre-rellenar fecha con hoy
        vars.forEach(v => { init[v] = v === "fecha" ? new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }) : ""; });
        setVarsRelleno(init);
        setVistaPrevia(false);
        setModalUso(plantilla);
        // Incrementar contador de usos
        supabase.from("plantillas_documentos").update({ usos: (plantilla.usos ?? 0) + 1 }).eq("id", plantilla.id).then(() => { });
    };

    const copiarDocumento = () => {
        if (!modalUso) return;
        navigator.clipboard.writeText(rellenar(modalUso.contenido, varsRelleno));
    };

    const imprimirDocumento = () => {
        if (!modalUso) return;
        const w = window.open("", "_blank");
        if (!w) return;
        w.document.write(`<html><head><title>${modalUso.titulo}</title>
        <style>body{font-family:Georgia,serif;max-width:700px;margin:60px auto;font-size:14px;line-height:1.8;color:#111}
        pre{white-space:pre-wrap;font-family:inherit}</style></head>
        <body><pre>${rellenar(modalUso.contenido, varsRelleno)}</pre></body></html>`);
        w.document.close();
        w.print();
    };

    // Filtro
    const plantillasFiltradas = plantillas.filter(p => {
        const matchBusqueda = p.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
            (p.descripcion ?? "").toLowerCase().includes(busqueda.toLowerCase());
        const matchCategoria = categoriaFiltro === "Todas" || p.categoria === categoriaFiltro;
        return matchBusqueda && matchCategoria;
    });

    const textoRelleno = modalUso ? rellenar(modalUso.contenido, varsRelleno) : "";
    const variablesModalUso = modalUso ? detectarVariables(modalUso.contenido) : [];

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Toast de confirmación */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold transition-all animate-in slide-in-from-bottom-4 fade-in ${toast.type === "ok"
                        ? "bg-emerald-600 text-white"
                        : "bg-red-600 text-white"
                    }`}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Plantillas Documentales</h1>
                    <p className="text-slate-400 text-sm">Crea y rellena documentos con datos del cliente, contrario y más.</p>
                </div>
                <button onClick={() => abrirEditor("nueva")}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-600/20">
                    <Plus className="w-4 h-4" /> Nueva Plantilla
                </button>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
                        placeholder="Buscar plantillas…"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {CATEGORIAS.map(cat => (
                        <button key={cat} onClick={() => setCategoriaFiltro(cat)}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${categoriaFiltro === cat ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"}`}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid de plantillas */}
            {cargando ? (
                <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" /> Cargando plantillas…
                </div>
            ) : plantillasFiltradas.length === 0 ? (
                <div className="py-20 text-center bg-slate-900 rounded-2xl border border-slate-800 border-dashed space-y-3">
                    <BookOpen className="w-10 h-10 text-slate-700 mx-auto" />
                    <p className="text-slate-500">No hay plantillas{busqueda ? ` para "${busqueda}"` : ""}.</p>
                    <button onClick={() => abrirEditor("nueva")} className="text-sm text-emerald-400 hover:text-emerald-300">Crear la primera →</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {plantillasFiltradas.map(p => (
                        <div key={p.id} className="group bg-slate-900 border border-slate-800 hover:border-emerald-500/30 rounded-2xl p-5 flex flex-col gap-4 transition-all hover:-translate-y-0.5">
                            {/* Header card */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="p-2.5 bg-emerald-500/10 rounded-xl shrink-0">
                                    <FileText className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => abrirEditor(p)} title="Editar"
                                        className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => eliminarPlantilla(p.id)} title="Eliminar"
                                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                                        {p.categoria}
                                    </span>
                                    {p.usos > 0 && <span className="text-[10px] text-slate-500">{p.usos} usos</span>}
                                </div>
                                <h3 className="text-sm font-bold text-white mb-1">{p.titulo}</h3>
                                {p.descripcion && <p className="text-xs text-slate-400 line-clamp-2">{p.descripcion}</p>}
                            </div>

                            {/* Variables chip list */}
                            {p.variables.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {p.variables.slice(0, 5).map(v => (
                                        <span key={v} className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                                            {"{{"}{v}{"}}"}
                                        </span>
                                    ))}
                                    {p.variables.length > 5 && (
                                        <span className="text-[10px] text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                                            +{p.variables.length - 5} más
                                        </span>
                                    )}
                                </div>
                            )}

                            <button onClick={() => abrirUso(p)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 rounded-xl transition-colors">
                                <Wand2 className="w-4 h-4 text-emerald-400" /> Usar Plantilla
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* =========================================================
                MODAL: Editor de plantilla (Nueva / Editar)
            ========================================================= */}
            {modalEditor !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <h2 className="text-lg font-bold text-white">
                                {modalEditor === "nueva" ? "Nueva Plantilla" : `Editar: ${(modalEditor as Plantilla).titulo}`}
                            </h2>
                            <button onClick={() => setModalEditor(null)} className="text-slate-500 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-5 space-y-4">
                            {/* Título + categoría */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-slate-400 block mb-1">Título *</label>
                                    <input value={formTitulo} onChange={e => setFormTitulo(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Ej: Reclamación Extrajudicial" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-400 block mb-1">Categoría</label>
                                    <select value={formCategoria} onChange={e => setFormCategoria(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                        {CATEGORIAS.filter(c => c !== "Todas").map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-400 block mb-1">Descripción</label>
                                <input value={formDescripcion} onChange={e => setFormDescripcion(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="Breve descripción (opcional)" />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-medium text-slate-400">Contenido del documento *</label>
                                    <span className="text-[10px] text-slate-500">Usa {"{{variable}}"} para datos que se rellenarán</span>
                                </div>
                                <textarea value={formContenido} onChange={e => setFormContenido(e.target.value)}
                                    rows={16}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
                                    placeholder={"Escribe el documento. Usa {{nombre}}, {{dni}}, {{apellidos}}, {{fecha}}, {{destinatario}}, {{cantidad}}…"} />
                            </div>

                            {/* Variables detectadas */}
                            {formContenido && detectarVariables(formContenido).length > 0 && (
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
                                    <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-2">
                                        <Tag className="w-3.5 h-3.5" /> Variables detectadas:
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {detectarVariables(formContenido).map(v => (
                                            <span key={v} className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                                {"{{"}{v}{"}}"}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Guía rápida de variables */}
                            <details className="group">
                                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300 flex items-center gap-1.5">
                                    <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" /> Variables disponibles
                                </summary>
                                <div className="mt-2 grid grid-cols-2 gap-1.5 bg-slate-800/30 rounded-xl p-3 border border-slate-700/50">
                                    {Object.entries(LABELS).map(([key, label]) => (
                                        <div key={key} className="flex items-center gap-2 text-xs">
                                            <code className="text-violet-400">{"{{"}{key}{"}}"}</code>
                                            <span className="text-slate-500">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </details>
                        </div>

                        <div className="flex gap-3 p-5 border-t border-slate-800">
                            <button onClick={() => setModalEditor(null)}
                                className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
                                Cancelar
                            </button>
                            <button onClick={guardarPlantilla} disabled={!formTitulo.trim() || !formContenido.trim() || guardando}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-xl transition-colors shadow-lg shadow-emerald-600/20">
                                {guardando ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</> : <><Save className="w-4 h-4" /> Guardar Plantilla</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
                MODAL: Usar Plantilla (rellenar + vista previa)
            ========================================================= */}
            {modalUso && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <div>
                                <h2 className="text-lg font-bold text-white">{modalUso.titulo}</h2>
                                <p className="text-xs text-slate-400">Rellena los campos y genera el documento</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setVistaPrevia(v => !v)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${vistaPrevia ? "bg-slate-700 text-white border-slate-600" : "bg-slate-800 text-slate-400 hover:text-white border-slate-700"}`}>
                                    <Eye className="w-3.5 h-3.5" /> {vistaPrevia ? "Ocultar" : "Vista Previa"}
                                </button>
                                <button onClick={() => setModalUso(null)} className="text-slate-500 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden flex">
                            {/* Panel izquierdo: formulario de variables */}
                            <div className="w-full lg:w-80 border-r border-slate-800 overflow-y-auto p-5 space-y-4 shrink-0">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Datos del documento</p>
                                {variablesModalUso.map(v => (
                                    <div key={v}>
                                        <label className="text-xs font-medium text-slate-400 block mb-1">
                                            {LABELS[v] || v.replace(/_/g, " ")}
                                        </label>
                                        {(v === "descripcion_hechos" || v === "texto_requerimiento" || v === "objeto_encargo" || v === "servicios") ? (
                                            <textarea rows={4} value={varsRelleno[v] ?? ""}
                                                onChange={e => setVarsRelleno(prev => ({ ...prev, [v]: e.target.value }))}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                                placeholder={LABELS[v] || v} />
                                        ) : (
                                            <input type="text" value={varsRelleno[v] ?? ""}
                                                onChange={e => setVarsRelleno(prev => ({ ...prev, [v]: e.target.value }))}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                placeholder={LABELS[v] || v} />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Panel derecho: documento generado */}
                            <div className="flex-1 overflow-y-auto">
                                <div className="bg-white rounded-r-2xl h-full p-8">
                                    <div className="max-w-2xl mx-auto">
                                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nuria Arau · Mediación y Abogacía</p>
                                                <h2 className="text-lg font-bold text-slate-900">{modalUso.titulo}</h2>
                                            </div>
                                        </div>
                                        <pre className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-serif">
                                            {textoRelleno}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-3 p-5 border-t border-slate-800">
                            <button onClick={() => setModalUso(null)}
                                className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors">
                                Cerrar
                            </button>
                            <button onClick={copiarDocumento}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors">
                                <Copy className="w-4 h-4" /> Copiar texto
                            </button>
                            <button onClick={imprimirDocumento}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-lg shadow-emerald-600/20">
                                <FileText className="w-4 h-4" /> Imprimir / Guardar PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
