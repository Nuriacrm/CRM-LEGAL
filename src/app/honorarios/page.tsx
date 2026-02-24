"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Calculator, FileText, ChevronRight, Info, Sparkles, Receipt,
    FileSignature, Scale, Save, Clock, Trash2, AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
type Estrategia = {
    id: string;
    created_at: string;
    tipo_procedimiento: string;
    cuantia: number | null;
    honorarios_base: number;
    honorarios_con_iva: number;
    concepto_ajuste: string | null;
    cliente_nombre: string | null;
    expediente_ref: string | null;
};

// ---------------------------------------------------------------------------
// Baremo ICALI simulado
// ---------------------------------------------------------------------------
const BAREMO_ICALI = [
    { id: "proc_ordinario", tipo: "Procedimiento Ordinario", baseMin: 900, baseMax: 2500, tieneEscala: true },
    { id: "juicio_verbal", tipo: "Juicio Verbal (< 6.000€)", baseMin: 600, baseMax: 1200, tieneEscala: true },
    { id: "monitorio", tipo: "Proc. Monitorio / Cambiario", baseMin: 350, baseMax: 800, tieneEscala: true },
    { id: "divorcio_mutuo", tipo: "Divorcio Mutuo Acuerdo", baseMin: 900, baseMax: 1500, tieneEscala: false },
    { id: "divorcio_contencioso", tipo: "Divorcio Contencioso", baseMin: 1800, baseMax: 4000, tieneEscala: false },
    { id: "medidas_cautelares", tipo: "Medidas Cautelares / Urgentes", baseMin: 600, baseMax: 1200, tieneEscala: false },
    { id: "ejecucion_hipotecaria", tipo: "Ejecución Hipotecaria", baseMin: 800, baseMax: 2000, tieneEscala: true },
    { id: "apelacion", tipo: "Recurso de Apelación", baseMin: 700, baseMax: 1800, tieneEscala: false },
    { id: "contrato_revision", tipo: "Revisión / Redacción Contrato", baseMin: 400, baseMax: 1200, tieneEscala: false },
    { id: "asesoramiento", tipo: "Asesoramiento Jurídico General", baseMin: 150, baseMax: 500, tieneEscala: false },
];

