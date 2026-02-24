"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, ChevronRight, Filter, Search, Loader2, AlertCircle, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Expediente = {
    id: string;
    numero_expediente: string | null;
    caratula: string | null;
    estado: string | null;
    categoria: string | null;
    created_at: string;
};

export default function ExpedientesPage() {
    const [expedientes, setExpedientes] = useState<Expediente[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState<string>('Todas');

    useEffect(() => {
        const fetch = async () => {
            setCargando(true);
            const { data, error } = await supabase
                .from('expedientes')
                .select('id, numero_expediente, caratula, estado, categoria, created_at')
                .order('created_at', { ascending: false });

            if (error) setError(error.message);
            else setExpedientes(data ?? []);
            setCargando(false);
        };
        fetch();
    }, []);

    const expedientesFiltrados = expedientes.filter(exp => {
        const q = busqueda.toLowerCase();
        const matchBusqueda =
            !q ||
            (exp.caratula ?? '').toLowerCase().includes(q) ||
            (exp.numero_expediente ?? '').toLowerCase().includes(q);
        const matchCategoria =
            filtroCategoria === 'Todas' || exp.categoria === filtroCategoria;
        return matchBusqueda && matchCategoria;
    });

    const getCategoriaStyle = (categoria: string | null) => {
        switch (categoria) {
            case 'Judicial':
                return 'bg-blue-600 text-white border-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.4)]';
            case 'Mediación':
                return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'Extrajudicial':
                return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
            default:
                return 'bg-slate-700 text-slate-300 border-slate-600';
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
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

            {/* Barra de Búsqueda y Filtros */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 flex items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
                    <Search className="text-slate-500 w-5 h-5 shrink-0" />
                    <input
                        type="text"
                        placeholder="Buscar por carátula o número de expediente..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        className="w-full bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none"
                    />
                </div>
                <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
                    <Filter className="w-5 h-5 text-slate-400 shrink-0" />
                    <select
                        value={filtroCategoria}
                        onChange={(e) => setFiltroCategoria(e.target.value)}
                        className="bg-transparent text-slate-200 text-sm focus:outline-none cursor-pointer"
                    >
                        <option value="Todas">Todas las categorías</option>
                        <option value="Extrajudicial">Extrajudicial</option>
                        <option value="Judicial">Judicial</option>
                        <option value="Mediación">Mediación</option>
                    </select>
                </div>
            </div>

            {/* Resultados */}
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
                        Error al cargar expedientes: {error}
                    </div>
                )}

                {!cargando && !error && (
                    <>
                        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/50">
                            <p className="text-xs text-slate-500">
                                Mostrando <span className="text-slate-300 font-medium">{expedientesFiltrados.length}</span> de{' '}
                                <span className="text-slate-300 font-medium">{expedientes.length}</span> expedientes
                            </p>
                        </div>
                        <ul className="divide-y divide-slate-800">
                            {expedientesFiltrados.length === 0 ? (
                                <li className="py-12 text-center text-slate-500">
                                    {busqueda || filtroCategoria !== 'Todas'
                                        ? 'No se encontraron expedientes con esos filtros.'
                                        : 'No hay expedientes registrados aún. ¡Crea el primero!'}
                                </li>
                            ) : (
                                expedientesFiltrados.map(exp => (
                                    <li key={exp.id}>
                                        <Link
                                            href={`/expedientes/${exp.id}`}
                                            className="flex items-center justify-between p-6 hover:bg-slate-800/50 transition-colors group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-emerald-900/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
                                                        {exp.caratula ?? 'Sin carátula'}
                                                    </h3>
                                                    <div className="flex flex-wrap gap-3 text-sm text-slate-400 mt-2 items-center">
                                                        {exp.numero_expediente && (
                                                            <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono text-xs">
                                                                {exp.numero_expediente}
                                                            </span>
                                                        )}
                                                        <span>
                                                            {new Date(exp.created_at).toLocaleDateString('es-ES', {
                                                                day: '2-digit', month: 'short', year: 'numeric'
                                                            })}
                                                        </span>
                                                        {exp.estado && (
                                                            <span className={exp.estado === 'En curso' ? 'text-emerald-400' : 'text-slate-400'}>
                                                                {exp.estado}
                                                            </span>
                                                        )}
                                                        {exp.categoria && (
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${getCategoriaStyle(exp.categoria)}`}>
                                                                {exp.categoria}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-slate-500 group-hover:text-emerald-400 transition-colors flex-shrink-0 ml-4" />
                                        </Link>
                                    </li>
                                ))
                            )}
                        </ul>
                    </>
                )}
            </div>
        </div>
    );
}
