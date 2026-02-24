"use client";

import { useState } from "react";
import { X, Send, Loader2, Mail } from "lucide-react";

interface SendEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientEmail: string;
    onSent?: () => void;
    initialSubject?: string;
}

export function SendEmailModal({ isOpen, onClose, recipientEmail, onSent, initialSubject }: SendEmailModalProps) {
    const [subject, setSubject] = useState(initialSubject || "");
    const [body, setBody] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSend = async () => {
        if (!subject || !body) {
            setError("Por favor, completa el asunto y el mensaje.");
            return;
        }

        setSending(true);
        setError(null);
        try {
            const res = await fetch("/api/gmail/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to: recipientEmail,
                    subject,
                    body,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al enviar el correo");

            onSent?.();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-500/20 p-2 rounded-lg">
                            <Mail className="w-4 h-4 text-blue-400" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Redactar Mensaje</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Destinatario</label>
                        <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-400 text-sm font-medium">
                            {recipientEmail}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Asunto</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Ej: Información sobre su expediente..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Mensaje</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={8}
                            placeholder="Escribe aquí tu mensaje..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600 resize-none"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-900 shadow-inner border-t border-slate-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sending}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
                    >
                        {sending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Enviar vía Gmail
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
