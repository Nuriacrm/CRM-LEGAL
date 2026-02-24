"use client";

import { useEffect, useState } from 'react';
import { Search, Loader2, MessageSquare, History, User, Phone, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { WhatsAppModal } from '@/components/whatsapp/WhatsAppModal';

type Cliente = {
    id: string;
    nombre: string;
    apellidos: string | null;
    telefono: string | null;
};

type Log = {
    id: string;
    content: string;
    status: string;
    created_at: string;
    cliente: {
        nombre: string;
        apellidos: string | null;
    } | null;
};

export default function WhatsAppCentralPage() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            // Fetch clientes
            const { data: clientsData } = await supabase
                .from('clientes')
                .select('id, nombre, apellidos, telefono')
                .order('nombre');

            setClientes(clientsData ?? []);

            // Fetch recent logs
            const { data: logsData } = await supabase
                .from('whatsapp_logs')
                .select(`
                    id, content, status, created_at,
                    cliente:clientes (nombre, apellidos)
                `)
                .order('created_at', { ascending: false })
                .limit(10);

            setLogs((logsData as any) ?? []);
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleOpenWhatsApp = (cliente: Cliente) => {
        setSelectedCliente(cliente);
        setIsModalOpen(true);
    };

    const clientesFiltrados = clientes.filter(c =>
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (c.apellidos ?? '').toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-white mb-2">Mensajería WhatsApp</h1>
                <p className="text-slate-400">Hub centralizado para comunicaciones con clientes.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Selector de Clientes */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-3">
                            <Search className="text-slate-500 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Buscar cliente para enviar mensaje..."
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                                className="w-full bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none border-none"
                            />
                        </div>

                        <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-800">
                            {loading ? (
                                <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
                                    <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                                    Cargando clientes...
                                </div>
                            ) : clientesFiltrados.length === 0 ? (
                                <div className="p-12 text-center text-slate-500 italic">
                                    No se encontraron clientes.
                                </div>
                            ) : (
                                clientesFiltrados.map(cliente => (
                                    <div key={cliente.id} className="p-4 hover:bg-slate-800 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-white">{cliente.nombre} {cliente.apellidos ?? ''}</h3>
                                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Phone className="w-3 h-3" /> {cliente.telefono ?? 'Sin teléfono'}
                                                </p>
                                            </div>
                                        </div>
                                        {cliente.telefono && (
                                            <button
                                                onClick={() => handleOpenWhatsApp(cliente)}
                                                className="bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 opacity-0 group-hover:opacity-100"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                Contactar
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Historial Reciente */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <History className="w-5 h-5 text-emerald-500" />
                        Actividad Reciente
                    </h2>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
                        {loading ? (
                            <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-600" /></div>
                        ) : logs.length === 0 ? (
                            <p className="text-sm text-slate-500 italic text-center py-4">Sin mensajes registrados aún.</p>
                        ) : (
                            logs.map(log => (
                                <div key={log.id} className="border-b border-slate-800 last:border-0 pb-4 last:pb-0 space-y-1">
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-bold text-emerald-400">
                                            {log.cliente ? `${log.cliente.nombre}` : 'Desconocido'}
                                        </span>
                                        <span className="text-[10px] text-slate-500 whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-300 line-clamp-2 italic">"{log.content}"</p>
                                    <div className="flex items-center gap-1.5 pt-1">
                                        {log.status === 'sent' ? (
                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                        ) : (
                                            <Clock className="w-3 h-3 text-slate-500" />
                                        )}
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">{log.status}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {selectedCliente && (
                <WhatsAppModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    cliente={selectedCliente}
                />
            )}
        </div>
    );
}
