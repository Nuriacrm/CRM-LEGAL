"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    FileText, ChevronRight, Filter, Search, Loader2,
    AlertCircle, Plus, Pencil, Trash2, X, Check, CreditCard
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Expediente = {
    id: string;
    numero_expediente: string | null;
    caratula: string | null;
    estado: string | null;
    categoria: string | null;
    created_at: string;
    cliente_nombre: string | null;
    cliente_id: string | null;
    clientes?: { dni_nie: string | null }[] | null;
};

// ── Mini Modal de Confirmación ──────────────────────────────────────────────
function ConfirmModal({
    titulo, mensaje, onConfirm, onCancel, cargando
}: {
    titulo: string; mensaje: string;
    onConfirm: () => void; onCancel: () => void; cargando: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-red-500/10">
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">{titulo}</h3>
                        <p className="text-slate-400 text-sm mt-1 leading-relaxed">{mensaje}</p>
                    </div>
                </div>
                <div className="flex gap-3 justify-end mt-6">
                    <button
                        onClick={onCancel}
                        disabled={cargando}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <X className="w-4 h-4" /> Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={cargando}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                    >
                        {cargando
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Eliminando…</>
                            : <><Trash2 className="w-4 h-4" /> Sí, eliminar</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Chip de categoría ────────────────────────────────────────────────────────
function CategoriaChip({ cat }: { cat: string | null }) {
    const styles: Record<string, string> = {
        Judicial: 'bg-blue-600 text-white border-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.4)]',
        Mediación: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        Extrajudicial: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    };
    if (!cat) return null;
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${styles[cat] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
            {cat}
        </span>
    );
}

// ── Página Principal ─────────────────────────────────────────────────────────
export default function ExpedientesPage() {
    const router = useRouter();
    const [expedientes, setExpedientes] = useState<Expediente[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('Todas');
    // Borrar
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const [borrando, setBorrando] = useState(false);

    // ── Fetch con JOIN a clientes para obtener dni_nie ───────────────────────
    const fetchExpedientes = useCallback(async () => {
        setCargando(true);
        const { data, error } = await supabase
            .from('expedientes')
            .select('id, numero_expediente, caratula, estado, categoria, created_at, cliente_nombre, cliente_id, clientes(dni_nie)')
            .order('created_at', { ascending: false });

        if (error) setError(error.message);
        else setExpedientes((data as Expediente[]) ?? []);
        setCargando(false);
    }, []);

    useEffect(() => { fetchExpedientes(); }, [fetchExpedientes]);

    // ── Filtro combinado (carátula + nº expediente + DNI cliente) ─────────────
    const expedientesFiltrados = expedientes.filter(exp => {
        const q = busqueda.toLowerCase().trim();
        const matchBusqueda = !q ||
            (exp.caratula ?? '').toLowerCase().includes(q) ||
            (exp.numero_expediente ?? '').toLowerCase().includes(q) ||
            (exp.cliente_nombre ?? '').toLowerCase().includes(q) ||
            (((exp.clientes as { dni_nie: string | null }[] | null)?.[0]?.dni_nie) ?? '').toLowerCase().includes(q);
        const matchCat = filtroCategoria === 'Todas' || exp.categoria === filtroCategoria;
        return matchBusqueda && matchCat;
    });

    // ── Borrar expediente ────────────────────────────────────────────────────
    const handleBorrar = async () => {
        if (!confirmId) return;
        setBorrando(true);
        const { error } = await supabase.from('expedientes').delete().eq('id', confirmId);
        setBorrando(false);
        setConfirmId(null);
        if (error) setError(`Error al eliminar: ${error.message}`);
        else fetchExpedientes(); // ← auto-refresco inmediato
    };

    const expAConfirmar = expedientes.find(e => e.id === confirmId);

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Expedientes</h1>
                    <p className="text-slate-400">Gestiona todos tus casos activos y archivados.</p>
                </div>
                <Link
                    href="/expedientes/nuevo"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Expediente
                </Link>
            </div>

            {/* Barra de Búsqueda Avanzada */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 flex items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
                    <Search className="text-slate-500 w-5 h-5 shrink-0" />
                    <input
                        type="text"
                        placeholder="Buscar por carátula, nº expediente, cliente o DNI…"
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        className="w-full bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none"
                    />
                    {busqueda && (
                        <button onClick={() => setBusqueda('')} className="text-slate-500 hover:text-slate-300">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
                    <Filter className="w-5 h-5 text-slate-400 shrink-0" />
                    <select
                        value={filtroCategoria}
                        onChange={e => setFiltroCategoria(e.target.value)}
                        className="bg-transparent text-slate-200 text-sm focus:outline-none cursor-pointer"
                    >
                        <option value="Todas">Todas las categorías</option>
                        <option value="Extrajudicial">Extrajudicial</option>
                        <option value="Judicial">Judicial</option>
                        <option value="Mediación">Mediación</option>
                    </select>
                </div>
            </div>

            {/* Hint de búsqueda por DNI */}
            <div className="flex items-center gap-2 text-xs text-slate-600 -mt-4">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Puedes buscar también por DNI/NIE del cliente</span>
            </div>

            {/* Tabla de resultados */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                {cargando && (
                    <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                        Cargando expedientes…
                    </div>
                )}

                {error && !cargando && (
                    <div className="flex items-center gap-3 m-6 bg-red-950/30 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {error}
                    </div>
                )}

                {!cargando && !error && (
                    <>
                        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                            <p className="text-xs text-slate-500">
                                Mostrando <span className="text-slate-300 font-medium">{expedientesFiltrados.length}</span> de{' '}
                                <span className="text-slate-300 font-medium">{expedientes.length}</span> expedientes
                            </p>
                            <button
                                onClick={fetchExpedientes}
                                className="text-xs text-slate-500 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                            >
                                <Check className="w-3 h-3" /> Actualizar
                            </button>
                        </div>

                        <ul className="divide-y divide-slate-800">
                            {expedientesFiltrados.length === 0 ? (
                                <li className="py-12 text-center text-slate-500">
                                    {busqueda || filtroCategoria !== 'Todas'
                                        ? 'No se encontraron expedientes con esos filtros.'
                                        : 'No hay expedientes registrados. ¡Crea el primero!'}
                                </li>
                            ) : (
                                expedientesFiltrados.map(exp => (
                                    <li key={exp.id} className="group flex items-center hover:bg-slate-800/40 transition-colors">
                                        {/* Zona clickable → detalle */}
                                        <Link
                                            href={`/expedientes/${exp.id}`}
                                            className="flex items-center gap-4 p-5 flex-1 min-w-0"
                                        >
                                            <div className="w-11 h-11 rounded-full bg-emerald-900/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
                                                    {exp.caratula ?? 'Sin carátula'}
                                                </h3>
                                                <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                                                    {exp.numero_expediente && (
                                                        <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono text-xs">
                                                            {exp.numero_expediente}
                                                        </span>
                                                    )}
                                                    {exp.cliente_nombre && (
                                                        <span className="text-xs text-slate-400">{exp.cliente_nombre}</span>
                                                    )}
                                                    <CategoriaChip cat={exp.categoria} />
                                                    <span className="text-xs text-slate-600">
                                                        {new Date(exp.created_at).toLocaleDateString('es-ES', {
                                                            day: '2-digit', month: 'short', year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-slate-600 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
                                        </Link>

                                        {/* Acciones CRUD — visibles en hover */}
                                        <div className="flex items-center gap-1 pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {/* Editar */}
                                            <button
                                                onClick={() => router.push(`/expedientes/${exp.id}/editar`)}
                                                title="Editar expediente"
                                                className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            {/* Borrar */}
                                            <button
                                                onClick={() => setConfirmId(exp.id)}
                                                title="Eliminar expediente"
                                                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </>
                )}
            </div>

            {/* Modal de confirmación de borrado */}
            {confirmId && expAConfirmar && (
                <ConfirmModal
                    titulo="¿Eliminar expediente?"
                    mensaje={`¿Está seguro de eliminar «${expAConfirmar.caratula ?? expAConfirmar.numero_expediente ?? 'este expediente'}»? Esta acción no se puede deshacer.`}
                    onConfirm={handleBorrar}
                    onCancel={() => setConfirmId(null)}
                    cargando={borrando}
                />
            )}
        </div>
    );
}
