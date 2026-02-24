"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Users, UserPlus, Shield, ShieldOff, Mail,
    Loader2, AlertCircle, Check, X, Crown, User
} from "lucide-react";

type Miembro = {
    id: string;
    nombre: string;
    email: string;
    rol: "admin" | "staff";
    revocado: boolean;
    invitado_at: string;
};

const ROL_META = {
    admin: {
        label: "Admin",
        desc: "Acceso total: expedientes, clientes, agenda, facturación, borrado y gestión del equipo.",
        icon: Crown,
        chip: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
    staff: {
        label: "Staff",
        desc: "Gestión de expedientes y agenda. Sin permisos de borrado total ni acceso a facturación.",
        icon: User,
        chip: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    },
};

export default function EquipoPage() {
    const [equipo, setEquipo] = useState<Miembro[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Formulario de invitación
    const [email, setEmail] = useState("");
    const [nombre, setNombre] = useState("");
    const [rol, setRol] = useState<"admin" | "staff">("staff");
    const [invitando, setInvitando] = useState(false);
    const [inviteOk, setInviteOk] = useState<string | null>(null);
    const [inviteError, setInviteError] = useState<string | null>(null);

    // Revocación
    const [revocandoId, setRevocandoId] = useState<string | null>(null);
    const [confirmRevocar, setConfirmRevocar] = useState<string | null>(null);

    const fetchEquipo = useCallback(async () => {
        setCargando(true);
        const res = await fetch("/api/equipo/list");
        const json = await res.json();
        if (json.error) setError(json.error);
        else setEquipo(json.data ?? []);
        setCargando(false);
    }, []);

    useEffect(() => { fetchEquipo(); }, [fetchEquipo]);

    const handleInvitar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !nombre.trim()) return;
        setInvitando(true);
        setInviteOk(null);
        setInviteError(null);

        const res = await fetch("/api/equipo/invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), nombre: nombre.trim(), rol }),
        });
        const json = await res.json();
        setInvitando(false);

        if (json.error) {
            setInviteError(json.error);
        } else {
            setInviteOk(`✅ Invitación enviada a ${email.trim()}. Recibirá un email para acceder al CRM.`);
            setEmail(""); setNombre(""); setRol("staff");
            fetchEquipo();
        }
    };

    const handleRevocar = async (id: string) => {
        setRevocandoId(id);
        const res = await fetch(`/api/equipo/${id}`, { method: "PATCH" });
        const json = await res.json();
        setRevocandoId(null);
        setConfirmRevocar(null);
        if (json.error) setError(json.error);
        else fetchEquipo();
    };

    const activos = equipo.filter(m => !m.revocado);
    const revocados = equipo.filter(m => m.revocado);

    return (
        <div className="max-w-5xl mx-auto space-y-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Gestión del Equipo</h1>
                <p className="text-slate-400">Administra los usuarios del CRM, sus roles y permisos de acceso.</p>
            </div>

            {/* ── Tarjetas de roles ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(["admin", "staff"] as const).map(r => {
                    const meta = ROL_META[r];
                    const Icon = meta.icon;
                    return (
                        <div key={r} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                                <Icon className="w-5 h-5 text-slate-300" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${meta.chip}`}>{meta.label}</span>
                                </div>
                                <p className="text-slate-400 text-sm leading-relaxed">{meta.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Invitar nuevo miembro ─────────────────────────────────────── */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
                    <UserPlus className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-lg font-bold text-white">Invitar Nuevo Miembro</h2>
                </div>
                <form onSubmit={handleInvitar} className="p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Nombre completo</label>
                            <input
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                placeholder="Ej. María López"
                                required
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="correo@ejemplo.com"
                                    required
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Rol</label>
                            <select
                                value={rol}
                                onChange={e => setRol(e.target.value as "admin" | "staff")}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm cursor-pointer"
                            >
                                <option value="staff">Staff — Gestión básica</option>
                                <option value="admin">Admin — Acceso total</option>
                            </select>
                        </div>
                    </div>

                    {inviteOk && (
                        <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-xl px-4 py-3 text-sm">
                            <Check className="w-4 h-4 shrink-0" /> {inviteOk}
                        </div>
                    )}
                    {inviteError && (
                        <div className="flex items-center gap-2 bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" /> {inviteError}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={invitando}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                        >
                            {invitando
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando invitación…</>
                                : <><UserPlus className="w-4 h-4" /> Enviar Invitación</>}
                        </button>
                    </div>
                </form>
            </div>

            {error && (
                <div className="flex items-center gap-3 bg-red-950/30 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" /> {error}
                </div>
            )}

            {/* ── Lista de usuarios activos ─────────────────────────────────── */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-lg font-bold text-white">Usuarios Activos</h2>
                        <span className="bg-emerald-900/40 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                            {activos.length}
                        </span>
                    </div>
                    <button onClick={fetchEquipo} className="text-xs text-slate-500 hover:text-emerald-400 transition-colors">
                        Actualizar
                    </button>
                </div>

                {cargando ? (
                    <div className="flex items-center justify-center gap-3 py-12 text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin text-emerald-500" /> Cargando equipo…
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-800">
                        {activos.length === 0 && (
                            <li className="py-10 text-center text-slate-500 text-sm">No hay usuarios activos.</li>
                        )}
                        {activos.map(m => {
                            const meta = ROL_META[m.rol] ?? ROL_META.staff;
                            const Icon = meta.icon;
                            const isConfirming = confirmRevocar === m.id;
                            return (
                                <li key={m.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/30 transition-colors group">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                                        <Icon className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-white font-semibold truncate">{m.nombre}</span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${meta.chip}`}>
                                                {meta.label}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 text-sm mt-0.5 truncate">{m.email}</p>
                                        <p className="text-slate-600 text-xs mt-0.5">
                                            Invitado el {new Date(m.invitado_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>

                                    {/* Botón revocar */}
                                    {isConfirming ? (
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-xs text-red-300 hidden sm:block">¿Revocar acceso?</span>
                                            <button
                                                onClick={() => handleRevocar(m.id)}
                                                disabled={revocandoId === m.id}
                                                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                                            >
                                                {revocandoId === m.id
                                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    : <ShieldOff className="w-3.5 h-3.5" />}
                                                Sí, revocar
                                            </button>
                                            <button
                                                onClick={() => setConfirmRevocar(null)}
                                                className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmRevocar(m.id)}
                                            title="Revocar acceso"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium shrink-0"
                                        >
                                            <ShieldOff className="w-3.5 h-3.5" />
                                            Revocar
                                        </button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* ── Usuarios revocados (colapsados) ──────────────────────────── */}
            {revocados.length > 0 && (
                <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden opacity-60">
                    <div className="px-6 py-4 flex items-center gap-3">
                        <Shield className="w-4 h-4 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-500">Accesos revocados ({revocados.length})</h3>
                    </div>
                    <ul className="divide-y divide-slate-800/30">
                        {revocados.map(m => (
                            <li key={m.id} className="flex items-center gap-4 px-6 py-3">
                                <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center">
                                    <User className="w-4 h-4 text-slate-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-slate-500 text-sm line-through">{m.nombre}</p>
                                    <p className="text-slate-600 text-xs">{m.email}</p>
                                </div>
                                <span className="text-xs text-slate-600 bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-700/30">
                                    Revocado
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
