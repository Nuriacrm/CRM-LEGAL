"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { PenLine, Trash2, CheckCircle } from "lucide-react";

interface FirmaCanvasProps {
    onFirmaCapturada: (dataUrl: string) => void;
    onCancelar: () => void;
    titulo?: string;
    descripcion?: string;
}

export default function FirmaCanvas({
    onFirmaCapturada,
    onCancelar,
    titulo = "Firma del Cliente",
    descripcion = "El cliente debe firmar en el recuadro inferior con el dedo o el ratón.",
}: FirmaCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dibujando = useRef(false);
    const [tieneFirma, setTieneFirma] = useState(false);

    // Inicializar canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#0f172a"; // slate-950
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
    }, []);

    const getPosicion = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        if ("touches" in e) {
            const touch = e.touches[0];
            return {
                x: (touch.clientX - rect.left) * scaleX,
                y: (touch.clientY - rect.top) * scaleY,
            };
        }
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    const iniciarTrazo = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        dibujando.current = true;
        const pos = getPosicion(e, canvas);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }, []);

    const dibujar = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (!dibujando.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const pos = getPosicion(e, canvas);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        setTieneFirma(true);
    }, []);

    const terminarTrazo = useCallback(() => {
        dibujando.current = false;
    }, []);

    const limpiar = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setTieneFirma(false);
    };

    const confirmar = () => {
        const canvas = canvasRef.current;
        if (!canvas || !tieneFirma) return;
        onFirmaCapturada(canvas.toDataURL("image/png"));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6">
                {/* Cabecera */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                        <PenLine className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">{titulo}</h2>
                        <p className="text-xs text-slate-400">{descripcion}</p>
                    </div>
                </div>

                {/* Área de firma */}
                <div className="relative mt-4 mb-2 rounded-xl overflow-hidden border-2 border-dashed border-slate-600 hover:border-emerald-500/50 transition-colors">
                    <canvas
                        ref={canvasRef}
                        width={560}
                        height={220}
                        className="w-full touch-none cursor-crosshair"
                        onMouseDown={iniciarTrazo}
                        onMouseMove={dibujar}
                        onMouseUp={terminarTrazo}
                        onMouseLeave={terminarTrazo}
                        onTouchStart={iniciarTrazo}
                        onTouchMove={dibujar}
                        onTouchEnd={terminarTrazo}
                    />
                    {!tieneFirma && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <p className="text-slate-600 text-sm font-medium">Firme aquí →</p>
                        </div>
                    )}
                </div>

                <p className="text-xs text-slate-500 mb-5 text-center">
                    Firma válida registrada en {new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })} a las {new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                </p>

                {/* Acciones */}
                <div className="flex items-center justify-between gap-3">
                    <button
                        onClick={limpiar}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
                    >
                        <Trash2 className="w-4 h-4" /> Borrar
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onCancelar}
                            className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmar}
                            disabled={!tieneFirma}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
                        >
                            <CheckCircle className="w-4 h-4" /> Confirmar Firma
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
