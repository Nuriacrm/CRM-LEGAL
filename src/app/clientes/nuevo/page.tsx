"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, UserPlus, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NuevoCliente() {
    const router = useRouter();

    // Sólo 'nombre' es obligatorio. Resto puede quedar vacío.
    const [formData, setFormData] = useState({
        nombre: '',
        apellidos: '',
        dni: '',         // → dni_nie en Supabase
        direccion: '',   // → calle en Supabase
        telefono: '',
        email: ''
    });

    const [guardando, setGuardando] = useState(false);
    const [toast, setToast] = useState<{ tipo: 'ok' | 'error'; msg: string } | null>(null);

    const mostrarToast = (tipo: 'ok' | 'error', msg: string) => {
        setToast({ tipo, msg });
        setTimeout(() => setToast(null), 4000);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGuardarCliente = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validación mínima: sólo nombre es obligatorio
        if (!formData.nombre.trim()) {
            mostrarToast('error', 'El campo "Nombre" es obligatorio.');
            return;
        }

        setGuardando(true);


        // Construir el payload — campos vacíos se envían como null
        const payload: Record<string, string | null> = {
            nombre: formData.nombre.trim(),
            apellidos: formData.apellidos.trim() || null,
            dni_nie: formData.dni.trim() || null,
            calle: formData.direccion.trim() || null,
            telefono: formData.telefono.trim() || null,
            email: formData.email.trim() || null,
        };

        const { error } = await supabase
            .from('clientes')
            .insert([payload]);

        setGuardando(false);

        if (error) {
            // Loguear todos los detalles del error para diagnóstico
            console.error('[NuevoCliente] Error Supabase:', {
                message: error.message,
                code: (error as any).code,
                details: (error as any).details,
                hint: (error as any).hint,
            });
            const mensajeVisible = error.message
                || (error as any).details
                || 'Error desconocido al guardar en la base de datos.';
            mostrarToast('error', mensajeVisible);
            return;
        }

        // Limpiar formulario
        setFormData({ nombre: '', apellidos: '', dni: '', direccion: '', telefono: '', email: '' });

        mostrarToast('ok', 'Cliente guardado con éxito');

        // Redirigir tras breve pausa para que el usuario vea el toast
        setTimeout(() => router.push('/clientes'), 1500);
    };

    return (
        <div className="max-w-4xl mx-auto pb-12">
            {/* Header */}
            <div className="mb-8">
                <Link href="/clientes" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4" />
                    Cancelar y volver
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Nuevo Cliente</h1>
                    <p className="text-slate-400">Añade los datos personales y de contacto al directorio.</p>
                </div>
            </div>

            {/* Formulario */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                <form onSubmit={handleGuardarCliente} className="p-8 space-y-8">

                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-4">
                        <UserPlus className="w-5 h-5 text-emerald-500" />
                        Información de Contacto
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nombre — único campo obligatorio */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Nombre <span className="text-red-400">*</span>
                            </label>
                            <input
                                required
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleInputChange}
                                placeholder="Ej. María"
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                            />
                        </div>

                        {/* Apellidos — opcional */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Apellidos</label>
                            <input
                                type="text"
                                name="apellidos"
                                value={formData.apellidos}
                                onChange={handleInputChange}
                                placeholder="Ej. López García (opcional)"
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">DNI / NIE / CIF</label>
                            <input
                                type="text"
                                name="dni"
                                value={formData.dni}
                                onChange={handleInputChange}
                                placeholder="Ej. 12345678Z"
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Teléfono</label>
                            <input
                                type="text"
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleInputChange}
                                placeholder="Ej. 600 123 456"
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-300">Correo Electrónico</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Ej. cliente@ejemplo.com"
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-300">Dirección Completa</label>
                            <input
                                type="text"
                                name="direccion"
                                value={formData.direccion}
                                onChange={handleInputChange}
                                placeholder="Ej. Calle Principal 123, 1ºA, Madrid"
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-800">
                        <button
                            type="submit"
                            disabled={guardando}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${guardando
                                ? 'bg-emerald-600/50 text-emerald-200 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                }`}
                        >
                            <Save className="w-5 h-5" />
                            {guardando ? 'Guardando en Supabase…' : 'Crear Registro de Cliente'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Toast de feedback */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right-8 fade-in duration-300">
                    <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-semibold text-white ${toast.tipo === 'ok'
                        ? 'bg-slate-900 border-emerald-500/40 shadow-emerald-500/10'
                        : 'bg-slate-900 border-red-500/40 shadow-red-500/10'
                        }`}>
                        {toast.tipo === 'ok'
                            ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                            : <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                        }
                        {toast.msg}
                    </div>
                </div>
            )}
        </div>
    );
}
