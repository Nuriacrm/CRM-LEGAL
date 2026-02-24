"use client";

import { useState } from "react";
import { X, Send, MessageSquare, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { whatsappService } from "@/lib/whatsapp";

interface WhatsAppModalProps {
    isOpen: boolean;
    onClose: () => void;
    cliente: {
        id: string;
        nombre: string;
        telefono: string | null;
    };
}

export function WhatsAppModal({ isOpen, onClose, cliente }: WhatsAppModalProps) {
    const [message, setMessage] = useState("");
    const [template, setTemplate] = useState("custom");
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);

    const templates = [
        { id: "custom", name: "Mensaje Personalizado" },
        { id: "bienvenida", name: "Bienvenida (Plantilla)" },
        { id: "recordatorio_cita", name: "Recordatorio de Cita (Plantilla)" },
        { id: "seguimiento_caso", name: "Seguimiento de Caso (Plantilla)" },
    ];

    const handleSend = async () => {
        if (!cliente.telefono) {
            alert("El cliente no tiene un teléfono registrado.");
            return;
        }

        setSending(true);
        try {
            if (template === "custom") {
                await whatsappService.sendMessage(cliente.telefono, message, cliente.id);
            } else {
                await whatsappService.sendTemplate(cliente.telefono, template, 'es', [], cliente.id);
            }
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 2000);
        } catch (error) {
            alert("Error al enviar mensaje.");
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-emerald-400" />
                        Enviar WhatsApp
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-2xl p-4">
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Destinatario</p>
                        <p className="text-white font-medium">{cliente.nombre}</p>
                        <p className="text-slate-400 text-sm">{cliente.telefono || "Sin teléfono"}</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Seleccionar Tipo</label>
                            <select
                                value={template}
                                onChange={e => setTemplate(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                            >
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        {template === "custom" && (
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Mensaje</label>
                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    placeholder="Escribe tu mensaje aquí..."
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none min-h-[120px] resize-none"
                                />
                            </div>
                        )}
                    </div>

                    <div className="pt-2 flex flex-col gap-3">
                        {success ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-xl p-3 flex items-center justify-center gap-2 text-emerald-400 font-bold animate-in fade-in zoom-in-95">
                                <CheckCircle2 className="w-5 h-5" />
                                Mensaje enviado con éxito
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={handleSend}
                                    disabled={sending || (template === "custom" && !message)}
                                    className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 border border-slate-700"
                                >
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    {sending ? "Enviando..." : "Envío Automático (vía API)"}
                                </button>

                                <div className="flex items-center gap-3 py-1">
                                    <div className="flex-1 h-[1px] bg-slate-800" />
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">O también</span>
                                    <div className="flex-1 h-[1px] bg-slate-800" />
                                </div>

                                <button
                                    onClick={() => whatsappService.openInApp(cliente.telefono!, template === "custom" ? message : `Hola ${cliente.nombre}, tengo una actualización sobre su caso.`)}
                                    disabled={!cliente.telefono}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                    Abrir en mi WhatsApp App
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
