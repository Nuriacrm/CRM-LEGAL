"use client";

import { useState, useEffect, useRef } from "react";
import { Scale, Users, FileText, CalendarClock, Play, Square, FileSignature, CheckCircle2, AlertCircle, Plus, Info } from "lucide-react";

export function ModuloMediacion({ expedienteId }: { expedienteId: string }) {
    // ---- ESTADO DEL MÓDULO ----
    const [estado, setEstado] = useState('Sesiones en Curso');
    const [cuantia, setCuantia] = useState(15000);

    // Sesiones
    const [sesiones, setSesiones] = useState([
        { id: 2, num: 2, titulo: 'Acuerdos de Custodia', fecha: '2026-02-15T10:00', notas: 'Las partes acercan posturas sobre los fines de semana.', duracion: '01:15:00', completada: true },
        { id: 1, num: 1, titulo: 'Sesión Informativa', fecha: '2026-02-01T11:30', notas: 'Explicación del proceso y firma de confidencialidad.', duracion: '00:45:00', completada: true },
    ]);

    // Cronómetro en vivo
    const [sesionActiva, setSesionActiva] = useState(false);
    const [tiempo, setTiempo] = useState(0); // Segundos
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Notas de la sesión actual
    const [notasActuales, setNotasActuales] = useState('');
    const [fechaSiguiente, setFechaSiguiente] = useState('');

    // Modal / Generador de Actas
    const [actaGenerada, setActaGenerada] = useState<string | null>(null);

    // ---- FUNCIONES DE CRONÓMETRO ----
    const startCronometro = () => {
        setSesionActiva(true);
        intervalRef.current = setInterval(() => {
            setTiempo(prev => prev + 1);
        }, 1000);
    };

    const stopCronometro = () => {
        setSesionActiva(false);
        if (intervalRef.current) clearInterval(intervalRef.current);

        // Finalizar sesión y guardarla en el libro
        const nuevaSesion = {
            id: Date.now(),
            num: sesiones.length + 1,
            titulo: `Sesión de Seguimiento`,
            fecha: new Date().toISOString().slice(0, 16),
            notas: notasActuales || 'Sin notas.',
            duracion: formatTime(tiempo),
            completada: true
        };

        setSesiones(prev => [nuevaSesion, ...prev]);
        setTiempo(0);
        setNotasActuales('');
    };

    const formatTime = (segundosTotales: number) => {
        const h = Math.floor(segundosTotales / 3600).toString().padStart(2, '0');
        const m = Math.floor((segundosTotales % 3600) / 60).toString().padStart(2, '0');
        const s = (segundosTotales % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    // ---- GENERADOR DE ACTAS ----
    const generarActa = () => {
        setActaGenerada(null); // Reset
        setTimeout(() => {
            const fechaHoy = new Date().toLocaleDateString('es-ES');
            const draft = `
ACTA DE SESIÓN DE MEDIACIÓN

En la ciudad, a ${fechaHoy}.

REUNIDOS:
De una parte, como Solicitante: Juan García Pérez, asistido por su letrado.
De otra parte, como Invitada: María López Martínez, asistida por su letrado.
Y la Mediadora designada: Elena Torres.

EXPONEN:
Que en el marco del proceso de mediación (Expediente ${expedienteId || '000'}), las partes han celebrado una nueva sesión en la que se han tratado las controversias objeto de mediación.

ACUERDOS PENDIENTES:
(${notasActuales ? notasActuales : '[Insertar puntos discutidos y próximos pasos...]'})

PRÓXIMA SESIÓN:
Fijada para el: ${fechaSiguiente ? new Date(fechaSiguiente).toLocaleDateString('es-ES') : '[Pendiente de fijar]'}

Y en prueba de conformidad, leen y oyen el presente documento, que firman.
            `;
            setActaGenerada(draft);
        }, 600);
    };


    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* PANEL DE CONTROL (KPIs) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-colors rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Scale className="w-16 h-16 text-cyan-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-400 mb-1">Estado de Mediación</p>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse"></div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">{estado}</h3>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-colors rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CalendarClock className="w-16 h-16 text-cyan-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-400 mb-1">Sesiones Realizadas</p>
                    <h3 className="text-3xl font-bold text-cyan-400 tracking-tight">{sesiones.length}</h3>
                </div>

                <div className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-colors rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertCircle className="w-16 h-16 text-cyan-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-400 mb-1">Cuantía en Disputa</p>
                    <h3 className="text-3xl font-bold text-white tracking-tight">
                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cuantia)}
                    </h3>
                </div>
            </div>

            {/* GESTIÓN DE PARTES */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2 mb-6">
                    <Users className="w-5 h-5" />
                    Partes y Letrados
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Solicitante */}
                    <div className="p-5 bg-slate-800/50 rounded-xl border border-slate-700/50 relative">
                        <div className="absolute top-0 right-0 h-full w-1 bg-blue-500 rounded-r-xl"></div>
                        <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">Parte Solicitante</p>
                        <p className="text-lg text-slate-200 font-medium mb-1">Juan García Pérez</p>
                        <p className="text-sm text-slate-500 mb-4">DNI: 12345678A</p>
                        <div className="pt-3 border-t border-slate-700/50">
                            <p className="text-xs text-slate-400 mb-1">Abogado representante:</p>
                            <p className="text-sm text-slate-300 font-medium">Pedro Sánchez (Col. 1234)</p>
                        </div>
                    </div>

                    {/* Invitada */}
                    <div className="p-5 bg-slate-800/50 rounded-xl border border-slate-700/50 relative">
                        <div className="absolute top-0 right-0 h-full w-1 bg-amber-500 rounded-r-xl"></div>
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-2">Parte Invitada</p>
                        <p className="text-lg text-slate-200 font-medium mb-1">María López Martínez</p>
                        <p className="text-sm text-slate-500 mb-4">DNI: 87654321B</p>
                        <div className="pt-3 border-t border-slate-700/50">
                            <p className="text-xs text-slate-400 mb-1">Abogado representante:</p>
                            <p className="text-sm text-slate-300 font-medium">Laura Gómez (Col. 9876)</p>
                        </div>
                    </div>

                    {/* Mediador */}
                    <div className="p-5 bg-cyan-950/20 rounded-xl border border-cyan-500/30 relative shadow-[inset_0_0_20px_rgba(34,211,238,0.05)]">
                        <div className="absolute top-0 right-0 h-full w-1 bg-cyan-500 rounded-r-xl"></div>
                        <p className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-1.5"><Scale className="w-3.5 h-3.5" /> Mediador Designado</p>
                        <p className="text-lg text-white font-medium mb-1">Elena Torres</p>
                        <p className="text-sm text-cyan-200/50 mb-4">Núm. Registro: 554433</p>
                        <div className="pt-3 border-t border-cyan-500/20">
                            <p className="text-xs text-cyan-200/70 mb-1">Tipo de Mediación:</p>
                            <p className="text-sm text-cyan-100 font-medium">Civil y Mercantil</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LIBRO DE SESIONES */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800/50">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-cyan-400" />
                                Libro de Sesiones
                            </h3>
                        </div>

                        {/* Nueva Sesión Rápida (Live Session) */}
                        <div className={`p-5 rounded-xl border transition-all duration-300 mb-8 ${sesionActiva ? 'bg-slate-800/80 border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.15)]' : 'bg-slate-800/30 border-slate-700/50'}`}>
                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                                <div>
                                    <h4 className="text-md font-bold text-white mb-1">
                                        {sesionActiva ? '🔴 Sesión en Vivo' : 'Nueva Sesión (Notas Rápidas)'}
                                    </h4>
                                    <p className="text-xs text-slate-400">Registra el progreso y acuerdos inmediatamente.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className={`font-mono text-xl font-bold tracking-wider w-24 text-center select-none ${sesionActiva ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-slate-500'}`}>
                                        {formatTime(tiempo)}
                                    </div>
                                    {!sesionActiva ? (
                                        <button onClick={startCronometro} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-cyan-600/20 flex items-center gap-2">
                                            <Play className="w-4 h-4 fill-white" /> Iniciar
                                        </button>
                                    ) : (
                                        <button onClick={stopCronometro} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-rose-600/20 flex items-center gap-2">
                                            <Square className="w-4 h-4 fill-white" /> Finalizar y Guardar
                                        </button>
                                    )}
                                </div>
                            </div>

                            <textarea
                                value={notasActuales}
                                onChange={(e) => setNotasActuales(e.target.value)}
                                placeholder="Escribe aquí las conclusiones, puntos bloqueados, o acuerdos de esta sesión..."
                                className="w-full bg-slate-900 border border-slate-700/50 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors min-h-[100px] text-sm resize-y"
                                disabled={!sesionActiva && !notasActuales} // Block if not typing or not active to encourage pressing "IniciaR"
                            />

                            <div className="mt-4 flex flex-col md:flex-row md:items-center gap-4">
                                <label className="text-xs font-medium text-slate-400">Fecha Próxima Sesión:</label>
                                <input
                                    type="datetime-local"
                                    value={fechaSiguiente}
                                    onChange={(e) => setFechaSiguiente(e.target.value)}
                                    className="bg-slate-900 border border-slate-700/50 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-cyan-500 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Timeline histórico */}
                        <div className="space-y-6">
                            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Histórico de Sesiones</h4>
                            <div className="pl-4 border-l-2 border-slate-800 space-y-8">
                                {sesiones.map((sesion, idx) => (
                                    <div key={sesion.id} className="relative animate-in slide-in-from-left-4 fade-in duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                        <div className="absolute -left-[21px] top-1.5 w-3 h-3 bg-slate-900 border-2 border-cyan-500 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.6)]"></div>
                                        <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4 ml-4 group hover:border-cyan-500/30 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <h5 className="text-sm font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">
                                                    #{sesion.num} - {sesion.titulo}
                                                </h5>
                                                <span className="text-xs font-medium bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">
                                                    {sesion.duracion}
                                                </span>
                                            </div>
                                            <p className="text-xs text-cyan-200/50 mb-3">{new Date(sesion.fecha).toLocaleString('es-ES')}</p>
                                            <p className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800 italic">
                                                "{sesion.notas}"
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* GENERADOR DE ACTAS */}
                <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm sticky top-24">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                                <FileSignature className="w-6 h-6 text-cyan-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Generador de Actas</h3>
                                <p className="text-xs text-slate-400">Plantillas automáticas</p>
                            </div>
                        </div>

                        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                            El sistema utilizará los datos de este expediente y las notas de la última sesión para redactar un borrador de acta.
                        </p>

                        <button
                            onClick={generarActa}
                            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-medium py-3 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 group mb-6"
                        >
                            <FileText className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                            Generar Borrador de Acta
                        </button>

                        {/* Vista Previa del Acta Generada */}
                        {actaGenerada && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Acta Lista</span>
                                </div>
                                <div className="bg-slate-950 border border-slate-700 rounded-xl p-4 relative font-serif text-sm text-slate-300 h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                                    {actaGenerada}
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <button className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                                        Descargar PDF
                                    </button>
                                    <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-sm font-medium transition-colors">
                                        Editar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
