"use client";

import { useState } from "react";
import {
    ChevronLeft, ChevronRight,
    AlertCircle, Users, Clock, Gavel, Bell, ExternalLink
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useRouter } from "next/navigation";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type Event = {
    id: string;
    asunto: string;
    fecha_hora: string;
    tipo: string;
    tipo_plazo?: string | null;
    ubicacion?: string;
    es_critico?: boolean;
    color_hex?: string;
    expediente_id?: string | null;
};

interface SmartCalendarProps {
    events: Event[];
    onDateSelect?: (date: Date) => void;
    onEventClick?: (event: Event) => void;
}

// ── Paleta de colores por tipo_plazo ────────────────────────────────────────
function getEventStyle(tipo: string, tipoPlazo?: string | null, esCritico?: boolean): string {
    if (tipoPlazo === 'Plazo Procesal' || (esCritico && !tipoPlazo)) {
        return "bg-red-500/20 border-red-500/60 text-red-400 hover:bg-red-500/30";
    }
    if (tipoPlazo === 'Vencimiento') {
        return "bg-orange-500/20 border-orange-500/60 text-orange-400 hover:bg-orange-500/30";
    }
    if (tipoPlazo === 'Notificación Recibida') {
        return "bg-blue-500/20 border-blue-500/60 text-blue-400 hover:bg-blue-500/30";
    }
    // Legado sin tipo_plazo
    if (tipo === 'mediacion') return "bg-purple-600/20 border-purple-600/50 text-purple-400";
    if (tipo === 'vencimiento') return "bg-red-500/20 border-red-500/60 text-red-400";
    return "bg-cyan-500/20 border-cyan-500/50 text-cyan-400";
}

function getEventIcon(tipo: string, tipoPlazo?: string | null, esCritico?: boolean) {
    if (tipoPlazo === 'Plazo Procesal') return <Gavel className="w-3 h-3 shrink-0" />;
    if (tipoPlazo === 'Vencimiento') return <AlertCircle className="w-3 h-3 shrink-0" />;
    if (tipoPlazo === 'Notificación Recibida') return <Bell className="w-3 h-3 shrink-0" />;
    if (tipo === 'mediacion') return <Users className="w-3 h-3 shrink-0" />;
    if (esCritico || tipo === 'vencimiento') return <AlertCircle className="w-3 h-3 shrink-0" />;
    return <Clock className="w-3 h-3 shrink-0" />;
}

// ── Leyenda de tipos ─────────────────────────────────────────────────────────
const LEYENDA = [
    { label: 'Plazo Procesal', color: 'bg-red-500', text: 'Plazo procesal', emoji: '🔴' },
    { label: 'Vencimiento', color: 'bg-orange-500', text: 'Vencimiento', emoji: '🟠' },
    { label: 'Notificación Recibida', color: 'bg-blue-500', text: 'Notificación', emoji: '🔵' },
    { label: 'Cita general', color: 'bg-cyan-400', text: 'General', emoji: '🩵' },
];

// ── Componente ───────────────────────────────────────────────────────────────
export function SmartCalendar({ events, onDateSelect, onEventClick }: SmartCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const router = useRouter();

    const daysInMonth = (date: Date) =>
        new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

    const firstDayOfMonth = (date: Date) =>
        new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const getDayEvents = (day: number) =>
        events.filter(e => {
            const d = new Date(e.fecha_hora);
            return d.getDate() === day &&
                d.getMonth() === currentDate.getMonth() &&
                d.getFullYear() === currentDate.getFullYear();
        });

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ];
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

    const numDays = daysInMonth(currentDate);
    const startDay = firstDayOfMonth(currentDate);

    const handleEventClick = (e: React.MouseEvent, event: Event) => {
        e.stopPropagation();
        // Si tiene expediente vinculado → ir a la ficha directamente
        if (event.expediente_id) {
            router.push(`/expedientes/${event.expediente_id}`);
        } else {
            onEventClick?.(event);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-slate-900/50 border-b border-slate-800">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <CalendarIcon className="w-6 h-6 text-cyan-400" />
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                        className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors border border-slate-800">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => setCurrentDate(new Date())}
                        className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                        Hoy
                    </button>
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                        className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors border border-slate-800">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap gap-3 px-6 py-3 border-b border-slate-800 bg-slate-950/20">
                {LEYENDA.map(l => (
                    <div key={l.label} className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${l.color}`} />
                        <span className="text-xs text-slate-500">{l.text}</span>
                    </div>
                ))}
                <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-600">
                    <ExternalLink className="w-3 h-3" />
                    <span>Click en eventos con expediente → abre la ficha</span>
                </div>
            </div>

            {/* Cabecera días */}
            <div className="grid grid-cols-7 bg-slate-950/30">
                {days.map(d => (
                    <div key={d} className="p-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">
                        {d}
                    </div>
                ))}
            </div>

            {/* Grid días */}
            <div className="grid grid-cols-7 auto-rows-[120px]">
                {Array.from({ length: startDay }).map((_, i) => (
                    <div key={`e-${i}`} className="border-b border-r border-slate-800 bg-slate-950/10" />
                ))}

                {Array.from({ length: numDays }).map((_, i) => {
                    const day = i + 1;
                    const dayEvents = getDayEvents(day);
                    const isToday = new Date().toDateString() ===
                        new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

                    return (
                        <div key={day}
                            className={cn(
                                "border-b border-r border-slate-800 p-2 transition-colors hover:bg-slate-800/30 group cursor-pointer relative",
                                isToday && "bg-cyan-500/5 shadow-[inset_0_0_20px_rgba(34,211,238,0.05)]"
                            )}
                            onClick={() => onDateSelect?.(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                        >
                            <div className="flex justify-between items-start">
                                <span className={cn(
                                    "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-lg transition-all",
                                    isToday ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20" : "text-slate-500 group-hover:text-slate-200"
                                )}>
                                    {day}
                                </span>
                                {dayEvents.length > 1 && (
                                    <span className="text-[9px] text-slate-600 font-mono">{dayEvents.length}</span>
                                )}
                            </div>

                            <div className="mt-1.5 space-y-1 overflow-y-auto max-h-[72px]">
                                {dayEvents.map(event => (
                                    <div key={event.id}
                                        onClick={e => handleEventClick(e, event)}
                                        title={event.expediente_id
                                            ? `${event.asunto} → Ver expediente`
                                            : event.asunto}
                                        className={cn(
                                            "text-[10px] p-1.5 rounded-lg border flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 truncate",
                                            getEventStyle(event.tipo, event.tipo_plazo, event.es_critico),
                                            event.expediente_id && "ring-1 ring-white/10 cursor-pointer"
                                        )}
                                    >
                                        {getEventIcon(event.tipo, event.tipo_plazo, event.es_critico)}
                                        <span className="truncate flex-1 font-medium">{event.asunto}</span>
                                        {event.expediente_id && <ExternalLink className="w-2.5 h-2.5 opacity-50 shrink-0" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {Array.from({ length: (7 - (startDay + numDays) % 7) % 7 }).map((_, i) => (
                    <div key={`f-${i}`} className="border-b border-r border-slate-800 bg-slate-950/10" />
                ))}
            </div>
        </div>
    );
}

function CalendarIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}
