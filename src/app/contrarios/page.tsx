"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
    Plus, Pencil, Trash2, Search, Phone, Mail, MapPin,
    Building2, User, Scale, Loader2, X, Save, Users2,
    Gavel, ChevronRight, Hash, FileText
} from "lucide-react";

// ---- Types ----
type Contrario = {
    id: string; nombre: string; tipo: string; despacho: string | null;
    colegio_num: string | null; telefono: string | null; email: string | null;
    direccion: string | null; ciudad: string | null; observaciones: string | null;
    expedientes_count: number; created_at: string;
};
type Juzgado = {
    id: string; nombre: string; tipo: string | null; ciudad: string | null;
    partido_judicial: string | null; direccion: string | null;
    telefono: string | null; fax: string | null; observaciones: string | null;
    expedientes_count: number; created_at: string;
};

const TIPOS_CONTRARIO = ["Abogado Contrario", "Procurador", "Parte Contraria", "Empresa", "Otro"];
const TIPOS_JUZGADO = ["Primera Instancia", "Instrucción", "Social", "Contencioso-Administrativo", "Mercantil", "Familia", "Penal", "Tribunal Superior", "Otro"];

// ---- Helper Card ----
function EmptyState({ icon: Icon, msg, onAdd }: { icon: React.ElementType; msg: string; onAdd: () => void }) {
    return (
        <div className="py-20 text-center bg-slate-900 rounded-2xl border border-slate-800 border-dashed space-y-3">
            <Icon className="w-10 h-10 text-slate-700 mx-auto" />
            <p className="text-slate-500">{msg}</p>
            <button onClick={onAdd} className="text-sm text-emerald-400 hover:text-emerald-300">Añadir el primero →</button>
        </div>
    );
}

