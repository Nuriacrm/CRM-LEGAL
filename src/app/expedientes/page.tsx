"use client";
import { useState } from 'react';
import Link from 'next/link';
import { FileText, ChevronRight, Filter } from 'lucide-react';

export default function ExpedientesPage() {
    const [filtroCategoria, setFiltroCategoria] = useState<string>('Todas');

    const mockExpedientes = [
        { id: '1', titulo: 'García c/ López - Reclamación Cantidad', estado: 'En curso', categoria: 'Judicial', fecha: '22-02-2026' },
        { id: '2', titulo: 'Divorcio Mutuo Acuerdo - Martínez', estado: 'En curso', categoria: 'Mediación', fecha: '20-02-2026' },
        { id: '3', titulo: 'Revisión Contrato Alquiler', estado: 'Completado', categoria: 'Extrajudicial', fecha: '18-02-2026' }
    ];

    const expedientesFiltrados = mockExpedientes.filter(exp =>
        filtroCategoria === 'Todas' || exp.categoria === filtroCategoria
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Expedientes</h1>
                    <p className="text-slate-400">Gestiona todos tus casos activos y archivados.</p>
                </div>
                <Link href="/expedientes/nuevo" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-600/20">
                    Nuevo Expediente
                </Link>
            </div>

            {/* Alerta del Sistema (Mock) */}
            <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-4 flex items-start gap-4 shadow-lg shadow-blue-900/10">
                <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
                    <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                        Nuevos Hitos a Monitorizar
                        <span className="bg-blue-600/30 text-blue-400 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Judicializado</span>
                    </h4>
                    <p className="text-sm text-slate-300">
                        El exp. <strong>#0003 (Revisión Contrato Alquiler)</strong> ha pasado a Judicial. Tienes un nuevo hito activo: <span className="font-semibold text-emerald-400">Plazo para contestación/demanda</span>. Activa la calculadora de plazos.
                    </p>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <Filter className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-300">Filtrar por categoría:</span>
                <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 p-2 outline-none cursor-pointer"
                >
                    <option value="Todas">Todas las categorías</option>
                    <option value="Extrajudicial">Extrajudicial</option>
                    <option value="Judicial">Judicial</option>
                    <option value="Mediación">Mediación</option>
                </select>

                <div className="ml-auto text-sm text-slate-500">
                    Mostrando {expedientesFiltrados.length} expedientes
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <ul className="divide-y divide-slate-800">
                    {expedientesFiltrados.map(exp => (
                        <li key={exp.id}>
                            <Link href={`/expedientes/${exp.id}`} className="flex items-center justify-between p-6 hover:bg-slate-800/50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-emerald-900/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">{exp.titulo}</h3>
                                        <div className="flex flex-wrap gap-3 text-sm text-slate-400 mt-2 items-center">
                                            <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">Exp. #{exp.id.padStart(4, '0')}</span>
                                            <span>{exp.fecha}</span>
                                            <span className={exp.estado === 'En curso' ? 'text-emerald-400' : 'text-slate-400'}>{exp.estado}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-600 hidden sm:block"></span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap
                        ${exp.categoria === 'Judicial' ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.4)]' : ''}
                        ${exp.categoria === 'Mediación' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : ''}
                        ${exp.categoria === 'Extrajudicial' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : ''}
                      `}>
                                                {exp.categoria}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="text-slate-500 group-hover:text-emerald-400 transition-colors flex-shrink-0 ml-4" />
                            </Link>
                        </li>
                    ))}
                    {expedientesFiltrados.length === 0 && (
                        <li className="p-8 text-center text-slate-400">
                            No se encontraron expedientes para esta categoría.
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
