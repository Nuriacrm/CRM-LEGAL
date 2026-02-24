"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, ChevronRight, Search, Plus, Loader2, AlertCircle, Trash2, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { WhatsAppModal } from '@/components/whatsapp/WhatsAppModal';

type Cliente = {
    id: string;
    nombre: string;
    apellidos: string | null;
    dni_nie: string | null;
    email: string | null;
    telefono: string | null;
};

export default function ClientesPage() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const [borrandoId, setBorrandoId] = useState<string | null>(null);
    const [eliminandoId, setEliminandoId] = useState<string | null>(null);
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

    useEffect(() => {
        const fetchClientes = async () => {
            setCargando(true);
            const { data, error } = await supabase
                .from('clientes')
                .select('id, nombre, apellidos, dni_nie, email, telefono')
                .order('nombre', { ascending: true });

            if (error) {
                setError(error.message);
            } else {
                setClientes(data ?? []);
            }
            setCargando(false);
        };
        fetchClientes();
    }, []);

    const handleEliminar = async (id: string) => {
        setEliminandoId(id);
        const { error } = await supabase.from('clientes').delete().eq('id', id);
        setEliminandoId(null);
        setBorrandoId(null);
        if (!error) {
            setClientes(prev => prev.filter(c => c.id !== id));
        } else {
            alert('Error al eliminar: ' + error.message);
        }
    };

    const handleOpenWhatsApp = (cliente: Cliente) => {
        setSelectedCliente(cliente);
        setIsWhatsAppModalOpen(true);
    };

    const clientesFiltrados = clientes.filter(c => {
        const q = busqueda.toLowerCase();
        return (
            c.nombre.toLowerCase().includes(q) ||
            (c.apellidos ?? '').toLowerCase().includes(q) ||
            (c.dni_nie ?? '').toLowerCase().includes(q) ||
            (c.email ?? '').toLowerCase().includes(q)
        );
    });

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Clientes</h1>
                    <p className="text-slate-400">Directorio unificado de clientes particulares y corporativos.</p>
                </div>
                <Link
                    href="/clientes/nuevo"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Añadir Cliente
                </Link>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-3">
                    <Search className="text-slate-500 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, DNI o email..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        className="w-full bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none border-none"
                    />
                </div>

                {cargando && (
                    <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                        Cargando clientes…
                    </div>
                )}

                {error && !cargando && (
                    <div className="flex items-center gap-3 m-6 bg-red-950/30 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        Error al cargar clientes: {error}
                    </div>
                )}

                {!cargando && !error && (
                    <ul className="divide-y divide-slate-800">
                        {clientesFiltrados.length === 0 ? (
                            <li className="py-12 text-center text-slate-500">
                                {busqueda ? 'No se encontraron clientes con esa búsqueda.' : 'No hay clientes registrados aún. ¡Añade el primero!'}
                            </li>
                        ) : (
                            clientesFiltrados.map(cliente => (
                                <li key={cliente.id} className="relative">
                                    <div className="flex items-center">
                                        <Link
                                            href={`/clientes/${cliente.id}`}
                                            className="flex-1 flex items-center justify-between p-6 hover:bg-slate-800/50 transition-colors group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-emerald-900/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                                    <Users className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
                                                        {cliente.nombre} {cliente.apellidos ?? ''}
                                                    </h3>
                                                    <div className="flex flex-wrap gap-4 text-sm text-slate-400 mt-1">
                                                        {cliente.dni_nie && <span><span className="text-slate-500">DNI: </span>{cliente.dni_nie}</span>}
                                                        {cliente.telefono && <span><span className="text-slate-500">Tel: </span>{cliente.telefono}</span>}
                                                        {cliente.email && <span><span className="text-slate-500">Email: </span>{cliente.email}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0 mr-2" />
                                        </Link>

                                        <div className="pr-5 flex items-center gap-2 shrink-0">
                                            {cliente.telefono && (
                                                <button
                                                    onClick={() => handleOpenWhatsApp(cliente)}
                                                    className="p-2 text-slate-600 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                    title="Enviar WhatsApp"
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                </button>
                                            )}
                                            {borrandoId === cliente.id ? (
                                                <>
                                                    <span className="text-xs text-slate-400 whitespace-nowrap">¿Seguro?</span>
                                                    <button
                                                        onClick={() => handleEliminar(cliente.id)}
                                                        disabled={eliminandoId === cliente.id}
                                                        className="px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        {eliminandoId === cliente.id ? 'Borrando…' : 'Sí, borrar'}
                                                    </button>
                                                    <button
                                                        onClick={() => setBorrandoId(null)}
                                                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={e => { e.preventDefault(); setBorrandoId(cliente.id); }}
                                                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Eliminar cliente"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                )}
            </div>

            {selectedCliente && (
                <WhatsAppModal
                    isOpen={isWhatsAppModalOpen}
                    onClose={() => setIsWhatsAppModalOpen(false)}
                    cliente={selectedCliente}
                />
            )}
        </div>
    );
}
