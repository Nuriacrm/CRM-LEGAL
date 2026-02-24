"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CalendarClock, Info, ShieldAlert } from "lucide-react";

type TipoProcedimiento = 'Judicial' | 'Mediación' | 'Extrajudicial';
type TipoComputo = 'habiles' | 'naturales';

export function CalculadoraExpediente({ defaultTipoProceso }: { defaultTipoProceso?: TipoProcedimiento }) {
    const [tipoProceso, setTipoProceso] = useState<TipoProcedimiento>(defaultTipoProceso || 'Judicial');
    const [fechaInicio, setFechaInicio] = useState<string>('');
    const [diasPlazo, setDiasPlazo] = useState<number | ''>('');
    const [tipoDias, setTipoDias] = useState<TipoComputo>('habiles');
    const [resultado, setResultado] = useState<{
        fechaFinal: Date | null,
        diasRestantes: number | null,
        esInhabil: boolean,
        fechaGracia: Date | null
    }>({
        fechaFinal: null, // Vencimiento principal
        diasRestantes: null,
        esInhabil: false,
        fechaGracia: null // Día de gracia (solo Judicial)
    });

    const [excluirAgosto, setExcluirAgosto] = useState<boolean>(true);

    const selectoresDias = [3, 5, 10, 20];

    // Actualizar si cambia la prop
    useEffect(() => {
        if (defaultTipoProceso) {
            setTipoProceso(defaultTipoProceso);
        }
    }, [defaultTipoProceso]);

    // Forzar "hábiles" si es Judicial
    useEffect(() => {
        if (tipoProceso === 'Judicial') {
            setTipoDias('habiles');
        }
    }, [tipoProceso]);

    const esInhabilF = (fecha: Date) => {
        const h = fecha.getDay();
        return h === 0 || h === 6 || (excluirAgosto && fecha.getMonth() === 7);
    };

    const calcular = () => {
        if (!fechaInicio || typeof diasPlazo !== 'number' || diasPlazo <= 0) {
            setResultado({ fechaFinal: null, diasRestantes: null, esInhabil: false, fechaGracia: null });
            return;
        }

        let fechaActual = new Date(fechaInicio);
        // Resetear hora para cálculos precisos de días enteros
        fechaActual.setHours(0, 0, 0, 0);
        let diasContados = 0;

        while (diasContados < diasPlazo) {
            fechaActual.setDate(fechaActual.getDate() + 1);
            if (tipoDias === 'naturales') {
                diasContados++;
            } else {
                if (!esInhabilF(fechaActual)) {
                    diasContados++;
                }
            }
        }

        let esInhabilFinal = false;
        // Si cae en inhábil (incluso siendo naturales, a veces se prorroga, asumiendo LEC general)
        let prorroga = false;
        while (esInhabilF(fechaActual)) {
            prorroga = true;
            fechaActual.setDate(fechaActual.getDate() + 1);
        }
        if (prorroga) esInhabilFinal = true;

        // Calcular día de gracia (el siguiente día hábil) solo si es Judicial
        let fGracia: Date | null = null;
        if (tipoProceso === 'Judicial') {
            fGracia = new Date(fechaActual);
            do {
                fGracia.setDate(fGracia.getDate() + 1);
            } while (esInhabilF(fGracia));
        }

        // Calcular días restantes reales (desde hoy)
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const refHoy = fGracia && tipoProceso === 'Judicial' ? fGracia : fechaActual;

        let msecDiff = refHoy.getTime() - hoy.getTime();
        // Sumamos en teoria las 15h del fGracia si fuera judicial
        if (tipoProceso === 'Judicial' && fGracia) {
            const h15 = new Date(fGracia);
            h15.setHours(15, 0, 0, 0);
            msecDiff = h15.getTime() - new Date().getTime(); // diff exacto en ms
        }

        const diffHoras = msecDiff / (1000 * 3600);

        setResultado({
            fechaFinal: fechaActual,
            diasRestantes: diffHoras / 24, // Guardo como días (puede tener decimales por las horas)
            esInhabil: esInhabilFinal,
            fechaGracia: fGracia
        });
    };

    // Auto-calcular cuando cambian dependencias
    useEffect(() => {
        calcular();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fechaInicio, diasPlazo, tipoProceso, tipoDias, excluirAgosto]);

    const formatShort = (d: Date) => d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

    let glowClass = "";
    if (resultado.diasRestantes !== null) {
        if (resultado.diasRestantes <= 2 && resultado.diasRestantes >= 0) {
            // Neon Rojo (menos de 48h o justo en tiempo crítico)
            glowClass = "shadow-[0_0_25px_rgba(239,68,68,0.7)] border-red-500 bg-red-950/20";
        } else if (resultado.diasRestantes > 2) {
            // Neon Verde (vigente con margen)
            glowClass = "shadow-[0_0_20px_rgba(16,185,129,0.4)] border-emerald-500/50 hover:border-emerald-500 bg-emerald-950/10";
        } else {
            // Vencido
            glowClass = "border-slate-800 bg-slate-900/50 opacity-80 grayscale";
        }
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col h-full">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-800/50 pb-4">
                <CalendarClock className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Configuración de Plazos</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Controles de Entrada */}
                <div className="space-y-6">
                    <div>
                        <label className="text-sm font-medium text-slate-400 block mb-2">Ámbito del Procedimiento</label>
                        <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
                            {['Judicial', 'Mediación', 'Extrajudicial'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTipoProceso(t as TipoProcedimiento)}
                                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${tipoProceso === t ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-400 block mb-2">Fecha de Notificación</label>
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-400 flex justify-between items-center mb-2">
                            <span>Días de Plazo</span>
                            <div className="space-x-1">
                                {selectoresDias.map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setDiasPlazo(d)}
                                        className={`px-2 py-0.5 rounded text-xs transition-colors ${diasPlazo === d ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                    >
                                        {d}d
                                    </button>
                                ))}
                            </div>
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={diasPlazo}
                            onChange={(e) => setDiasPlazo(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="Ej. 10"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                        />
                    </div>

                    {tipoProceso !== 'Judicial' && (
                        <div>
                            <label className="text-sm font-medium text-slate-400 block mb-2">Tipo de Cómputo</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={tipoDias === 'habiles'} onChange={() => setTipoDias('habiles')} className="text-emerald-500 focus:ring-emerald-500 bg-slate-800 border-slate-700" />
                                    <span className="text-sm text-slate-300">Hábiles</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={tipoDias === 'naturales'} onChange={() => setTipoDias('naturales')} className="text-emerald-500 focus:ring-emerald-500 bg-slate-800 border-slate-700" />
                                    <span className="text-sm text-slate-300">Naturales</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {tipoProceso === 'Judicial' && (
                        <div className="text-xs text-amber-500/80 bg-amber-500/10 p-2 rounded-lg flex gap-2">
                            <Info className="w-4 h-4 shrink-0" />
                            Al ser Judicial, se fuerza cómputo de días hábiles excluyendo sábados, domingos y el mes de agosto. Las fiestas locales han de ajustarse manualmente.
                        </div>
                    )}
                </div>

                {/* Mostrar Resultados */}
                <div className="h-full flex flex-col justify-center">
                    {resultado.fechaFinal ? (
                        <div className={`p-6 rounded-2xl transition-all duration-500 ${glowClass} relative`}>
                            {resultado.diasRestantes !== null && resultado.diasRestantes <= 2 && resultado.diasRestantes >= 0 && (
                                <div className="absolute top-4 right-4 animate-pulse">
                                    <ShieldAlert className="w-6 h-6 text-red-500" />
                                </div>
                            )}

                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Vencimiento Ordinario</h4>
                            <div className="text-2xl font-black text-white mb-4">
                                {formatShort(resultado.fechaFinal)}
                            </div>

                            {tipoProceso === 'Judicial' && resultado.fechaGracia && (
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1 flex items-center gap-1.5">
                                        <AlertCircle className="w-3.5 h-3.5" /> Día de Gracia (Art. 135 LEC)
                                    </h4>
                                    <div className="text-lg font-bold text-white mb-1">
                                        {formatShort(resultado.fechaGracia)}
                                    </div>
                                    <p className="text-sm text-slate-300 font-medium">
                                        Límite: <span className="text-emerald-400">15:00 h</span>
                                    </p>
                                </div>
                            )}

                            {resultado.diasRestantes !== null ? (
                                <div className="mt-6 text-sm">
                                    {resultado.diasRestantes < 0 ? (
                                        <span className="text-red-400 font-semibold border border-red-500/30 px-3 py-1 bg-red-500/10 rounded-full">Plazo Vencido</span>
                                    ) : (
                                        <span className={`font-semibold px-3 py-1 rounded-full border ${resultado.diasRestantes <= 2 ? 'text-red-200 bg-red-500/40 border-red-400/50' : 'text-emerald-200 bg-emerald-500/20 border-emerald-500/30'}`}>
                                            Faltan {Math.ceil(resultado.diasRestantes)} días (~{Math.ceil(resultado.diasRestantes * 24)}h)
                                        </span>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-slate-800/30 border border-slate-800 border-dashed rounded-2xl">
                            <CalendarClock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <p className="text-sm text-slate-400">Selecciona la <strong className="text-slate-300">fecha de notificación</strong> y el <strong className="text-slate-300">plazo</strong> para ver el vencimiento con alertas visuales integradas.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
