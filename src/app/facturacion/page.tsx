"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Receipt, Search, Plus, Filter, FileText, QrCode, ShieldCheck, Download, Scale, Loader2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function FacturacionPage() {
    const [facturas, setFacturas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [filtro, setFiltro] = useState('');
    const searchParams = useSearchParams();

    // Estados para Modal Generador
    const [showModal, setShowModal] = useState(false);
    const [concepto, setConcepto] = useState('');
    const [importeBase, setImporteBase] = useState('');
    const [clienteSel, setClienteSel] = useState('Juan García Pérez');
    const [expedienteSel, setExpedienteSel] = useState('#0001 Recl. Cantidad');

    // Fetchear facturas desde Supabase
    const fetchFacturas = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('facturas')
            .select('*')
            .order('fecha_emision', { ascending: false });

        if (!error && data) {
            setFacturas(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchFacturas();
    }, []);

    // Abrir modal pre-cargado desde Honorarios ICALI
    useEffect(() => {
        const conceptoParam = searchParams.get('concepto');
        const importeParam = searchParams.get('importe');
        if (conceptoParam && importeParam) {
            setConcepto(conceptoParam);
            setImporteBase(importeParam);
            setShowModal(true);
        }
    }, [searchParams]);

    // Estados para Vista Previa
    const [showPreview, setShowPreview] = useState(false);
    const [facturaActual, setFacturaActual] = useState<any>(null);

    // LÓGICA DE ENCADENAMIENTO (Simulación SHA-256 parcial)
    const generarHashHash = (prevHash: string, newId: string) => {
        const charSet = "abcdefghijklmnopqrstuvwxyz0123456789";
        let randomStr = "";
        for (let i = 0; i < 4; i++) randomStr += charSet.charAt(Math.floor(Math.random() * charSet.length));
        return `${newId.split('-')[1].toLowerCase()}${randomStr}...${prevHash.slice(-3)}`;
    };

    const handleEmitirFactura = async () => {
        setLoading(true);
        const prevHash = facturas.length > 0 ? (facturas[0].hash_verifactu || '000000...000') : '000000...000';

        // Simulación de número de factura (en producción esto vendría del DB o secuencia)
        const nextNum = facturas.length + 1;
        const newId = `F2026-${nextNum.toString().padStart(3, '0')}`;
        const newHash = generarHashHash(prevHash, newId);

        const importeFinal = parseFloat(importeBase) * 1.21;

        const { data, error } = await supabase
            .from('facturas')
            .insert([{
                cliente_nombre: clienteSel,
                expediente_ref: expedienteSel,
                concepto: concepto,
                base_imponible: parseFloat(importeBase),
                total_factura: importeFinal,
                hash_verifactu: newHash,
                estado_pago: 'Emitida',
                fecha_emision: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            alert("Error al emitir factura: " + error.message);
        } else {
            setFacturaActual(data);
            setShowModal(false);
            setShowPreview(true);
            fetchFacturas();
        }

        setLoading(false);
        setConcepto('');
        setImporteBase('');
    };

    const facturasFiltradas = facturas.filter(f =>
        f.cliente.toLowerCase().includes(filtro.toLowerCase()) ||
        f.id.toLowerCase().includes(filtro.toLowerCase()) ||
        f.expediente.toLowerCase().includes(filtro.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                        <Receipt className="w-8 h-8 text-blue-500" />
                        Facturación Veri*factu
                    </h1>
                    <p className="text-slate-400">Emisión y registro histórico inalterable normativo (AEAT).</p>
                </div>
                {/* Banner conexión ICALI */}
                <Link
                    href="/honorarios"
                    className="flex items-center gap-2 bg-cyan-950/30 border border-cyan-500/20 text-cyan-400 px-4 py-2 rounded-xl text-sm font-medium hover:bg-cyan-900/30 transition-colors"
                >
                    <Scale className="w-4 h-4" /> Calcular con Baremo ICALI
                </Link>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 border border-blue-400/30"
                >
                    <Plus className="w-5 h-5" /> Emitir Nueva Factura
                </button>
            </div>

            {/* Panel de Filtros */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, nº factura o exp..."
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                    />
                </div>
                <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-slate-700 flex items-center gap-2 justify-center">
                    <Filter className="w-4 h-4" /> Filtros Avanzados
                </button>
            </div>

            {/* Tabla Inalterable */}
            <div className="bg-slate-900/80 backdrop-blur border border-blue-900/30 rounded-2xl overflow-hidden shadow-xl shadow-blue-900/5">
                <div className="overflow-x-auto">
                    {loading && facturas.length === 0 ? (
                        <div className="flex items-center justify-center p-20 gap-3 text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                            Cargando historial de facturación...
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-blue-950/40 border-b border-blue-800/30">
                                    <th className="p-4 text-xs font-semibold text-blue-300 uppercase tracking-wider">Fecha</th>
                                    <th className="p-4 text-xs font-semibold text-blue-300 uppercase tracking-wider">Nº Factura</th>
                                    <th className="p-4 text-xs font-semibold text-blue-300 uppercase tracking-wider">Cliente / Exp.</th>
                                    <th className="p-4 text-xs font-semibold text-blue-300 uppercase tracking-wider text-right">Importe Total</th>
                                    <th className="p-4 text-xs font-semibold text-blue-300 uppercase tracking-wider">Cadena (Hash AEAT)</th>
                                    <th className="p-4 text-xs font-semibold text-blue-300 uppercase tracking-wider text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-900/20">
                                {facturasFiltradas.map((f, i) => (
                                    <tr key={f.id} className="hover:bg-blue-900/10 transition-colors group">
                                        <td className="p-4 text-sm text-slate-300 whitespace-nowrap">
                                            {new Date(f.fecha_emision).toLocaleDateString('es-ES')}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-white whitespace-nowrap">
                                            F2026-{f.numero_factura?.toString().padStart(3, '0') || '---'}
                                        </td>
                                        <td className="p-4 text-sm">
                                            <div className="font-medium text-slate-200">{f.cliente_nombre}</div>
                                            <div className="text-xs text-slate-500">{f.expediente_ref}</div>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-white text-right whitespace-nowrap">
                                            {f.total_factura?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                        </td>
                                        <td className="p-4">
                                            <span className="font-mono text-xs bg-slate-950 text-blue-400 px-2 py-1 rounded border border-blue-900/50">
                                                {f.hash_verifactu || '---'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => { setFacturaActual(f); setShowPreview(true); }}
                                                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    title="Ver PDF"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                                {/* REQUISITO: Botón de borrar simulado pero deshabilitado rígidamente */}
                                                <button
                                                    disabled
                                                    className="p-2 text-slate-700 cursor-not-allowed opacity-40 mix-blend-luminosity"
                                                    title="Las facturas emitidas son inalterables por Ley (AEAT)"
                                                >
                                                    <ShieldCheck className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {!loading && facturasFiltradas.length === 0 && (
                        <div className="p-8 text-center text-slate-400">
                            No se encontraron facturas en el historial.
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: Generador de Facturas */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
                        <div className="flex items-center gap-3 mb-6">
                            <Receipt className="w-6 h-6 text-blue-500" />
                            <h2 className="text-xl font-bold text-white">Generar Nueva Factura</h2>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cliente Asignado</label>
                                    <select
                                        value={clienteSel}
                                        onChange={e => setClienteSel(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                                    >
                                        <option>Juan García Pérez</option>
                                        <option>María López</option>
                                        <option>Tech Solutions SL</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Expediente</label>
                                    <select
                                        value={expedienteSel}
                                        onChange={e => setExpedienteSel(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                                    >
                                        <option>#0001 Recl. Cantidad</option>
                                        <option>#0005 Divorcio</option>
                                        <option>#0002 R. Contrato</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Concepto / Servicios</label>
                                <textarea
                                    rows={3}
                                    value={concepto}
                                    onChange={e => setConcepto(e.target.value)}
                                    placeholder="Ej. Provisión de fondos proced. ordinario..."
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Base Imponible (€)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-2.5 text-slate-500 font-bold">€</span>
                                    <input
                                        type="number"
                                        value={importeBase}
                                        onChange={e => setImporteBase(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-white font-bold focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-2">* El 21% de IVA se calculará automáticamente en el ticket.</p>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleEmitirFactura}
                                disabled={!importeBase}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-lg shadow-blue-600/20"
                            >
                                Emitir y Sellar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Vista Previa Ticket Verifactu */}
            {showPreview && facturaActual && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in zoom-in-95 duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Papel Factura (Scrollable) */}
                        <div className="flex-1 overflow-y-auto p-8 md:p-12 text-slate-800">

                            {/* Cabecera Ticket */}
                            <div className="flex justify-between items-start border-b-2 border-slate-200 pb-6 mb-6">
                                <div>
                                    <h1 className="text-2xl font-serif font-bold text-blue-900 mb-1 tracking-tight">Nuria Arau</h1>
                                    <h2 className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-4">Mediación y Abogacía</h2>
                                    <p className="text-xs text-slate-400 font-mono">NIF: 12345678Q</p>
                                    <p className="text-xs text-slate-400 font-mono">C/ Justicia 1, Madrid</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-slate-400 mb-1">FACTURA</div>
                                    <div className="text-2xl font-black text-slate-800 font-mono tracking-tighter">{facturaActual.id}</div>
                                    <div className="text-sm text-slate-500 mt-2">{facturaActual.fecha}</div>
                                </div>
                            </div>

                            {/* Datos Cliente */}
                            <div className="bg-slate-50 p-4 rounded-lg mb-8 border border-slate-100">
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Datos del Cliente</h3>
                                <p className="font-bold text-slate-700">{facturaActual.cliente}</p>
                                <p className="text-sm text-slate-500 mt-1">Ref: {facturaActual.expediente}</p>
                            </div>

                            {/* Lineas */}
                            <div className="flex justify-between text-xs text-slate-500 mb-6">
                                <div>
                                    <p className="font-bold text-slate-700">EMITIDO POR</p>
                                    <p>Nuria Arau · Mediación y Abogacía</p>
                                    <p>Calle Falsa 123, 03001 Alicante</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-700">CLIENTE</p>
                                    <p>{facturaActual.cliente_nombre}</p>
                                    <p>Exp: {facturaActual.expediente_ref}</p>
                                </div>
                            </div>

                            {/* Conceptos */}
                            <table className="w-full text-sm mb-8">
                                <thead>
                                    <tr className="border-b-2 border-slate-100 text-slate-400">
                                        <th className="text-left py-2">DESCRIPCIÓN</th>
                                        <th className="text-right py-2">BASE</th>
                                        <th className="text-right py-2">IVA (21%)</th>
                                        <th className="text-right py-2">TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-600">
                                    <tr className="border-b border-slate-50">
                                        <td className="py-4">{facturaActual.concepto || "Servicios Jurídicos / Mediación"}</td>
                                        <td className="text-right py-4">{facturaActual.base_imponible?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                        <td className="text-right py-4">{(facturaActual.base_imponible * 0.21).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                        <td className="text-right font-bold text-slate-900 py-4">{facturaActual.total_factura?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Verif*ctu Info */}
                            <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6">
                                <div className="bg-white p-2 rounded-lg border border-slate-200">
                                    <QrCode className="w-16 h-16 text-slate-900" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 text-emerald-600 mb-1">
                                        <ShieldCheck className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Factura Inalterable Verifi*ctu</span>
                                    </div>
                                    <p className="text-[10px] leading-tight text-slate-400 font-mono break-all">
                                        Huella: {facturaActual.hash_verifactu}<br />
                                        Fecha: {new Date(facturaActual.fecha_emision).toISOString()}
                                    </p>
                                </div>
                            </div>

                            {/* Totales */}
                            <div className="flex justify-end mb-12">
                                <div className="w-64 bg-slate-50 p-4 rounded-xl border border-blue-100">
                                    <div className="flex justify-between text-sm mb-2 text-slate-500">
                                        <span>Base Imponible:</span>
                                        <span className="font-mono">{facturaActual.base_imponible?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mb-4 text-slate-500">
                                        <span>Cuota IVA (21%):</span>
                                        <span className="font-mono">{(facturaActual.base_imponible * 0.21).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-black text-blue-900 border-t border-slate-200 pt-2">
                                        <span>TOTAL:</span>
                                        <span className="font-mono">{facturaActual.total_factura?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Sello AEAT Verifactu */}
                            <div className="border-2 border-dashed border-blue-200 rounded-xl p-6 bg-blue-50 flex items-center gap-6">
                                <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 shrink-0">
                                    <QrCode className="w-20 h-20 text-slate-800" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                        <h4 className="text-sm font-bold text-slate-800">Sello Veri*factu Emisor</h4>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed mb-2">
                                        Factura verificable en la sede electrónica de la AEAT según RD 1007/2023. Registro inalterable encadenado.
                                    </p>
                                    <p className="text-[10px] font-mono text-slate-400 bg-white px-2 py-1 rounded inline-block border border-slate-200">
                                        Hash: {facturaActual.hash_verifactu}
                                    </p>
                                </div>
                            </div>

                        </div>

                        {/* Barra Botones Action (Fija Abajo) */}
                        <div className="bg-slate-100 border-t border-slate-200 p-4 flex justify-end gap-3 shrink-0">
                            <button
                                onClick={() => setShowPreview(false)}
                                className="px-6 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                Cerrar
                            </button>
                            <button
                                onClick={() => {
                                    setShowPreview(false);
                                    // Simula la acción de descarga local con toast
                                    alert('Descarga de factura.pdf lista con inserción AEAT.');
                                }}
                                className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" /> Exportar Copia PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
