"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, ShieldAlert, Scale, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NuevoExpediente() {
    const [categoria, setCategoria] = useState<string>("");

    return (
        <div className="max-w-4xl mx-auto pb-12">
            {/* Header */}
            <div className="mb-8">
                <Link href="/expedientes" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4" />
                    Cancelar y volver
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Nuevo Expediente</h1>
                        <p className="text-slate-400">Rellena los datos para abrir un nuevo caso en el sistema.</p>
                    </div>
                    <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-600/20 flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Guardar Expediente
                    </button>
                </div>
            </div>

            {/* Formulario */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8 space-y-8">

                    {/* Datos base */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-sm font-medium text-slate-300">Título del Expediente <span className="text-red-400">*</span></label>
                            <input
                                type="text"
                                placeholder="Ej. García c/ López - Reclamación..."
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Cliente Asociado <span className="text-red-400">*</span></label>
                            <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                                <option value="">Seleccionar cliente...</option>
                                <option value="1">Juan García Pérez</option>
                                <option value="2">Empresa S.L.</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Categoría <span className="text-red-400">*</span></label>
                            <select
                                value={categoria}
                                onChange={(e) => setCategoria(e.target.value)}
                                className="w-full bg-slate-800 border border-emerald-500/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                            >
                                <option value="" disabled>Seleccionar obligatoriamente...</option>
                                <option value="Extrajudicial">Extrajudicial</option>
                                <option value="Judicial">Judicial</option>
                                <option value="Mediación">Mediación</option>
                            </select>
                        </div>
                    </div>

                    {/* Lógica Visual Condicional */}
                    <AnimatePresence mode="wait">
                        {categoria === 'Judicial' && (
                            <motion.div
                                key="judicial"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pt-6 border-t border-slate-800"
                            >
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5 text-red-500" />
                                    Datos Judiciales Requeridos
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Juzgado</label>
                                        <input
                                            type="text"
                                            placeholder="Ej. Primera Instancia Nº 4..."
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Nº de Autos</label>
                                        <input
                                            type="text"
                                            placeholder="Ej. PO 123/2026"
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {categoria === 'Mediación' && (
                            <motion.div
                                key="mediacion"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pt-6 border-t border-slate-800"
                            >
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Scale className="w-5 h-5 text-purple-500" />
                                    Datos de Mediación Requeridos
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Parte Invitada</label>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Nombre completo de la otra parte..."
                                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Sesiones Previstas / Fase Actual</label>
                                        <select className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                            <option>Sesión Informativa Pendiente</option>
                                            <option>Sesiones en Curso</option>
                                            <option>Fase de Acuerdos</option>
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {categoria === 'Extrajudicial' && (
                            <motion.div
                                key="extrajudicial"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pt-6 border-t border-slate-800"
                            >
                                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-200">
                                    El caso es extrajudicial. No se requieren datos adicionales de momento. La documentación se añadirá en la ficha del expediente.
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </div>
        </div>
    );
}
