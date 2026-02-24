"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, ShieldAlert, Scale } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

type ExpedienteEdit = {
    caratula: string;
    numero_expediente: string;
    estado: string;
    categoria: string;
    juzgado: string;
    autos: string;
    parteInvitada: string;
    cliente_id: string;
    cliente_nombre: string;
};

const ESTADO_OPTS = ["Abierto", "En curso", "Archivado", "Cerrado"];
const CAT_OPTS = ["Extrajudicial", "Judicial", "Mediación"];

export default function EditarExpediente({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [form, setForm] = useState<ExpedienteEdit>({
        caratula: '', numero_expediente: '', estado: 'Abierto',
        categoria: '', juzgado: '', autos: '', parteInvitada: '',
        cliente_id: '', cliente_nombre: '',
    });
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cargar datos del expediente
    useEffect(() => {
        supabase
            .from('expedientes')
            .select('caratula, numero_expediente, estado, categoria, tipo_expediente, juzgado, autos, parteInvitada, cliente_id, cliente_nombre')
            .eq('id', id)
            .single()
            .then(({ data, error: err }) => {
                if (err || !data) { setError('No se pudo cargar el expediente.'); }
                else {
                    setForm({
                        caratula: data.caratula ?? '',
                        numero_expediente: data.numero_expediente ?? '',
                        estado: data.estado ?? 'Abierto',
                        categoria: data.categoria ?? data.tipo_expediente ?? '',
                        juzgado: data.juzgado ?? '',
                        autos: data.autos ?? '',
                        parteInvitada: data.parteInvitada ?? '',
                        cliente_id: data.cliente_id ?? '',
                        cliente_nombre: data.cliente_nombre ?? '',
                    });
                }
                setCargando(false);
            });
    }, [id]);

    const set = (key: keyof ExpedienteEdit, val: string) =>
        setForm(prev => ({ ...prev, [key]: val }));

    const handleGuardar = async () => {
        if (!form.caratula.trim()) { setError('La carátula es obligatoria.'); return; }
        if (!form.categoria) { setError('La categoría es obligatoria.'); return; }
        setGuardando(true);
        setError(null);

        const { error: sbErr } = await supabase
            .from('expedientes')
            .update({
                caratula: form.caratula.trim(),
                numero_expediente: form.numero_expediente.trim() || null,
                estado: form.estado,
                categoria: form.categoria,
                tipo_expediente: form.categoria,
                juzgado: form.categoria === 'Judicial' ? form.juzgado.trim() || null : null,
                autos: form.categoria === 'Judicial' ? form.autos.trim() || null : null,
                parteInvitada: form.categoria === 'Mediación' ? form.parteInvitada.trim() || null : null,
            })
            .eq('id', id);

        setGuardando(false);
        if (sbErr) setError(`Error al guardar: ${sbErr.message}`);
        else router.push(`/expedientes/${id}`);
    };

    if (cargando) return (
        <div className="flex items-center justify-center min-h-[40vh] gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" /> Cargando expediente…
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto pb-12">
            {/* Header */}
            <div className="mb-8">
                <Link href={`/expedientes/${id}`} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4" /> Cancelar y volver
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Editar Expediente</h1>
                        {form.numero_expediente && (
                            <span className="font-mono text-sm text-slate-400">{form.numero_expediente}</span>
                        )}
                    </div>
                    <button
                        onClick={handleGuardar}
                        disabled={guardando}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                    >
                        {guardando
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
                            : <><Save className="w-4 h-4" /> Guardar Cambios</>}
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 bg-red-950/40 border border-red-500/40 text-red-300 rounded-xl px-5 py-4 text-sm">{error}</div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Carátula */}
                    <div className="col-span-2 space-y-2">
                        <label className="text-sm font-medium text-slate-300">Carátula <span className="text-red-400">*</span></label>
                        <input
                            value={form.caratula}
                            onChange={e => set('caratula', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                    </div>

                    {/* Número */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Número de Expediente</label>
                        <input
                            value={form.numero_expediente}
                            onChange={e => set('numero_expediente', e.target.value)}
                            placeholder="Auto-generado si se deja vacío"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                    </div>

                    {/* Estado */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Estado</label>
                        <select
                            value={form.estado}
                            onChange={e => set('estado', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                        >
                            {ESTADO_OPTS.map(o => <option key={o}>{o}</option>)}
                        </select>
                    </div>

                    {/* Categoría */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Categoría <span className="text-red-400">*</span></label>
                        <select
                            value={form.categoria}
                            onChange={e => set('categoria', e.target.value)}
                            className="w-full bg-slate-800 border border-emerald-500/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                        >
                            <option value="" disabled>Seleccionar…</option>
                            {CAT_OPTS.map(o => <option key={o}>{o}</option>)}
                        </select>
                    </div>

                    {/* Cliente (solo lectura — se cambia desde el propio expediente) */}
                    {form.cliente_nombre && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Cliente vinculado</label>
                            <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-400 text-sm">
                                {form.cliente_nombre}
                                <span className="ml-2 text-slate-600 text-xs">(no editable desde aquí)</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Campos condicionales */}
                <AnimatePresence mode="wait">
                    {form.categoria === 'Judicial' && (
                        <motion.div key="judicial" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pt-6 border-t border-slate-800">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-red-500" /> Datos Judiciales
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Juzgado</label>
                                    <input value={form.juzgado} onChange={e => set('juzgado', e.target.value)}
                                        placeholder="Ej. Primera Instancia Nº 4 de Barcelona"
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Nº de Autos</label>
                                    <input value={form.autos} onChange={e => set('autos', e.target.value)}
                                        placeholder="Ej. PO 123/2026"
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {form.categoria === 'Mediación' && (
                        <motion.div key="mediacion" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pt-6 border-t border-slate-800">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Scale className="w-5 h-5 text-purple-500" /> Datos de Mediación
                            </h3>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Parte Invitada</label>
                                <input value={form.parteInvitada} onChange={e => set('parteInvitada', e.target.value)}
                                    placeholder="Nombre completo de la otra parte…"
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
