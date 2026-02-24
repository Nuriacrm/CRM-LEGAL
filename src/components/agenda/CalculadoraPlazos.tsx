"use client";

import { useState } from "react";
import { Calendar, AlertCircle, Info, Calculator, CheckCircle2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function CalculadoraPlazos() {
    const [fechaInicio, setFechaInicio] = useState<string>('');
    const [diasPlazo, setDiasPlazo] = useState<number>(0);
    const [tipoDias, setTipoDias] = useState<'habiles' | 'naturales'>('habiles');
    const [excluirAgosto, setExcluirAgosto] = useState<boolean>(true);
    const [resultado, setResultado] = useState<{ fechaFinal: Date | null, esInhabil: boolean }>({ fechaFinal: null, esInhabil: false });

    // Función principal para calcular el plazo
    const calcularPlazo = () => {
        if (!fechaInicio || diasPlazo <= 0) return;

        // La fecha de inicio (notificación) no cuenta en el cómputo (Art. 133.1 LEC)
        // El cómputo comienza al día siguiente.
        let fechaActual = new Date(fechaInicio);
        // Ajuste de zona horaria básico (para evitar que las 00:00 UTC sea el día anterior localmente)
        // Ya que el input type="date" devuelve YYYY-MM-DD

        let diasContados = 0;

        while (diasContados < diasPlazo) {
            fechaActual.setDate(fechaActual.getDate() + 1);

            // Si es por días naturales, sumamos siempre
            if (tipoDias === 'naturales') {
                diasContados++;
                continue;
            }

            // Si es por días hábiles, comprobaciones:
            const diaSemana = fechaActual.getDay(); // 0 es Domingo, 6 es Sábado
            const esFinDeSemana = diaSemana === 0 || diaSemana === 6;
            const esAgosto = excluyeAgostoF(fechaActual);

            if (!esFinDeSemana && !esAgosto) {
                diasContados++;
            }
        }

        // Comprobar si el día de vencimiento resultante (solo en naturales) cae en inhábil
        // Art. 133.4 LEC: Si el último día es inhábil, se prorroga al primer día hábil siguiente.
        let esInhabilFinal = false;
        if (tipoDias === 'naturales') {
            let prorroga = false;
            while (
                fechaActual.getDay() === 0 ||
                fechaActual.getDay() === 6 ||
                (excluirAgosto && fechaActual.getMonth() === 7)
            ) {
                prorroga = true;
                fechaActual.setDate(fechaActual.getDate() + 1);
            }
            if (prorroga) esInhabilFinal = true;
        }

        setResultado({ fechaFinal: fechaActual, esInhabil: esInhabilFinal });
    };

    const excluyeAgostoF = (fecha: Date) => {
        return excluirAgosto && fecha.getMonth() === 7; // getMonth() 7 es Agosto
    };

    const formatearFecha = (fecha: Date | null) => {
        if (!fecha) return '';
        return fecha.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl max-w-3xl mx-auto w-full">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-800">
                <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                    <Calculator className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">Calculadora Procesal</h2>
                    <p className="text-slate-400 max-w-xl">Art. 130 a 135 Ley de Enjuiciamiento Civil (España).</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Lado del Formulario */}
                <div className="space-y-6 flex flex-col justify-center">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            Fecha de Notificación
                            <span title="El cómputo del plazo comenzará el día siguiente a esta fecha (Art. 133.1 LEC)." className="flex items-center cursor-help">
                                <Info className="w-4 h-4 text-emerald-400/70" />
                            </span>
                        </label>
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Días del Plazo</label>
                        <input
                            type="number"
                            min="1"
                            value={diasPlazo || ''}
                            onChange={(e) => setDiasPlazo(Number(e.target.value))}
                            placeholder="Ej. 20"
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-medium text-slate-300">Tipo de Cómputo</label>
                        <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
                            <button
                                onClick={() => setTipoDias('habiles')}
                                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tipoDias === 'habiles' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                            >
                                Días Hábiles
                            </button>
                            <button
                                onClick={() => setTipoDias('naturales')}
                                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tipoDias === 'naturales' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                            >
                                Días Naturales
                            </button>
                        </div>
                    </div>

                    {tipoDias === 'habiles' && (
                        <div className="flex items-center gap-3 bg-slate-800/30 p-4 rounded-xl border border-slate-800">
                            <input
                                type="checkbox"
                                id="excluirAgosto"
                                checked={excluirAgosto}
                                onChange={(e) => setExcluirAgosto(e.target.checked)}
                                className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500 bg-slate-700 border-slate-600"
                            />
                            <label htmlFor="excluirAgosto" className="text-sm text-slate-300 cursor-pointer select-none">
                                Excluir mes de Agosto (inhábil civil)
                            </label>
                        </div>
                    )}

                    <button
                        onClick={calcularPlazo}
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20 font-bold py-3.5 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Calendar className="w-5 h-5" />
                        Calcular Vencimiento
                    </button>
                </div>

                {/* Lado de Resultados */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden">
                    {/* Elemento de diseño de fondo */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                    {resultado.fechaFinal ? (
                        <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h3 className="text-emerald-400 font-semibold mb-2 uppercase tracking-wider text-sm">Fecha Límite</h3>
                                <div className="text-2xl md:text-3xl font-black text-white capitalize leading-tight">
                                    {formatearFecha(resultado.fechaFinal)}
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4 space-y-3">
                                <div className="flex gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-slate-300">
                                        Último día para presentar el escrito sin penalización ordinaria.
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div className="text-sm text-slate-300">
                                        <strong>Día de Gracia (Art. 135 LEC):</strong> Podrá presentar el escrito hasta las 15:00 horas del día hábil siguiente al vencimiento.
                                    </div>
                                </div>
                            </div>

                            {resultado.esInhabil && (
                                <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-200">
                                    <Info className="w-5 h-5 shrink-0" />
                                    <span className="text-sm">El último día caía en festivo o fin de semana. Se ha prorrogado automáticamente al próximo día hábil.</span>
                                </div>
                            )}

                            <button
                                onClick={async () => {
                                    if (!resultado.fechaFinal) return;
                                    const { error } = await supabase
                                        .from('citas')
                                        .insert([{
                                            asunto: `Vencimiento: ${diasPlazo} días (${tipoDias})`,
                                            fecha_hora: resultado.fechaFinal.toISOString(),
                                            tipo: 'vencimiento',
                                            es_critico: true
                                        }]);
                                    if (error) alert("Error al guardar: " + error.message);
                                    else alert("Vencimiento guardado en la agenda.");
                                }}
                                className="w-full mt-4 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Guardar en Agenda
                            </button>

                            <p className="text-xs text-slate-500 mt-4 italic">
                                *Nota: Esta herramienta no excluye fiestas locales o autonómicas específicas que deban incluirse manualmente.
                            </p>
                        </div>
                    ) : (
                        <div className="text-center text-slate-500 flex flex-col items-center justify-center space-y-4">
                            <Calculator className="w-16 h-16 text-slate-800" />
                            <p className="max-w-xs text-sm">Introduce una fecha y el plazo para obtener el cálculo exacto del vencimiento.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
