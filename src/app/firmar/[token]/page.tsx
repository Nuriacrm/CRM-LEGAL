"use client";

import { useState, useEffect, use, useRef } from "react";
import { supabase } from "@/lib/supabase";
import SignaturePad, { type SignaturePadRef } from "@/components/ui/SignaturePad";
import {
    ShieldCheck, AlertTriangle, Loader2,
    Clock, CheckCircle, Trash2, RotateCcw
} from "lucide-react";

type Solicitud = {
    id: string; token: string; cliente_nombre: string;
    titulo_documento: string; contenido_documento: string;
    estado: "pendiente" | "firmado" | "expirado";
    firmado_at: string | null; expira_at: string;
};

export default function FirmarPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);

    const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [aceptado, setAceptado] = useState(false);
    const [firmado, setFirmado] = useState(false);
    const [enviando, setEnviando] = useState(false);

    const padRef = useRef<SignaturePadRef>(null);
    const [padVacio, setPadVacio] = useState(true);

    useEffect(() => {
        const fetchSolicitud = async () => {
            const { data, error } = await supabase
                .from("solicitudes_firma")
                .select("*")
                .eq("token", token)
                .single();

            if (error || !data) {
                setError("Enlace de firma no válido o no encontrado.");
            } else if (data.estado === "firmado") {
                setSolicitud(data);
                setFirmado(true);
            } else if (new Date(data.expira_at) < new Date()) {
                setError("Este enlace de firma ha expirado (validez 72 horas).");
            } else {
                setSolicitud(data);
            }
            setCargando(false);
        };
        fetchSolicitud();
    }, [token]);

    const handleFirmar = async () => {
        if (!solicitud || padRef.current?.isEmpty() || !aceptado) return;
        if (!padRef.current) return; // TypeScript null guard
        const dataUrl = padRef.current.toDataURL("image/png");


        setEnviando(true);
        const { error } = await supabase
            .from("solicitudes_firma")
            .update({
                estado: "firmado",
                firma_url: dataUrl,
                firmado_at: new Date().toISOString(),
            })
            .eq("token", token);

        setEnviando(false);
        if (error) {
            setError("Error al guardar la firma. Por favor inténtelo de nuevo.");
        } else {
            setFirmado(true);
        }
    };

    const fechaExpira = solicitud
        ? new Date(solicitud.expira_at).toLocaleDateString("es-ES", {
            day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
        })
        : "";

    // ---- Estado cargando ----
    if (cargando) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="flex items-center gap-3 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
                Cargando documento…
            </div>
        </div>
    );

    // ---- Estado error ----
    if (error) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-10 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <h1 className="text-xl font-bold text-slate-800 mb-2">Enlace no válido</h1>
                <p className="text-slate-500 text-sm">{error}</p>
            </div>
        </div>
    );

    // ---- Estado firmado ----
    if (firmado) return (
        <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-emerald-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-10 max-w-md w-full text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck className="w-10 h-10 text-emerald-500" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Documento Firmado</h1>
                <p className="text-slate-500 text-sm mb-6">
                    <strong>{solicitud?.titulo_documento}</strong> ha sido firmado correctamente.
                    {solicitud?.firmado_at && (
                        <> El {new Date(solicitud.firmado_at).toLocaleDateString("es-ES", {
                            day: "2-digit", month: "long", year: "numeric",
                            hour: "2-digit", minute: "2-digit"
                        })}.</>
                    )}
                </p>
                <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-400 text-left space-y-1.5">
                    <p><span className="font-semibold text-slate-600">Firmado por:</span> {solicitud?.cliente_nombre}</p>
                    <p><span className="font-semibold text-slate-600">Despacho:</span> Nuria Arau · Mediación y Abogacía</p>
                    <p><span className="font-semibold text-slate-600">Referencia:</span> {token.slice(0, 8).toUpperCase()}</p>
                </div>
            </div>
        </div>
    );

    // ---- Página activa de firma ----
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-violet-600 uppercase tracking-widest">Nuria Arau</p>
                        <h1 className="text-base font-bold text-slate-800">Mediación y Abogacía</h1>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="hidden sm:inline">Válido hasta: </span>{fechaExpira}
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto py-8 px-4 space-y-5">
                {/* Info del documento */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <p className="text-xs font-bold text-violet-500 uppercase tracking-widest mb-1">Documento para firma electrónica</p>
                    <h2 className="text-xl font-bold text-slate-800 mb-1">{solicitud!.titulo_documento}</h2>
                    <p className="text-sm text-slate-500">Firmante: <strong className="text-slate-700">{solicitud!.cliente_nombre}</strong></p>
                </div>

                {/* Contenido del documento */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-100 px-6 py-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contenido del documento</p>
                    </div>
                    <div className="p-6 max-h-72 overflow-y-auto">
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-mono">
                            {solicitud!.contenido_documento}
                        </p>
                    </div>
                </div>

                {/* Área de firma */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-800">Su Firma</h3>
                        <div className="flex gap-2">
                            <button onClick={() => { padRef.current?.undo(); setPadVacio(padRef.current?.isEmpty() ?? true); }}
                                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                                <RotateCcw className="w-3.5 h-3.5" /> Deshacer
                            </button>
                            <button onClick={() => { padRef.current?.clear(); setPadVacio(true); }}
                                className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                                <Trash2 className="w-3.5 h-3.5" /> Borrar
                            </button>
                        </div>
                    </div>

                    <div
                        className="relative rounded-xl overflow-hidden border-2 border-dashed border-slate-300 hover:border-violet-400 transition-colors"
                        style={{ height: "200px" }}
                        onPointerUp={() => setPadVacio(padRef.current?.isEmpty() ?? true)}
                        onTouchEnd={() => setPadVacio(padRef.current?.isEmpty() ?? true)}
                    >
                        <SignaturePad ref={padRef} penColor="#1e293b" backgroundColor="#f8fafc" className="absolute inset-0" />
                        {padVacio && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <p className="text-slate-400 text-sm">Firme aquí con el dedo o el ratón</p>
                            </div>
                        )}
                    </div>

                    <p className="text-xs text-slate-400 text-right">
                        {new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                </div>

                {/* Aceptación + botón */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" checked={aceptado} onChange={e => setAceptado(e.target.checked)}
                            className="mt-0.5 w-5 h-5 rounded accent-violet-600 shrink-0" />
                        <span className="text-sm text-slate-600 leading-relaxed">
                            He leído y comprendido el contenido del documento y acepto firmarlo voluntariamente.
                            Entiendo que esta firma electrónica tiene validez legal en España conforme a la Ley 6/2020 y el Reglamento eIDAS.
                        </span>
                    </label>

                    <button onClick={handleFirmar}
                        disabled={!aceptado || padVacio || enviando}
                        className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-violet-600/25 text-sm">
                        {enviando
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando firma…</>
                            : <><CheckCircle className="w-4 h-4" /> Firmar documento</>}
                    </button>

                    {(!aceptado || padVacio) && (
                        <p className="text-xs text-center text-slate-400">
                            {padVacio ? "✏️ Dibuje su firma en el recuadro" : "☑️ Marque la casilla de aceptación"}
                        </p>
                    )}
                </div>

                <p className="text-center text-xs text-slate-400 pb-8">
                    Documento emitido por <strong>Nuria Arau · Mediación y Abogacía</strong><br />
                    Ref: {token.slice(0, 8).toUpperCase()} · Firma electrónica simple (Reglamento eIDAS)
                </p>
            </main>
        </div>
    );
}