export default function ContrariosPage() {
    const [tab, setTab] = useState<"contrarios" | "juzgados">("contrarios");
    const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
    const mostrarToast = (msg: string, type: "ok" | "err" = "ok") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ---- CONTRARIOS ----
    const [contrarios, setContrarios] = useState<Contrario[]>([]);
    const [cargandoC, setCargandoC] = useState(true);
    const [busquedaC, setBusquedaC] = useState("");
    const [tipoFiltroC, setTipoFiltroC] = useState("Todos");
    const [modalC, setModalC] = useState<"nuevo" | Contrario | null>(null);
    const [formC, setFormC] = useState<Partial<Contrario>>({});

    const fetchContrarios = useCallback(async () => {
        setCargandoC(true);
        const { data } = await supabase.from("contrarios").select("*").order("nombre");
        setContrarios(data ?? []);
        setCargandoC(false);
    }, []);

    useEffect(() => { fetchContrarios(); }, [fetchContrarios]);

    const abrirModalC = (item: "nuevo" | Contrario) => {
        setFormC(item === "nuevo" ? { tipo: "Abogado Contrario" } : { ...item });
        setModalC(item);
    };

    const guardarContrario = async () => {
        if (!formC.nombre?.trim()) return;
        const esNuevo = modalC === "nuevo";
        const payload = {
            nombre: formC.nombre!.trim(), tipo: formC.tipo || "Abogado Contrario",
            despacho: formC.despacho || null, colegio_num: formC.colegio_num || null,
            telefono: formC.telefono || null, email: formC.email || null,
            direccion: formC.direccion || null, ciudad: formC.ciudad || null,
            observaciones: formC.observaciones || null,
        };
        // Optimistic
        if (esNuevo) {
            setContrarios(prev => [{ ...payload, id: `tmp-${Date.now()}`, expedientes_count: 0, created_at: new Date().toISOString() }, ...prev]);
        } else {
            setContrarios(prev => prev.map(c => c.id === (modalC as Contrario).id ? { ...c, ...payload } : c));
        }
        setModalC(null);
        try {
            if (esNuevo) {
                const { error } = await supabase.from("contrarios").insert([payload]);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("contrarios").update(payload).eq("id", (modalC as Contrario).id);
                if (error) throw error;
            }
            mostrarToast(esNuevo ? "✅ Contrario añadido" : "✅ Contrario actualizado");
            fetchContrarios();
        } catch (e: unknown) {
            mostrarToast("❌ Error: " + (e instanceof Error ? e.message : "desconocido"), "err");
            fetchContrarios();
        }
    };

    const eliminarContrario = async (id: string) => {
        if (!confirm("¿Eliminar este contrario?")) return;
        setContrarios(prev => prev.filter(c => c.id !== id));
        await supabase.from("contrarios").delete().eq("id", id);
        mostrarToast("🗑️ Contrario eliminado");
    };

    const contrariosFiltrados = contrarios.filter(c => {
        const q = busquedaC.toLowerCase();
        return (c.nombre.toLowerCase().includes(q) || (c.despacho ?? "").toLowerCase().includes(q) || (c.ciudad ?? "").toLowerCase().includes(q))
            && (tipoFiltroC === "Todos" || c.tipo === tipoFiltroC);
    });

    // ---- JUZGADOS ----
    const [juzgados, setJuzgados] = useState<Juzgado[]>([]);
    const [cargandoJ, setCargandoJ] = useState(true);
    const [busquedaJ, setBusquedaJ] = useState("");
    const [modalJ, setModalJ] = useState<"nuevo" | Juzgado | null>(null);
    const [formJ, setFormJ] = useState<Partial<Juzgado>>({});

    const fetchJuzgados = useCallback(async () => {
        setCargandoJ(true);
        const { data } = await supabase.from("juzgados").select("*").order("nombre");
        setJuzgados(data ?? []);
        setCargandoJ(false);
    }, []);

    useEffect(() => { fetchJuzgados(); }, [fetchJuzgados]);

    const abrirModalJ = (item: "nuevo" | Juzgado) => {
        setFormJ(item === "nuevo" ? { tipo: "Primera Instancia" } : { ...item });
        setModalJ(item);
    };

    const guardarJuzgado = async () => {
        if (!formJ.nombre?.trim()) return;
        const esNuevo = modalJ === "nuevo";
        const payload = {
            nombre: formJ.nombre!.trim(), tipo: formJ.tipo || "Primera Instancia",
            ciudad: formJ.ciudad || null, partido_judicial: formJ.partido_judicial || null,
            direccion: formJ.direccion || null, telefono: formJ.telefono || null,
            fax: formJ.fax || null, observaciones: formJ.observaciones || null,
        };
        if (esNuevo) {
            setJuzgados(prev => [{ ...payload, id: `tmp-${Date.now()}`, expedientes_count: 0, created_at: new Date().toISOString() }, ...prev]);
        } else {
            setJuzgados(prev => prev.map(j => j.id === (modalJ as Juzgado).id ? { ...j, ...payload } : j));
        }
        setModalJ(null);
        try {
            if (esNuevo) {
                const { error } = await supabase.from("juzgados").insert([payload]);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("juzgados").update(payload).eq("id", (modalJ as Juzgado).id);
                if (error) throw error;
            }
            mostrarToast(esNuevo ? "✅ Juzgado añadido" : "✅ Juzgado actualizado");
            fetchJuzgados();
        } catch (e: unknown) {
            mostrarToast("❌ Error: " + (e instanceof Error ? e.message : "desconocido"), "err");
            fetchJuzgados();
        }
    };

    const eliminarJuzgado = async (id: string) => {
        if (!confirm("¿Eliminar este juzgado?")) return;
        setJuzgados(prev => prev.filter(j => j.id !== id));
        await supabase.from("juzgados").delete().eq("id", id);
        mostrarToast("🗑️ Juzgado eliminado");
    };

    const juzgadosFiltrados = juzgados.filter(j => {
        const q = busquedaJ.toLowerCase();
        return j.nombre.toLowerCase().includes(q) || (j.ciudad ?? "").toLowerCase().includes(q);
    });

    const coloresContrario: Record<string, string> = {
        "Abogado Contrario": "text-blue-400 bg-blue-500/10 border-blue-500/20",
        "Procurador": "text-violet-400 bg-violet-500/10 border-violet-500/20",
        "Parte Contraria": "text-orange-400 bg-orange-500/10 border-orange-500/20",
        "Empresa": "text-teal-400 bg-teal-500/10 border-teal-500/20",
        "Otro": "text-slate-400 bg-slate-500/10 border-slate-500/20",
    };

    // ---- Field helper ----
    const field = (label: string, val: string | undefined | null, setter: (v: string) => void, placeholder = "", textarea = false) => (
        <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">{label}</label>
            {textarea ? (
                <textarea rows={3} value={val ?? ""} onChange={e => setter(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    placeholder={placeholder} />
            ) : (
                <input type="text" value={val ?? ""} onChange={e => setter(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder={placeholder} />
            )}
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold animate-in slide-in-from-bottom-4 ${toast.type === "ok" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Agenda de Contrarios</h1>
                    <p className="text-slate-400 text-sm">Directorio de abogados contrarios, procuradores, partes y juzgados.</p>
                </div>
                <button
                    onClick={() => tab === "contrarios" ? abrirModalC("nuevo") : abrirModalJ("nuevo")}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-600/20">
                    <Plus className="w-4 h-4" /> {tab === "contrarios" ? "Nuevo Contrario" : "Nuevo Juzgado"}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50 w-fit">
                {([["contrarios", Users2, "Contrarios"], ["juzgados", Gavel, "Juzgados"]] as const).map(([id, Icon, label]) => (
                    <button key={id} onClick={() => setTab(id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === id ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white"}`}>
                        <Icon className="w-4 h-4" /> {label}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ml-1 ${tab === id ? "bg-emerald-600/30 text-emerald-300" : "bg-slate-700 text-slate-500"}`}>
                            {id === "contrarios" ? contrarios.length : juzgados.length}
                        </span>
                    </button>
                ))}
            </div>

            {/* ===== TAB CONTRARIOS ===== */}
            {tab === "contrarios" && (
                <div className="space-y-4">
                    <div className="flex gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-56">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input type="text" value={busquedaC} onChange={e => setBusquedaC(e.target.value)}
                                placeholder="Buscar por nombre, despacho, ciudad…"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {["Todos", ...TIPOS_CONTRARIO].map(t => (
                                <button key={t} onClick={() => setTipoFiltroC(t)}
                                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${tipoFiltroC === t ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {cargandoC ? (
                        <div className="flex items-center justify-center py-20 text-slate-400 gap-3"><Loader2 className="w-5 h-5 animate-spin" /> Cargando…</div>
                    ) : contrariosFiltrados.length === 0 ? (
                        <EmptyState icon={Users2} msg="No hay contrarios en la agenda." onAdd={() => abrirModalC("nuevo")} />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {contrariosFiltrados.map(c => (
                                <div key={c.id} className="group bg-slate-900 border border-slate-800 hover:border-emerald-500/20 rounded-2xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="p-2.5 bg-slate-800 rounded-xl shrink-0">
                                                <User className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-bold text-white truncate">{c.nombre}</h3>
                                                {c.despacho && <p className="text-xs text-slate-400 truncate">{c.despacho}</p>}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <button onClick={() => abrirModalC(c)} className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => eliminarContrario(c.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </div>

                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit ${coloresContrario[c.tipo] ?? coloresContrario["Otro"]}`}>
                                        {c.tipo}
                                    </span>

                                    <div className="space-y-1.5 text-xs text-slate-400">
                                        {c.telefono && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 shrink-0" /><span>{c.telefono}</span></div>}
                                        {c.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{c.email}</span></div>}
                                        {c.ciudad && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 shrink-0" /><span>{c.ciudad}</span></div>}
                                        {c.colegio_num && <div className="flex items-center gap-2"><Hash className="w-3.5 h-3.5 shrink-0" /><span>Colegiado: {c.colegio_num}</span></div>}
                                    </div>

                                    {c.expedientes_count > 0 && (
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-auto pt-2 border-t border-slate-800">
                                            <FileText className="w-3 h-3" /> {c.expedientes_count} expedientes
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ===== TAB JUZGADOS ===== */}
            {tab === "juzgados" && (
                <div className="space-y-4">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input type="text" value={busquedaJ} onChange={e => setBusquedaJ(e.target.value)}
                            placeholder="Buscar por nombre o ciudad…"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>

                    {cargandoJ ? (
                        <div className="flex items-center justify-center py-20 text-slate-400 gap-3"><Loader2 className="w-5 h-5 animate-spin" /> Cargando…</div>
                    ) : juzgadosFiltrados.length === 0 ? (
                        <EmptyState icon={Gavel} msg="No hay juzgados en la agenda." onAdd={() => abrirModalJ("nuevo")} />
                    ) : (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                            <ul className="divide-y divide-slate-800">
                                {juzgadosFiltrados.map(j => (
                                    <li key={j.id} className="group flex items-center justify-between px-5 py-4 hover:bg-slate-800/40 transition-colors">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="p-2 bg-slate-800 rounded-lg shrink-0">
                                                <Scale className="w-4 h-4 text-emerald-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-white truncate">{j.nombre}</p>
                                                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                                                    {j.tipo && <span className="text-emerald-400/80">{j.tipo}</span>}
                                                    {j.ciudad && <><span>·</span><span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{j.ciudad}</span></>}
                                                    {j.partido_judicial && <><span>·</span><span>{j.partido_judicial}</span></>}
                                                    {j.telefono && <><span>·</span><span className="flex items-center gap-1"><Phone className="w-3 h-3" />{j.telefono}</span></>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-3">
                                            <button onClick={() => abrirModalJ(j)} className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => eliminarJuzgado(j.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* ===== MODAL CONTRARIO ===== */}
            {modalC && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <h2 className="text-lg font-bold text-white">{modalC === "nuevo" ? "Nuevo Contrario" : "Editar Contrario"}</h2>
                            <button onClick={() => setModalC(null)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-5 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                {field("Nombre *", formC.nombre, v => setFormC(p => ({ ...p, nombre: v })), "Nombre completo")}
                                <div>
                                    <label className="text-xs font-medium text-slate-400 block mb-1">Tipo</label>
                                    <select value={formC.tipo ?? "Abogado Contrario"} onChange={e => setFormC(p => ({ ...p, tipo: e.target.value }))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                        {TIPOS_CONTRARIO.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {field("Despacho / Empresa", formC.despacho, v => setFormC(p => ({ ...p, despacho: v })), "Nombre del despacho")}
                                {field("Nº de colegiado", formC.colegio_num, v => setFormC(p => ({ ...p, colegio_num: v })), "Ej: BA-1234")}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {field("Teléfono", formC.telefono, v => setFormC(p => ({ ...p, telefono: v })), "+34 600 000 000")}
                                {field("Email", formC.email, v => setFormC(p => ({ ...p, email: v })), "email@despacho.com")}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {field("Dirección", formC.direccion, v => setFormC(p => ({ ...p, direccion: v })), "Calle y número")}
                                {field("Ciudad", formC.ciudad, v => setFormC(p => ({ ...p, ciudad: v })), "Ciudad")}
                            </div>
                            {field("Observaciones", formC.observaciones, v => setFormC(p => ({ ...p, observaciones: v })), "Notas internas…", true)}
                        </div>
                        <div className="flex gap-3 p-5 border-t border-slate-800">
                            <button onClick={() => setModalC(null)} className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">Cancelar</button>
                            <button onClick={guardarContrario} disabled={!formC.nombre?.trim()}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-xl transition-colors">
                                <Save className="w-4 h-4" /> Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== MODAL JUZGADO ===== */}
            {modalJ && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <h2 className="text-lg font-bold text-white">{modalJ === "nuevo" ? "Nuevo Juzgado" : "Editar Juzgado"}</h2>
                            <button onClick={() => setModalJ(null)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-5 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                {field("Nombre *", formJ.nombre, v => setFormJ(p => ({ ...p, nombre: v })), "Ej: Juzgado de Primera Instancia nº 3")}
                                <div>
                                    <label className="text-xs font-medium text-slate-400 block mb-1">Tipo</label>
                                    <select value={formJ.tipo ?? "Primera Instancia"} onChange={e => setFormJ(p => ({ ...p, tipo: e.target.value }))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                        {TIPOS_JUZGADO.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {field("Ciudad", formJ.ciudad, v => setFormJ(p => ({ ...p, ciudad: v })), "Ciudad del juzgado")}
                                {field("Partido Judicial", formJ.partido_judicial, v => setFormJ(p => ({ ...p, partido_judicial: v })), "Ej: Barcelona")}
                            </div>
                            {field("Dirección", formJ.direccion, v => setFormJ(p => ({ ...p, direccion: v })), "Calle y número")}
                            <div className="grid grid-cols-2 gap-3">
                                {field("Teléfono", formJ.telefono, v => setFormJ(p => ({ ...p, telefono: v })), "+34 93 000 0000")}
                                {field("Fax", formJ.fax, v => setFormJ(p => ({ ...p, fax: v })), "Fax")}
                            </div>
                            {field("Observaciones", formJ.observaciones, v => setFormJ(p => ({ ...p, observaciones: v })), "Notas internas…", true)}
                        </div>
                        <div className="flex gap-3 p-5 border-t border-slate-800">
                            <button onClick={() => setModalJ(null)} className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">Cancelar</button>
                            <button onClick={guardarJuzgado} disabled={!formJ.nombre?.trim()}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-xl transition-colors">
                                <Save className="w-4 h-4" /> Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
