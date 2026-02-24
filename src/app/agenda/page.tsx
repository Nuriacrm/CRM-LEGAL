"use client";

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Calculator, Clock, Plus, MapPin, Users, Loader2, Mail, AlertCircle } from 'lucide-react';
import { CalculadoraPlazos } from '@/components/agenda/CalculadoraPlazos';
import { SmartCalendar } from '@/components/agenda/SmartCalendar';
import { EventModal } from '@/components/agenda/EventModal';
import { supabase } from '@/lib/supabase';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function AgendaPage() {
    const [activeTab, setActiveTab] = useState<'calendario' | 'calculadora'>('calendario');
    const [eventos, setEventos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

    const fetchEventos = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('citas')
            .select('*')
            .order('fecha_hora', { ascending: true });

        if (!error && data) {
            setEventos(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchEventos();
    }, []);

    const handleOpenCreateModal = (date: Date = new Date()) => {
        setSelectedEvent(null);
        setSelectedDate(date);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (event: any) => {
        setSelectedEvent(event);
        setIsModalOpen(true);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header section remains the same as previously implemented */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                        <div className="bg-cyan-500 p-2 rounded-xl">
                            <CalendarIcon className="text-slate-950 w-8 h-8" />
                        </div>
                        Agenda Profesional
                    </h1>
                    <p className="text-slate-400 mt-2">Gestiona tus plazos, vistas y mediaciones.</p>
                </div>

                <div className="flex gap-4">
                    <a
                        href="/api/auth/google"
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition-all font-semibold"
                    >
                        <Mail className="w-4 h-4 text-cyan-400" />
                        Conectar Google Calendar
                    </a>
                    <button
                        onClick={() => handleOpenCreateModal()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-bold shadow-lg shadow-cyan-500/20 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Nuevo Evento
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    {activeTab === 'calendario' ? (
                        <div className="space-y-6">
                            <SmartCalendar
                                events={eventos}
                                onDateSelect={handleOpenCreateModal}
                                onEventClick={handleOpenEditModal}
                            />
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <CalculadoraPlazos />
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-cyan-400" />
                                Próximos Eventos
                            </h3>
                            <div className="flex p-1 bg-slate-800 rounded-lg">
                                <button
                                    onClick={() => setActiveTab('calendario')}
                                    className={cn(
                                        "px-3 py-1 rounded-md text-xs font-bold transition-all",
                                        activeTab === 'calendario' ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    Agenda
                                </button>
                                <button
                                    onClick={() => setActiveTab('calculadora')}
                                    className={cn(
                                        "px-3 py-1 rounded-md text-xs font-bold transition-all",
                                        activeTab === 'calculadora' ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    Plazos
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {eventos.filter(e => new Date(e.fecha_hora) >= new Date()).slice(0, 5).map(evento => (
                                <div
                                    key={evento.id}
                                    onClick={() => handleOpenEditModal(evento)}
                                    className="group relative bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 hover:border-cyan-500/50 transition-all cursor-pointer"
                                >
                                    {evento.es_critico && (
                                        <div className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg animate-pulse">
                                            <AlertCircle className="w-4 h-4" />
                                        </div>
                                    )}
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "p-3 rounded-xl",
                                            evento.tipo === 'mediacion' ? "bg-blue-600/20 text-blue-400" :
                                                evento.tipo === 'vencimiento' || evento.es_critico ? "bg-red-500/20 text-red-500" :
                                                    "bg-cyan-500/10 text-cyan-400"
                                        )}>
                                            {evento.tipo === 'vencimiento' || evento.es_critico ? <AlertCircle className="w-5 h-5" /> :
                                                evento.tipo === 'mediacion' ? <Users className="w-5 h-5" /> : <CalendarIcon className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-slate-200 font-bold text-sm truncate group-hover:text-cyan-400 transition-colors uppercase tracking-tight">
                                                {evento.asunto}
                                            </h4>
                                            <div className="mt-2 space-y-1">
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(evento.fecha_hora).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                {evento.ubicacion && (
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <MapPin className="w-3 h-3" />
                                                        {evento.ubicacion}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {eventos.length === 0 && !loading && (
                                <div className="text-center py-10">
                                    <div className="bg-slate-800 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 opacity-20">
                                        <CalendarIcon className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 text-sm">No hay eventos pendientes.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 text-center border border-slate-700/50">
                        <CalendarIcon className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                        <h4 className="text-white font-medium mb-1">Sincronización Activa</h4>
                        <p className="text-xs text-slate-400">Plazos vinculados automáticamente con tus expedientes.</p>
                    </div>
                </div>
            </div>

            <EventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchEventos}
                event={selectedEvent}
                selectedDate={selectedDate || undefined}
            />
        </div>
    );
}
