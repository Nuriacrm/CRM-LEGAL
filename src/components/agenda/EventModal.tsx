"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Clock, MapPin, Tag, FileText, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    event?: any; // If provided, we are in edit mode
    selectedDate?: Date;
}

export function EventModal({ isOpen, onClose, onSuccess, event, selectedDate }: EventModalProps) {
    const [asunto, setAsunto] = useState("");
    const [fecha, setFecha] = useState("");
    const [hora, setHora] = useState("09:00");
    const [tipo, setTipo] = useState("reunion");
    const [ubicacion, setUbicacion] = useState("");
    const [esCritico, setEsCritico] = useState(false);
    const [expedienteId, setExpedienteId] = useState("");
    const [expedientes, setExpedientes] = useState<any[]>([]);
    const [loadingExp, setLoadingExp] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (event) {
            setAsunto(event.asunto || "");
            const dateObj = new Date(event.fecha_hora);
            setFecha(dateObj.toISOString().split('T')[0]);
            setHora(dateObj.toTimeString().slice(0, 5));
            setTipo(event.tipo || "reunion");
            setUbicacion(event.ubicacion || "");
            setEsCritico(event.es_critico || false);
            setExpedienteId(event.expediente_id || "");
        } else if (selectedDate) {
            setFecha(selectedDate.toISOString().split('T')[0]);
            setAsunto("");
            setUbicacion("");
            setEsCritico(false);
            setExpedienteId("");
        }
    }, [event, selectedDate, isOpen]);

    useEffect(() => {
        const fetchExpedientes = async () => {
            const { data } = await supabase
                .from('expedientes')
                .select('id, numero_expediente, caratula')
                .order('created_at', { ascending: false });
            setExpedientes(data || []);
            setLoadingExp(false);
        };
        if (isOpen) fetchExpedientes();
    }, [isOpen]);

    const callSyncApi = async (action: 'create' | 'update' | 'delete', data: any, googleEventId?: string) => {
        try {
            const response = await fetch('/api/agenda/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, eventData: data, googleEventId })
            });
            return await response.json();
        } catch (err) {
            console.error("Sync failed:", err);
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const eventData = {
            asunto,
            fecha_hora: `${fecha}T${hora}:00`,
            tipo,
            ubicacion,
            es_critico: esCritico,
            expediente_id: expedienteId || null
        };

        let dbError;
        let syncedEventId = event?.google_event_id;

        if (event?.id) {
            const { error: updateError } = await supabase
                .from('citas')
                .update(eventData)
                .eq('id', event.id);
            dbError = updateError;

            // Sync update to Google
            if (!dbError && syncedEventId) {
                await callSyncApi('update', eventData, syncedEventId);
            }
        } else {
            // First sync to Google to get the ID if possible (simplified: sync after DB insert)
            const { data: inserted, error: insertError } = await supabase
                .from('citas')
                .insert([eventData])
                .select()
                .single();
            dbError = insertError;

            // Sync create to Google
            if (!dbError && inserted) {
                const syncResult = await callSyncApi('create', eventData);
                if (syncResult && syncResult.id) {
                    await supabase
                        .from('citas')
                        .update({ google_event_id: syncResult.id })
                        .eq('id', inserted.id);
                }
            }
        }

        setSubmitting(false);
        if (dbError) {
            alert("Error al guardar evento: " + dbError.message);
        } else {
            onSuccess();
            onClose();
        }
    };

    const handleDelete = async () => {
        if (!event?.id || !confirm("¿Estás seguro de que deseas eliminar este evento?")) return;

        setDeleting(true);

        // Sync delete to Google
        if (event.google_event_id) {
            await callSyncApi('delete', {}, event.google_event_id);
        }

        const { error } = await supabase
            .from('citas')
            .delete()
            .eq('id', event.id);

        setDeleting(false);
        if (error) {
            alert("Error al eliminar evento: " + error.message);
        } else {
            onSuccess();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-cyan-400" />
                        {event ? "Editar Evento" : "Nuevo Evento"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Asunto */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Asunto *</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                            <input
                                required
                                type="text"
                                placeholder="Ej: Reunión con cliente, Juicio ordinario..."
                                value={asunto}
                                onChange={e => setAsunto(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Fecha */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Fecha</label>
                            <input
                                required
                                type="date"
                                value={fecha}
                                onChange={e => setFecha(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-cyan-500/50 outline-none"
                            />
                        </div>
                        {/* Hora */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Hora</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                <input
                                    required
                                    type="time"
                                    value={hora}
                                    onChange={e => setHora(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-cyan-500/50 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Tipo */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Tipo</label>
                            <select
                                value={tipo}
                                onChange={e => setTipo(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-cyan-500/50 outline-none"
                            >
                                <option value="reunion">🤝 Reunión</option>
                                <option value="juicio">⚖️ Juicio / Vista</option>
                                <option value="vencimiento">🚩 Vencimiento</option>
                                <option value="mediacion">🧘 Mediación</option>
                                <option value="otro">📁 Otro</option>
                            </select>
                        </div>
                        {/* Ubicación */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Ubicación</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Despacho, Juzgado Nº 4..."
                                    value={ubicacion}
                                    onChange={e => setUbicacion(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-cyan-500/50 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Expediente Relacionado */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Expediente Relacionado</label>
                        <div className="relative">
                            <Tag className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                            <select
                                value={expedienteId}
                                onChange={e => setExpedienteId(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-cyan-500/50 outline-none appearance-none"
                            >
                                <option value="">Ninguno</option>
                                {expedientes.map(exp => (
                                    <option key={exp.id} value={exp.id}>{exp.numero_expediente} - {exp.caratula}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Opciones Avanzadas */}
                    <div className="pt-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={esCritico}
                                    onChange={e => setEsCritico(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-10 h-5 bg-slate-700 rounded-full peer peer-checked:bg-red-500 transition-colors"></div>
                                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                            </div>
                            <div>
                                <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors flex items-center gap-1.5">
                                    <AlertCircle className={esCritico ? "text-red-500" : "text-slate-500"} />
                                    Marcar como Crítico (Activar Alarma)
                                </span>
                                <p className="text-[10px] text-slate-500">Se enviará un recordatorio 24h antes vía Gmail.</p>
                            </div>
                        </label>
                    </div>

                    <div className="pt-4 flex gap-3">
                        {event && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-4 py-3 rounded-xl border border-red-500/50 text-red-500 font-bold text-sm hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
                            >
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 rounded-xl border border-slate-700 text-slate-400 font-bold text-sm hover:bg-slate-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            disabled={submitting}
                            type="submit"
                            className="flex-[2] bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Evento"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