// ---------------------------------------------------------------------------
// Escala ICALI por tramos
// ---------------------------------------------------------------------------
function calcularEscalaICALI(cuantia: number) {
    const tramos = [
        { hasta: 3000, desde: 0, pct: 0.15, label: "Hasta 3.000€" },
        { hasta: 30000, desde: 3000, pct: 0.10, label: "De 3.001€ a 30.000€" },
        { hasta: 100000, desde: 30000, pct: 0.07, label: "De 30.001€ a 100.000€" },
        { hasta: Infinity, desde: 100000, pct: 0.05, label: "Más de 100.000€" },
    ];
    let total = 0;
    const desglose = tramos
        .filter((t) => cuantia > t.desde)
        .map((t) => {
            const base = Math.min(cuantia, t.hasta) - t.desde;
            const honorarios = base * t.pct;
            total += honorarios;
            return { tramo: t.label, porcentaje: t.pct * 100, base, honorarios };
        });
    return { desglose, total };
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
export default function HonorariosPage() {
    const router = useRouter();

    // Calculadora
    const [conceptoId, setConceptoId] = useState("");
    const [cuantia, setCuantia] = useState<number | "">("");
    const [ajusteManual, setAjusteManual] = useState<number | "">("");
    const [mostrarHoja, setMostrarHoja] = useState(false);

    // Datos del cliente (opcionales para guardar)
    const [clienteNombre, setClienteNombre] = useState("");
    const [expedienteRef, setExpedienteRef] = useState("");

    // Supabase — Estrategias guardadas
    const [estrategias, setEstrategias] = useState<Estrategia[]>([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const mostrarToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 3500);
    };

    // ---- Cargar estrategias desde Supabase ----
    const cargarEstrategias = useCallback(async () => {
        setCargando(true);
        const { data, error } = await supabase
            .from("honorarios_estrategias")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            setErrorMsg("No se pudo conectar con Supabase: " + error.message);
        } else {
            setEstrategias(data ?? []);
            setErrorMsg(null);
        }
        setCargando(false);
    }, []);

    useEffect(() => {
        cargarEstrategias();
    }, [cargarEstrategias]);

    // ---- Cálculos ----
    const concepto = BAREMO_ICALI.find((b) => b.id === conceptoId);

    const escala = useMemo(() => {
        if (!concepto?.tieneEscala || typeof cuantia !== "number" || cuantia <= 0) return null;
        return calcularEscalaICALI(cuantia);
    }, [cuantia, concepto]);

    const honorariosSugeridos = escala
        ? escala.total
        : concepto
            ? (concepto.baseMin + concepto.baseMax) / 2
            : 0;

    const honorariosFinal =
        typeof ajusteManual === "number" && ajusteManual > 0
            ? ajusteManual
            : honorariosSugeridos;

    const importeConIVA = honorariosFinal * 1.21;

    // ---- Guardar en Supabase ----
    const handleGuardar = async () => {
        if (!concepto) return;
        setGuardando(true);
        const { error } = await supabase.from("honorarios_estrategias").insert({
            tipo_procedimiento: concepto.tipo,
            cuantia: typeof cuantia === "number" && cuantia > 0 ? cuantia : null,
            honorarios_base: honorariosFinal,
            honorarios_con_iva: importeConIVA,
            concepto_ajuste: typeof ajusteManual === "number" && ajusteManual > 0
                ? `Ajuste manual a ${ajusteManual}€` : null,
            cliente_nombre: clienteNombre || null,
            expediente_ref: expedienteRef || null,
        });
        setGuardando(false);
        if (error) {
            mostrarToast("❌ Error al guardar: " + error.message);
        } else {
            mostrarToast("✅ Estrategia guardada correctamente");
            cargarEstrategias();
        }
    };

    // ---- Enviar a Verifactu ----
    const handleEnviarFactura = (modo: "provision" | "directa") => {
        const params = new URLSearchParams({
            concepto: concepto?.tipo ?? "Honorarios profesionales",
            importe: honorariosFinal.toFixed(2),
            modo,
        });
        router.push(`/facturacion?${params.toString()}`);
    };

    // ---- Helpers de sidebar ----
    const formatEur = (n: number) =>
        n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

    const formatFecha = (iso: string) =>
        new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "2-digit" });

    return (
        <div className="max-w-[1400px] mx-auto flex gap-6 h-full animate-in fade-in duration-500">

            {/* ================================================================
          SIDEBAR IZQUIERDA — Historial Supabase
      ================================================================ */}
            <aside className="w-72 shrink-0 flex flex-col gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col h-full max-h-[calc(100vh-10rem)] overflow-hidden">
                    <div className="flex items-center justify-between mb-4 shrink-0">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <Clock className="w-4 h-4 text-cyan-400" />
                            Estrategias Guardadas
                        </h2>
                        <button
                            onClick={cargarEstrategias}
                            className="text-xs text-slate-500 hover:text-cyan-400 transition-colors"
                            title="Actualizar"
                        >
                            ↻
                        </button>
                    </div>

                    {errorMsg && (
                        <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-3 text-xs text-red-300 flex gap-2 items-start shrink-0 mb-3">
                            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            {errorMsg}
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                        {cargando ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-20 bg-slate-800/40 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : estrategias.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 text-xs">
                                <Scale className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                Aún no hay estrategias guardadas.
                            </div>
                        ) : (
                            estrategias.map((e) => (
                                <div
                                    key={e.id}
                                    className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-cyan-500/30 rounded-xl p-3 transition-all cursor-default group"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-xs font-semibold text-white leading-tight flex-1 pr-2">{e.tipo_procedimiento}</p>
                                        <span className="text-[10px] text-slate-500 whitespace-nowrap">{formatFecha(e.created_at)}</span>
                                    </div>
                                    {e.cliente_nombre && (
                                        <p className="text-[10px] text-slate-400 mb-1">👤 {e.cliente_nombre}</p>
                                    )}
                                    {e.expediente_ref && (
                                        <p className="text-[10px] text-slate-400 mb-1">📁 {e.expediente_ref}</p>
                                    )}
                                    {e.cuantia && (
                                        <p className="text-[10px] text-slate-500">Cuantía: {formatEur(e.cuantia)}</p>
                                    )}
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50">
                                        <span className="text-xs font-bold text-cyan-400 font-mono">{formatEur(e.honorarios_con_iva)}</span>
                                        <span className="text-[10px] text-slate-500">c/ IVA</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </aside>

            {/* ================================================================
          PANEL DERECHO — Calculadora
      ================================================================ */}
            <div className="flex-1 space-y-6 min-w-0">
                {/* Cabecera */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                            <Scale className="w-7 h-7 text-cyan-500" />
                            Calculadora de Honorarios ICALI
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Presupuesta honorarios y guárdalos directamente en Supabase.
                        </p>
                    </div>
                    <button
                        onClick={() => setMostrarHoja(true)}
                        className="flex items-center gap-2 bg-cyan-900/30 hover:bg-cyan-800/40 border border-cyan-500/30 text-cyan-400 px-4 py-2 rounded-xl font-semibold text-sm transition-colors whitespace-nowrap"
                    >
                        <FileSignature className="w-4 h-4" /> Hoja de Encargo
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* ---- Izquierda: Inputs ---- */}
                    <div className="space-y-5">

                        {/* Selector ICALI */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-emerald-400" />Tipo de Procedimiento
                            </h2>
                            <select
                                value={conceptoId}
                                onChange={(e) => { setConceptoId(e.target.value); setAjusteManual(""); }}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-500/70 cursor-pointer"
                            >
                                <option value="">— Selecciona del baremo ICALI —</option>
                                {BAREMO_ICALI.map((b) => (
                                    <option key={b.id} value={b.id}>{b.tipo}</option>
                                ))}
                            </select>
                            {concepto && (
                                <div className="mt-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3 text-xs animate-in fade-in">
                                    <div className="flex items-start gap-2 text-emerald-300">
                                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                        <p>
                                            Orientativo:{" "}
                                            <span className="text-white font-mono">{concepto.baseMin.toLocaleString("es-ES")}€</span>
                                            {" "}–{" "}
                                            <span className="text-white font-mono">{concepto.baseMax.toLocaleString("es-ES")}€</span>
                                            {concepto.tieneEscala && (
                                                <span className="ml-2 text-cyan-400">· Admite escala por cuantía</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Cuantía */}
                        {concepto?.tieneEscala && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm animate-in fade-in">
                                <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                                    <Calculator className="w-4 h-4 text-blue-400" />Cuantía del Pleito
                                </h2>
                                <div className="relative">
                                    <span className="absolute left-4 top-3 text-slate-500 font-bold text-lg">€</span>
                                    <input
                                        type="number" min={0} value={cuantia}
                                        onChange={(e) => setCuantia(e.target.value === "" ? "" : Number(e.target.value))}
                                        placeholder="0.00"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-lg font-bold focus:outline-none focus:border-cyan-500/70"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Ajuste manual + datos opcionales */}
                        {concepto && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                                    Datos Opcionales
                                    <span className="text-xs text-slate-500 font-normal">para el registro</span>
                                </h2>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Ajuste Manual (€)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-slate-500">€</span>
                                        <input
                                            type="number" min={0} value={ajusteManual}
                                            onChange={(e) => setAjusteManual(e.target.value === "" ? "" : Number(e.target.value))}
                                            placeholder={`Sugerido: ${honorariosSugeridos.toFixed(2)}`}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-white font-bold focus:outline-none focus:border-cyan-500/70"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Cliente</label>
                                        <input
                                            type="text" value={clienteNombre}
                                            onChange={(e) => setClienteNombre(e.target.value)}
                                            placeholder="Juan García…"
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/70"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Expediente</label>
                                        <input
                                            type="text" value={expedienteRef}
                                            onChange={(e) => setExpedienteRef(e.target.value)}
                                            placeholder="#0001…"
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/70"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ---- Derecha: Resultado ---- */}
                    <div className="space-y-5">

                        {/* Desglose escala */}
                        {escala && typeof cuantia === "number" && cuantia > 0 && (
                            <div className="bg-slate-900 border border-blue-800/30 rounded-2xl p-5 shadow-sm animate-in fade-in">
                                <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                                    <Calculator className="w-4 h-4 text-blue-400" />Desglose Escala ICALI
                                </h2>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-xs text-slate-400 uppercase border-b border-slate-800">
                                            <th className="text-left pb-2">Tramo</th>
                                            <th className="text-center pb-2">%</th>
                                            <th className="text-right pb-2">Base</th>
                                            <th className="text-right pb-2">Honorarios</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        {escala.desglose.map((t, i) => (
                                            <tr key={i} className="text-slate-300">
                                                <td className="py-2 text-xs text-slate-400">{t.tramo}</td>
                                                <td className="py-2 text-center font-mono text-cyan-400">{t.porcentaje}%</td>
                                                <td className="py-2 text-right font-mono">{t.base.toLocaleString("es-ES")}€</td>
                                                <td className="py-2 text-right font-mono font-bold text-white">
                                                    {t.honorarios.toLocaleString("es-ES", { minimumFractionDigits: 2 })}€
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Resumen total + acciones */}
                        {concepto ? (
                            <div className="bg-gradient-to-br from-blue-950/50 to-cyan-950/30 border border-cyan-700/30 rounded-2xl p-5 shadow-xl shadow-cyan-900/10 animate-in fade-in">
                                <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-cyan-400" />Estimación Final
                                </h2>
                                <div className="space-y-2 mb-5">
                                    <div className="flex justify-between text-sm text-slate-400">
                                        <span>Honorarios base</span>
                                        <span className="font-mono text-white">{honorariosFinal.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-400">
                                        <span>IVA (21%)</span>
                                        <span className="font-mono text-white">{(honorariosFinal * 0.21).toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-black text-white border-t border-cyan-500/20 pt-3">
                                        <span>TOTAL</span>
                                        <span className="font-mono text-cyan-400">{importeConIVA.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {/* Guardar en Supabase */}
                                    <button
                                        onClick={handleGuardar}
                                        disabled={guardando}
                                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white px-4 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-emerald-600/20"
                                    >
                                        <Save className="w-4 h-4" />
                                        {guardando ? "Guardando…" : "Guardar Estrategia"}
                                    </button>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => handleEnviarFactura("provision")}
                                            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
                                        >
                                            <Receipt className="w-4 h-4" />Provisión
                                        </button>
                                        <button
                                            onClick={() => handleEnviarFactura("directa")}
                                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-blue-600/20"
                                        >
                                            <ChevronRight className="w-4 h-4" />Factura Directa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-10 text-center flex flex-col items-center gap-4">
                                <Scale className="w-12 h-12 text-slate-700" />
                                <p className="text-slate-400 text-sm max-w-xs">
                                    Selecciona un tipo de procedimiento del baremo ICALI para calcular honorarios.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ================================================================
          HOJA DE ENCARGO MODAL
      ================================================================ */}
            {mostrarHoja && concepto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl w-full max-w-2xl shadow-2xl shadow-cyan-900/20 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <FileSignature className="w-6 h-6 text-cyan-400" />
                            <h2 className="text-xl font-bold text-white">Hoja de Encargo Profesional</h2>
                        </div>
                        <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-6 mb-6">
                            <p className="text-sm text-cyan-100 leading-loose">
                                <span className="font-bold text-cyan-300">Despacho: </span>Nuria Arau Mediación y Abogacía.
                            </p>
                            <p className="text-sm text-cyan-200/90 leading-loose mt-4">
                                Los honorarios se presupuestan siguiendo los criterios orientativos del{" "}
                                <span className="font-bold text-white">ICALI (Colegio de Abogados de Illes Balears)</span>,
                                conforme al Reglamento de Honorarios Profesionales vigente, sin perjuicio de los acuerdos
                                de honorarios pactados previamente con el cliente.
                            </p>
                            <div className="mt-5 border-t border-cyan-500/20 pt-4 grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs text-cyan-400 mb-1 uppercase tracking-wider font-semibold">Procedimiento</p>
                                    <p className="text-white font-medium">{concepto.tipo}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-cyan-400 mb-1 uppercase tracking-wider font-semibold">Estimación</p>
                                    <p className="text-white font-mono font-bold text-lg">{honorariosFinal.toLocaleString("es-ES", { minimumFractionDigits: 2 })} € + IVA</p>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 italic mb-6">
                            Fecha: {new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setMostrarHoja(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors">
                                Cerrar
                            </button>
                            <button
                                onClick={() => { setMostrarHoja(false); alert("Generando PDF Hoja de Encargo…"); }}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-600/20"
                            >
                                Descargar PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {mostrarHoja && !concepto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center max-w-sm">
                        <Info className="w-10 h-10 text-amber-400 mx-auto mb-4" />
                        <p className="text-slate-300 mb-6">Selecciona un procedimiento para generar la Hoja de Encargo.</p>
                        <button onClick={() => setMostrarHoja(false)} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium">Entendido</button>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toastMsg && (
                <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right-8 fade-in duration-300">
                    <div className="bg-slate-900 border border-emerald-500/30 rounded-xl px-5 py-3.5 shadow-2xl text-sm font-semibold text-white">
                        {toastMsg}
                    </div>
                </div>
            )}
        </div>
    );
}
