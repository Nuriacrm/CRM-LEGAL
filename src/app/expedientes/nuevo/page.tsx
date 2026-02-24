"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, ShieldAlert, Scale, Users, Loader2, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

type Cliente = {
    id: string;
    nombre: string;
    apellidos: string | null;
};

export default function NuevoExpediente() {
    const router = useRouter();

    // Formulario
    const [caratula, setCaratula] = useState("");
    const [categoria, setCategoria] = useState("");
    const [numeroExpediente, setNumeroExpediente] = useState("");
    const [estado, setEstado] = useState("Abierto");
    // Cliente
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [clienteId, setClienteId] = useState("");
    const [busquedaCliente, setBusquedaCliente] = useState("");
    const [loadingClientes, setLoadingClientes] = useState(true);
    // Judicial
    const [juzgado, setJuzgado] = useState("");
    const [autos, setAutos] = useState("");
    // Mediación
    const [parteInvitada, setParteInvitada] = useState("");
    const [estadoMediacion, setEstadoMediacion] = useState("Sesión Informativa Pendiente");
    // UI
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cargar clientes reales
    useEffect(() => {
        supabase
            .from("clientes")
            .select("id, nombre, apellidos")
            .order("nombre")
            .then(({ data }) => {
                setClientes(data ?? []);
                setLoadingClientes(false);
            });
    }, []);

    const clientesFiltrados = clientes.filter(c => {
        const q = busquedaCliente.toLowerCase();
        return (
            c.nombre.toLowerCase().includes(q) ||
            (c.apellidos ?? "").toLowerCase().includes(q)
        );
    });

    const clienteSeleccionado = clientes.find(c => c.id === clienteId);

    const handleGuardar = async () => {
        if (!caratula.trim()) { setError("La carátula del expediente es obligatoria."); return; }
        if (!categoria) { setError("Debes seleccionar una categoría."); return; }
        if (!clienteId) { setError("Debes vincular el expediente a un cliente."); return; }

        setGuardando(true);
        setError(null);

        const clienteNombre = clienteSeleccionado
            ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellidos ?? ""}`.trim()
            : "";

        const { data, error: sbError } = await supabase
            .from("expedientes")
            .insert({
                caratula: caratula.trim(),
                categoria,
                tipo_expediente: categoria,
                numero_expediente: numeroExpediente.trim() || null,
                estado,
                cliente_id: clienteId,
                cliente_nombre: clienteNombre,
                // Campos según categoría
                juzgado: categoria === "Judicial" ? juzgado.trim() || null : null,
                autos: categoria === "Judicial" ? autos.trim() || null : null,
                parteInvitada: categoria === "Mediación" ? parteInvitada.trim() || null : null,
            })
            .select("id")
            .single();

        setGuardando(false);

        if (sbError) {
            setError(`Error al guardar: ${sbError.message}`);
        } else if (data) {
            router.push(`/expedientes/${data.id}`);
        }
    };

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
                    <button
                        onClick={handleGuardar}
                        disabled={guardando}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                    >
                        {guardando
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
                            : <><Save className="w-4 h-4" /> Guardar Expediente</>
                        }
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 bg-red-950/40 border border-red-500/40 text-red-300 rounded-xl px-5 py-4 text-sm">
                    {error}
                </div>
            )}

            {/* Formulario */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8 space-y-8">

                    {/* Carátula */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Carátula / Título del Expediente <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={caratula}
                                onChange={e => setCaratula(e.target.value)}
                                placeholder="Ej. García c/ López - Reclamación de Cantidad..."
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                            />
                        </div>

                        {/* Número Expediente */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Número de Expediente Interno</label>
                            <input
                                type="text"
                                value={numeroExpediente}
                                onChange={e => setNumeroExpediente(e.target.value)}
                                placeholder="Ej. EXP-2026-001"
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            />
                        </div>

                        {/* Estado */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Estado</label>
                            <select
                                value={estado}
                                onChange={e => setEstado(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                            >
                                <option>Abierto</option>
                                <option>En curso</option>
                                <option>Archivado</option>
                                <option>Cerrado</option>
                            </select>
                        </div>

                        {/* Categoría */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Categoría <span className="text-red-400">*</span>
                            </label>
                            <select
                                value={categoria}
                                onChange={e => setCategoria(e.target.value)}
                                className="w-full bg-slate-800 border border-emerald-500/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                            >
                                <option value="" disabled>Seleccionar obligatoriamente...</option>
                                <option value="Extrajudicial">Extrajudicial</option>
                                <option value="Judicial">Judicial</option>
                                <option value="Mediación">Mediación</option>
                            </select>
                        </div>
                    </div>

                    {/* ── Selección de Cliente Real ── */}
                    <div className="pt-6 border-t border-slate-800 space-y-3">
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Users className="w-4 h-4 text-emerald-400" />
                            Cliente Asociado <span className="text-red-400">*</span>
                        </label>

                        {clienteId ? (
                            <div className="flex items-center justify-between bg-emerald-900/20 border border-emerald-500/30 rounded-xl px-4 py-3">
                                <div>
                                    <p className="text-white font-medium">
                                        {clienteSeleccionado?.nombre} {clienteSeleccionado?.apellidos}
                                    </p>
                                    <p className="text-emerald-400 text-xs mt-0.5">Cliente vinculado correctamente</p>
                                </div>
                                <button
                                    onClick={() => { setClienteId(""); setBusquedaCliente(""); }}
                                    className="text-slate-400 hover:text-red-400 text-xs underline transition-colors"
                                >
                                    Cambiar
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 p-3 rounded-xl">
                                    <Search className="text-slate-500 w-4 h-4 shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Buscar cliente por nombre..."
                                        value={busquedaCliente}
                                        onChange={e => setBusquedaCliente(e.target.value)}
                                        className="w-full bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none text-sm"
                                    />
                                </div>

                                {loadingClientes ? (
                                    <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Cargando clientes…
                                    </div>
                                ) : clientesFiltrados.length === 0 ? (
                                    <p className="text-slate-500 text-sm py-2">
                                        {clientes.length === 0
                                            ? "No hay clientes registrados. Crea un cliente primero."
                                            : "No se encontraron clientes con ese nombre."}
                                    </p>
                                ) : (
                                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-800 border border-slate-800 rounded-xl">
                                        {clientesFiltrados.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => setClienteId(c.id)}
                                                className="w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors text-sm"
                                            >
                                                <span className="text-white font-medium">{c.nombre}</span>
                                                {c.apellidos && <span className="text-slate-400 ml-1">{c.apellidos}</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Campos condicionales por categoría ── */}
                    <AnimatePresence mode="wait">
                        {categoria === "Judicial" && (
                            <motion.div
                                key="judicial"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pt-6 border-t border-slate-800"
                            >
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5 text-red-500" />
                                    Datos Judiciales
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Juzgado</label>
                                        <input
                                            type="text"
                                            value={juzgado}
                                            onChange={e => setJuzgado(e.target.value)}
                                            placeholder="Ej. Primera Instancia Nº 4 de Barcelona"
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Nº de Autos</label>
                                        <input
                                            type="text"
                                            value={autos}
                                            onChange={e => setAutos(e.target.value)}
                                            placeholder="Ej. PO 123/2026"
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {categoria === "Mediación" && (
                            <motion.div
                                key="mediacion"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pt-6 border-t border-slate-800"
                            >
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Scale className="w-5 h-5 text-purple-500" />
                                    Datos de Mediación
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Parte Invitada</label>
                                        <input
                                            type="text"
                                            value={parteInvitada}
                                            onChange={e => setParteInvitada(e.target.value)}
                                            placeholder="Nombre completo de la otra parte..."
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Fase Actual</label>
                                        <select
                                            value={estadoMediacion}
                                            onChange={e => setEstadoMediacion(e.target.value)}
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option>Sesión Informativa Pendiente</option>
                                            <option>Sesiones en Curso</option>
                                            <option>Fase de Acuerdos</option>
                                            <option>Finalizado con Acuerdo</option>
                                            <option>Finalizado sin Acuerdo</option>
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {categoria === "Extrajudicial" && (
                            <motion.div
                                key="extrajudicial"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
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
