"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
    ArrowLeft, Save, UploadCloud, File, Trash2, Download,
    Edit2, ShieldAlert, ShieldCheck, FileSignature,
    DownloadCloud, AlertTriangle, Loader2, PenLine, Send, Copy, ExternalLink, CheckCheck,
    BookOpen, Wand2, Printer, X as XIcon
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Tabs } from "@/components/ui/Tabs";
import FirmaCanvas from "@/components/ui/FirmaCanvas";

// ---------------------------------------------------------------------------
export default function ClienteDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id: clienteId } = use(params);

    // ---- Datos del cliente desde Supabase ----
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        nombre: '',
        apellidos: '',
        dni: '',
        direccion: '',
        telefono: '',
        email: ''
    });

    const [guardando, setGuardando] = useState(false);
    const [mensajeGuardado, setMensajeGuardado] = useState('');

    // ---- RGPD ----
    const [rgpdAceptado, setRgpdAceptado] = useState(false);
    const [rgpdFirmaUrl, setRgpdFirmaUrl] = useState<string | null>(null);
    const [generandoPdf, setGenerandoPdf] = useState(false);
    const [metodoFirma, setMetodoFirma] = useState('Firma_Documento_Digital');
    const [toastMensaje, setToastMensaje] = useState<{ titulo: string; descripcion: string; tipo: 'success' | 'info' } | null>(null);

    // ---- Firma ----
    const [firmaVisible, setFirmaVisible] = useState(false);
    const [firmaContexto, setFirmaContexto] = useState<'rgpd' | string>('rgpd');
    const [docFirmados, setDocFirmados] = useState<Record<string, boolean>>({});

    // ---- Firma Remota ----
    type SolicitudFirma = {
        id: string; token: string; titulo_documento: string;
        estado: 'pendiente' | 'firmado' | 'expirado';
        created_at: string; firmado_at: string | null; firma_url: string | null;
    };
    const [solicitudesFirma, setSolicitudesFirma] = useState<SolicitudFirma[]>([]);
    const [modalEnvioVisible, setModalEnvioVisible] = useState(false);
    const [enlaceCopado, setEnlaceCopado] = useState<string | null>(null);
    const [tituloDoc, setTituloDoc] = useState('Consentimiento RGPD');
    const [contenidoDoc, setContenidoDoc] = useState('');
    const [generandoEnlace, setGenerandoEnlace] = useState(false);

    // ---- Documentos ----
    const [documentos, setDocumentos] = useState([
        { id: '1', name: 'DNI_Escaneado.pdf', type: 'application/pdf', size: '1.2 MB', date: '21/02/2026', category: 'Identificación' },
        { id: '2', name: 'Contrato_Servicios.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: '542 KB', date: '19/02/2026', category: 'Contratos' },
    ]);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [filtroCategoria, setFiltroCategoria] = useState('Todos');
    const categorias = ['Todos', 'Identificación', 'Contratos', 'Financiero', 'Otros'];


    // ---- Plantillas ----
    type PlantillaItem = { id: string; titulo: string; categoria: string; contenido: string; variables: string[] };
    const [modalPlantillas, setModalPlantillas] = useState(false);
    const [plantillasList, setPlantillasList] = useState<PlantillaItem[]>([]);
    const [plantillaActiva, setPlantillaActiva] = useState<PlantillaItem | null>(null);
    const [varsPlantilla, setVarsPlantilla] = useState<Record<string, string>>({});

    const LABELS_PLANT: Record<string, string> = {
        nombre: "Nombre", apellidos: "Apellidos", dni: "DNI/NIE",
        telefono: "Teléfono", email: "Email", direccion: "Dirección",
        fecha: "Fecha", ciudad: "Ciudad",
        destinatario: "Destinatario (parte contraria)",
        direccion_destinatario: "Dirección destinatario",
        domicilio_destinatario: "Domicilio destinatario",
        abogado_contrario: "Abogado contrario",
        cantidad: "Cantidad (€)", plazo_dias: "Plazo (días hábiles)",
        descripcion_hechos: "Descripción de los hechos",
        texto_requerimiento: "Texto del requerimiento",
        objeto_encargo: "Objeto del encargo", honorarios: "Honorarios",
        forma_pago: "Forma de pago", importe_total: "Importe total",
        servicios: "Servicios contratados",
    };
    const VARS_TEXTO = ["descripcion_hechos", "texto_requerimiento", "objeto_encargo", "servicios", "contenido"];
    const VARS_CLIENTE = ["nombre", "apellidos", "dni", "telefono", "email", "direccion"];

    const detectarVars = (texto: string) => [...new Set([...texto.matchAll(/{{(\w+)}}/g)].map(m => m[1]))];
    const rellenarPlantilla = (texto: string, vars: Record<string, string>) => {
        let r = texto;
        for (const [k, v] of Object.entries(vars)) r = r.replace(new RegExp(`{{${k}}}`, "g"), v || `{{${k}}}`);
        return r;
    };

    const abrirModalPlantillas = async () => {
        if (plantillasList.length === 0) {
            const { data } = await supabase.from("plantillas_documentos").select("id,titulo,categoria,contenido,variables").order("titulo");
            setPlantillasList(data ?? []);
        }
        setPlantillaActiva(null);
        setModalPlantillas(true);
    };

    const seleccionarPlantilla = (p: PlantillaItem) => {
        const vars = detectarVars(p.contenido);
        const init: Record<string, string> = {};
        vars.forEach(v => {
            if (v === "nombre") init[v] = formData.nombre;
            else if (v === "apellidos") init[v] = formData.apellidos;
            else if (v === "dni") init[v] = formData.dni;
            else if (v === "telefono") init[v] = formData.telefono;
            else if (v === "email") init[v] = formData.email;
            else if (v === "direccion") init[v] = formData.direccion;
            else if (v === "fecha") init[v] = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
            else init[v] = "";
        });
        setVarsPlantilla(init);
        setPlantillaActiva(p);
    };

    const imprimirPlantilla = () => {
        if (!plantillaActiva) return;
        const w = window.open("", "_blank");
        if (!w) return;
        const texto = rellenarPlantilla(plantillaActiva.contenido, varsPlantilla);
        w.document.write(`<html><head><title>${plantillaActiva.titulo}</title>
        <style>body{font-family:Georgia,serif;max-width:700px;margin:60px auto;font-size:14px;line-height:1.8;color:#111}pre{white-space:pre-wrap;font-family:inherit}</style></head>
        <body><pre>${texto}</pre></body></html>`);
        w.document.close(); w.print();
    };

    // ---- Cargar cliente desde Supabase ----
    useEffect(() => {
        if (!clienteId) return;

        const fetchCliente = async () => {
            setCargando(true);
            const { data, error } = await supabase
                .from('clientes')
                .select('nombre, apellidos, dni_nie, calle, telefono, email, rgpd_aceptado, rgpd_firma_url')
                .eq('id', clienteId)
                .single();

            if (error || !data) {
                setErrorCarga(error?.message ?? 'Cliente no encontrado');
            } else {
                setFormData({
                    nombre: data.nombre ?? '',
                    apellidos: data.apellidos ?? '',
                    dni: data.dni_nie ?? '',
                    direccion: data.calle ?? '',
                    telefono: data.telefono ?? '',
                    email: data.email ?? '',
                });
                setRgpdAceptado(data.rgpd_aceptado ?? false);
                setRgpdFirmaUrl(data.rgpd_firma_url ?? null);
            }
            setCargando(false);
        };

        fetchCliente();

        // Cargar solicitudes de firma del cliente
        supabase
            .from('solicitudes_firma')
            .select('id, token, titulo_documento, estado, created_at, firmado_at, firma_url')
            .eq('cliente_id', clienteId)
            .order('created_at', { ascending: false })
            .then(({ data }) => { if (data) setSolicitudesFirma(data); });
    }, [clienteId]);

    // ---- Guardar cambios en Supabase ----
    const handleGuardarParcial = async () => {
        setGuardando(true);
        const { error } = await supabase
            .from('clientes')
            .update({
                nombre: formData.nombre || null,
                apellidos: formData.apellidos || null,
                dni_nie: formData.dni || null,
                calle: formData.direccion || null,
                telefono: formData.telefono || null,
                email: formData.email || null,
            })
            .eq('id', clienteId);

        setGuardando(false);
        if (error) {
            setMensajeGuardado('❌ Error: ' + error.message);
        } else {
            setMensajeGuardado('✅ Cambios guardados correctamente.');
        }
        setTimeout(() => setMensajeGuardado(''), 3500);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // ---- Documentos ----
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) await procesarArchivos(e.dataTransfer.files);
    };

    const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) await procesarArchivos(e.target.files);
    };

    const procesarArchivos = async (files: FileList) => {
        setUploading(true);
        await new Promise(resolve => setTimeout(resolve, 1200));
        const nuevosDocs = Array.from(files).map(file => ({
            id: `file-${Date.now()}-${Math.random()}`,
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: `${(file.size / 1024).toFixed(1)} KB`,
            date: new Date().toLocaleDateString('es-ES'),
            category: 'Otros'
        }));
        setDocumentos(prev => [...nuevosDocs, ...prev]);
        setUploading(false);
    };

    const eliminarDocumento = (id: string) => setDocumentos(prev => prev.filter(doc => doc.id !== id));

    const getFileIcon = (type: string) => {
        if (type.includes('pdf')) return <File className="w-6 h-6 text-red-400" />;
        if (type.includes('word') || type.includes('document')) return <File className="w-6 h-6 text-blue-400" />;
        if (type.includes('image')) return <File className="w-6 h-6 text-emerald-400" />;
        return <File className="w-6 h-6 text-slate-400" />;
    };

    const docsFiltrados = filtroCategoria === 'Todos' ? documentos : documentos.filter(d => d.category === filtroCategoria);

    // ---- Toast ----
    const mostrarToast = (titulo: string, descripcion: string, tipo: 'success' | 'info' = 'success') => {
        setToastMensaje({ titulo, descripcion, tipo });
        setTimeout(() => setToastMensaje(null), 4000);
    };

    // ---- RGPD handlers ----
    const handleGenerarClausula = async () => {
        setGenerandoPdf(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setGenerandoPdf(false);
        mostrarToast('Cláusula Generada', `Documento RGPD para ${formData.nombre} ${formData.apellidos} listo para firma.`);
    };

    // Abre el pad de firma con el contexto correcto
    const abrirFirma = (contexto: 'rgpd' | string) => {
        setFirmaContexto(contexto);
        setFirmaVisible(true);
    };

    // Se llama cuando el cliente confirma su firma en el canvas
    const handleFirmaCapturada = async (dataUrl: string) => {
        setFirmaVisible(false);

        if (firmaContexto === 'rgpd') {
            // --- Guardar consentimiento RGPD con firma ---
            const { error } = await supabase
                .from('clientes')
                .update({
                    rgpd_aceptado: true,
                    rgpd_fecha: new Date().toISOString(),
                    rgpd_metodo: metodoFirma,
                    rgpd_firma_url: dataUrl,
                })
                .eq('id', clienteId);

            if (error) {
                mostrarToast('Error', 'No se pudo guardar la firma RGPD: ' + error.message, 'info');
                return;
            }
            setRgpdAceptado(true);
            setRgpdFirmaUrl(dataUrl);
            mostrarToast('Consentimiento Firmado ✅', 'Firma RGPD capturada y guardada en Supabase.');
            setDocumentos(prev => [{
                id: `rgpd-${Date.now()}`,
                name: 'Consentimiento_RGPD_Firmado.pdf',
                type: 'application/pdf', size: '—',
                date: new Date().toLocaleDateString('es-ES'),
                category: 'Contratos'
            }, ...prev]);
        } else {
            // --- Marcar documento como firmado ---
            setDocFirmados(prev => ({ ...prev, [firmaContexto]: true }));
            mostrarToast('Documento Firmado ✅', 'Firma del cliente registrada para este documento.');
        }
    };

    const handleRegistrarConsentimiento = () => abrirFirma('rgpd');

    const handleExportarDatos = async () => {
        mostrarToast('Exportando Datos', 'Generando paquete JSON con los datos personales del cliente.', 'info');
        await new Promise(resolve => setTimeout(resolve, 2000));
        mostrarToast('Datos ARCO Exportados', 'Descarga completada conforme al Derecho a la Portabilidad.');
    };

    // ---- Firma Remota handlers ----
    const handleEnviarParaFirma = async () => {
        if (!tituloDoc.trim() || !contenidoDoc.trim()) return;
        setGenerandoEnlace(true);

        const clienteNombre = `${formData.nombre} ${formData.apellidos}`.trim();
        const { data, error } = await supabase
            .from('solicitudes_firma')
            .insert([{
                cliente_id: clienteId,
                cliente_nombre: clienteNombre,
                tipo_documento: 'otro',
                titulo_documento: tituloDoc,
                contenido_documento: contenidoDoc,
            }])
            .select('token')
            .single();

        setGenerandoEnlace(false);
        if (error || !data) {
            mostrarToast('Error', 'No se pudo crear el enlace de firma.', 'info');
            return;
        }

        const enlace = `${window.location.origin}/firmar/${data.token}`;
        setEnlaceCopado(enlace);

        // Actualizar lista de solicitudes
        setSolicitudesFirma(prev => [{
            id: '', token: data.token, titulo_documento: tituloDoc,
            estado: 'pendiente', created_at: new Date().toISOString(),
            firmado_at: null, firma_url: null
        }, ...prev]);
    };

    const copiarEnlace = (enlace: string) => {
        navigator.clipboard.writeText(enlace).then(() =>
            mostrarToast('Copiado', 'Enlace copiado al portapapeles.')
        );
    };


    // ---- Tabs ----
    const TabDatos = (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">Información Personal</h3>
                {mensajeGuardado && (
                    <span className="text-sm text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full animate-pulse">
                        {mensajeGuardado}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {[
                    { label: 'Nombre', name: 'nombre', type: 'text' },
                    { label: 'Apellidos', name: 'apellidos', type: 'text' },
                    { label: 'DNI / NIE / CIF', name: 'dni', type: 'text' },
                    { label: 'Teléfono', name: 'telefono', type: 'text' },
                ].map(f => (
                    <div key={f.name} className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">{f.label}</label>
                        <input type={f.type} name={f.name}
                            value={formData[f.name as keyof typeof formData]}
                            onChange={handleInputChange}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                        />
                    </div>
                ))}
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-400">Correo Electrónico</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors" />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-400">Dirección Completa</label>
                    <input type="text" name="direccion" value={formData.direccion} onChange={handleInputChange}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors" />
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={handleGuardarParcial} disabled={guardando}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors ${guardando ? 'bg-emerald-600/50 text-emerald-200 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}`}>
                    <Save className="w-4 h-4" />
                    {guardando ? 'Guardando…' : 'Guardar Cambios'}
                </button>
            </div>
        </div>
    );

    const TabDocumentacion = (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">Gestor Documental</h2>
                    <p className="text-sm text-slate-400">Archivos y documentos asociados a este cliente.</p>
                </div>
                <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50 overflow-x-auto w-full md:w-auto">
                    {categorias.map(cat => (
                        <button key={cat} onClick={() => setFiltroCategoria(cat)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filtroCategoria === cat ? 'bg-emerald-600/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div
                className={`relative rounded-3xl border-2 border-dashed transition-all duration-300 p-10 text-center ${dragActive ? 'border-emerald-500 bg-emerald-500/10 scale-[1.02]' : 'border-slate-700 bg-slate-900/50 hover:border-emerald-500/50 hover:bg-slate-800/80'}`}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            >
                <input type="file" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileInput} disabled={uploading} />
                <div className="flex flex-col items-center justify-center pointer-events-none space-y-4">
                    <div className={`p-4 rounded-full ${uploading ? 'bg-emerald-500/20' : 'bg-slate-800'} transition-colors`}>
                        <UploadCloud className={`w-8 h-8 ${uploading ? 'text-emerald-400 animate-bounce' : 'text-slate-400'}`} />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-white mb-1">{uploading ? 'Subiendo archivos…' : 'Sube tus documentos aquí'}</h4>
                        <p className="text-sm text-slate-400 max-w-sm mx-auto">Arrastra y suelta tus archivos, o haz clic para explorar. PDF, Word, Excel e Imágenes.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {docsFiltrados.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                        No hay documentos en esta categoría.
                    </div>
                ) : (
                    docsFiltrados.map(doc => (
                        <div key={doc.id} className="group relative bg-slate-900 border border-slate-800 hover:border-emerald-500/30 rounded-2xl p-5 transition-all hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-slate-800 rounded-xl">{getFileIcon(doc.type)}</div>
                                <div className="flex items-center gap-2">
                                    {docFirmados[doc.id] && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3" /> Firmado
                                        </span>
                                    )}
                                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">{doc.category}</span>
                                </div>
                            </div>
                            <h4 className="text-sm font-semibold text-slate-200 truncate mb-1">{doc.name}</h4>
                            <div className="flex items-center text-xs text-slate-500 gap-3">
                                <span>{doc.size}</span><span>•</span><span>{doc.date}</span>
                            </div>
                            <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 backdrop-blur-sm rounded-lg shadow-xl border border-slate-700 p-1 flex gap-1 z-20">
                                {!docFirmados[doc.id] && (
                                    <button onClick={() => abrirFirma(doc.id)} className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-md transition-colors" title="Obtener firma del cliente">
                                        <PenLine className="w-4 h-4" />
                                    </button>
                                )}
                                <button className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-md transition-colors" title="Descargar"><Download className="w-4 h-4" /></button>
                                <button className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors" title="Renombrar"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => eliminarDocumento(doc.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    const TabRGPD = (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <FileSignature className="w-5 h-5 text-blue-500" /> Gestión del Consentimiento
                    </h3>
                    <div className="space-y-6">
                        <div className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-xl">
                            <h4 className="text-sm font-medium text-slate-300 mb-2">1. Generar Documento a Firmar</h4>
                            <p className="text-xs text-slate-400 mb-4">Para: <strong className="text-slate-200">{formData.nombre} {formData.apellidos}</strong> · DNI: {formData.dni || '—'}</p>
                            <button onClick={handleGenerarClausula} disabled={generandoPdf}
                                className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                {generandoPdf ? 'Generando…' : <><File className="w-4 h-4" /> Generar Cláusula RGPD</>}
                            </button>
                        </div>
                        <div className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-xl">
                            <h4 className="text-sm font-medium text-slate-300 mb-4">2. Registrar Firma</h4>
                            <select value={metodoFirma} onChange={e => setMetodoFirma(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 mb-4">
                                <option value="Firma_Documento_Digital">Firma Digital Recabada</option>
                                <option value="Documento_Fisico_Escaneado">Documento Físico Escaneado</option>
                                <option value="Consentimiento_Verbal">Consentimiento Verbal Grabado</option>
                                <option value="Aceptacion_Email">Aceptación vía Email Trazable</option>
                            </select>
                            <button onClick={handleRegistrarConsentimiento} disabled={rgpdAceptado}
                                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${rgpdAceptado ? 'bg-emerald-600/20 text-emerald-500 cursor-not-allowed border border-emerald-500/20' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}`}>
                                {rgpdAceptado ? <><ShieldCheck className="w-4 h-4" /> Consentimiento Activo</> : <><Save className="w-4 h-4" /> Firmar en este dispositivo</>}
                            </button>
                            <button onClick={() => setModalEnvioVisible(true)}
                                className="w-full mt-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400">
                                <Send className="w-4 h-4" /> Enviar enlace al cliente
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-orange-500" /> Derechos ARCO
                        </h3>
                        <p className="text-sm text-slate-400 mb-6">
                            Facilita el ejercicio de los derechos de Acceso, Rectificación, Cancelación, Oposición y <strong>Portabilidad</strong> del cliente europeo.
                        </p>
                    </div>
                    <div className="bg-orange-500/5 border border-orange-500/20 p-5 rounded-xl text-center">
                        <DownloadCloud className="w-8 h-8 text-orange-400 mx-auto mb-3 opacity-80" />
                        <h4 className="text-sm font-medium text-slate-200 mb-1">Portabilidad de Datos</h4>
                        <p className="text-xs text-slate-400 mb-4 px-4">Exporta todos los datos en JSON/CSV consolidado con trazabilidad legal.</p>
                        <button onClick={handleExportarDatos}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                            <DownloadCloud className="w-4 h-4" /> Exportar Todos los Datos
                        </button>
                    </div>
                </div>
            </div>

            {/* Historial de Firmas Remotas */}
            {solicitudesFirma.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                        <Send className="w-4 h-4 text-violet-400" /> Solicitudes de Firma Enviadas
                    </h3>
                    <div className="space-y-3">
                        {solicitudesFirma.map((sol, i) => (
                            <div key={sol.token + i} className="flex items-center justify-between bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-200 truncate">{sol.titulo_documento}</p>
                                    <p className="text-xs text-slate-500">{new Date(sol.created_at).toLocaleDateString('es-ES')}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {sol.estado === 'firmado' ? (
                                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                                            <CheckCheck className="w-3 h-3" /> Firmado
                                        </span>
                                    ) : (
                                        <>
                                            <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">Pendiente</span>
                                            <button
                                                onClick={() => copiarEnlace(`${typeof window !== 'undefined' ? window.location.origin : ''}/firmar/${sol.token}`)}
                                                className="p-1.5 text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                                                title="Copiar enlace">
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                            <a href={`/firmar/${sol.token}`} target="_blank" rel="noreferrer"
                                                className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Abrir enlace">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const tabs = [
        { id: "datos-personales", label: "Datos Personales", content: TabDatos },
        { id: "documentacion-cliente", label: "Documentación", content: TabDocumentacion },
        { id: "rgpd-privacidad", label: "RGPD y Privacidad", content: TabRGPD },
    ];

    // ---- Render ----
    if (cargando) {
        return (
            <div className="flex items-center justify-center h-60 gap-3 text-slate-400">
                <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
                Cargando datos del cliente…
            </div>
        );
    }

    if (errorCarga) {
        return (
            <div className="max-w-5xl mx-auto pb-12">
                <Link href="/clientes" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors mb-6">
                    <ArrowLeft className="w-4 h-4" /> Volver a Clientes
                </Link>
                <div className="bg-red-950/30 border border-red-500/30 rounded-2xl p-8 text-center">
                    <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-4" />
                    <p className="text-red-300 font-semibold mb-2">No se pudo cargar el cliente</p>
                    <p className="text-slate-400 text-sm">{errorCarga}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <div className="mb-8">
                <Link href="/clientes" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4" /> Volver a Clientes
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                            {formData.nombre} {formData.apellidos}
                        </h1>
                        <div className="flex items-center gap-4 text-sm">
                            {formData.dni && <p className="text-slate-400">DNI: {formData.dni}</p>}
                            {formData.dni && <span className="text-slate-600">•</span>}
                            {rgpdAceptado ? (
                                <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-medium">
                                    <ShieldCheck className="w-4 h-4" /> RGPD Aceptado
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2.5 py-0.5 rounded-full font-medium shadow-[0_0_10px_rgba(249,115,22,0.15)] animate-pulse">
                                    <ShieldAlert className="w-4 h-4" /> Pendiente de Consentimiento RGPD
                                </span>
                            )}
                        </div>
                    </div>
                    {/* Botón Usar Plantilla */}
                    <button onClick={abrirModalPlantillas}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 rounded-xl transition-colors">
                        <BookOpen className="w-4 h-4" /> Usar Plantilla
                    </button>
                </div>
            </div>

            <Tabs tabs={tabs} defaultTab="datos-personales" />

            {/* Toast */}
            {toastMensaje && (
                <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right-8 fade-in duration-300">
                    <div className={`border rounded-xl p-4 flex items-start gap-3 shadow-2xl max-w-sm ${toastMensaje.tipo === 'success' ? 'bg-slate-900 border-emerald-500/30' : 'bg-slate-900 border-blue-500/30'}`}>
                        <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${toastMensaje.tipo === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {toastMensaje.tipo === 'success' ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white mb-1">{toastMensaje.titulo}</h4>
                            <p className="text-sm text-slate-300 leading-snug">{toastMensaje.descripcion}</p>
                        </div>
                        <button onClick={() => setToastMensaje(null)} className="text-slate-400 hover:text-white ml-2 flex-shrink-0">×</button>
                    </div>
                </div>
            )}

            {/* Pad de Firma del Cliente */}
            {firmaVisible && (
                <FirmaCanvas
                    onFirmaCapturada={handleFirmaCapturada}
                    onCancelar={() => setFirmaVisible(false)}
                    titulo={firmaContexto === 'rgpd' ? 'Firma Consentimiento RGPD' : 'Firma del Documento'}
                    descripcion={
                        firmaContexto === 'rgpd'
                            ? `${formData.nombre} ${formData.apellidos} debe firmar para registrar el consentimiento RGPD.`
                            : 'El cliente debe firmar para validar este documento.'
                    }
                />
            )}

            {/* Modal: Enviar Enlace de Firma */}
            {modalEnvioVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-500/10 rounded-xl">
                                <Send className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Enviar Documento para Firma</h2>
                                <p className="text-xs text-slate-400">Se generará un enlace único para <strong className="text-slate-300">{formData.nombre}</strong></p>
                            </div>
                        </div>

                        {!enlaceCopado ? (
                            <>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-medium text-slate-400 block mb-1">Título del documento</label>
                                        <input
                                            type="text"
                                            value={tituloDoc}
                                            onChange={e => setTituloDoc(e.target.value)}
                                            placeholder="Ej: Hoja de Encargo Profesional"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-400 block mb-1">Texto del documento (lo que verá el cliente)</label>
                                        <textarea
                                            value={contenidoDoc}
                                            onChange={e => setContenidoDoc(e.target.value)}
                                            placeholder="Escribe aquí el contenido legal del documento que el cliente debe leer y firmar..."
                                            rows={6}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setModalEnvioVisible(false); setEnlaceCopado(null); }}
                                        className="flex-1 px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleEnviarParaFirma}
                                        disabled={!tituloDoc.trim() || !contenidoDoc.trim() || generandoEnlace}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors shadow-lg shadow-violet-600/20">
                                        {generandoEnlace ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando…</> : <><Send className="w-4 h-4" /> Generar Enlace</>}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-3">
                                    <p className="text-sm font-medium text-emerald-400">✅ Enlace generado correctamente</p>
                                    <p className="text-xs text-slate-400">Comparte este enlace con el cliente por WhatsApp, correo o SMS. Válido 72 horas.</p>
                                    <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 border border-slate-700">
                                        <code className="flex-1 text-xs text-violet-300 truncate">{enlaceCopado}</code>
                                        <button
                                            onClick={() => copiarEnlace(enlaceCopado)}
                                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-violet-400 transition-colors shrink-0">
                                            <Copy className="w-3.5 h-3.5" /> Copiar
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <a href={`https://api.whatsapp.com/send?text=Hola%20${formData.nombre}%2C%20te%20enviamos%20un%20documento%20para%20firmar%3A%20${encodeURIComponent(enlaceCopado)}`}
                                        target="_blank" rel="noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/30 rounded-xl transition-colors">
                                        <ExternalLink className="w-4 h-4" /> WhatsApp
                                    </a>
                                    <button
                                        onClick={() => { setModalEnvioVisible(false); setEnlaceCopado(null); setTituloDoc('Consentimiento RGPD'); setContenidoDoc(''); }}
                                        className="flex-1 px-4 py-2 text-sm font-bold text-white bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors">
                                        Cerrar
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* =========================================================
                MODAL: Usar Plantilla con datos del cliente pre-rellenados
            ========================================================= */}
            {modalPlantillas && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-teal-500/10 rounded-xl">
                                    <BookOpen className="w-5 h-5 text-teal-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Plantillas Documentales</h2>
                                    <p className="text-xs text-slate-400">
                                        {plantillaActiva
                                            ? `Rellenando: ${plantillaActiva.titulo}`
                                            : `Datos de ${formData.nombre} ${formData.apellidos} se rellenarán automáticamente`}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setModalPlantillas(false)} className="text-slate-500 hover:text-white transition-colors">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex min-h-0">
                            {/* Panel: lista de plantillas */}
                            <div className="w-72 border-r border-slate-800 overflow-y-auto p-3 space-y-1.5 shrink-0">
                                {plantillasList.length === 0 ? (
                                    <div className="py-8 text-center text-slate-500 text-sm">
                                        <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                                        No hay plantillas aún.<br />
                                        <a href="/plantillas" target="_blank" className="text-teal-400 hover:text-teal-300 text-xs">Crear en /plantillas →</a>
                                    </div>
                                ) : plantillasList.map(p => (
                                    <button key={p.id} onClick={() => seleccionarPlantilla(p)}
                                        className={`w-full text-left px-3 py-3 rounded-xl border transition-all ${plantillaActiva?.id === p.id
                                            ? "border-teal-500/50 bg-teal-500/10 text-white"
                                            : "border-slate-800 bg-slate-800/30 text-slate-400 hover:border-slate-700 hover:text-slate-200"}`}>
                                        <p className="text-xs font-bold mb-0.5">{p.titulo}</p>
                                        <span className="text-[10px] text-teal-500 bg-teal-500/10 px-1.5 py-0.5 rounded">{p.categoria}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Panel central: formulario de variables */}
                            {plantillaActiva ? (
                                <div className="flex-1 overflow-hidden flex min-h-0">
                                    {/* Variables form */}
                                    <div className="w-64 border-r border-slate-800 overflow-y-auto p-4 space-y-3 shrink-0">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Datos del documento</p>
                                        {detectarVars(plantillaActiva.contenido).map(v => (
                                            <div key={v}>
                                                <label className={`text-xs font-medium block mb-1 ${VARS_CLIENTE.includes(v) ? "text-teal-400" : "text-slate-400"}`}>
                                                    {LABELS_PLANT[v] || v.replace(/_/g, " ")}
                                                    {VARS_CLIENTE.includes(v) && <span className="ml-1 text-[9px] text-teal-600">(auto)</span>}
                                                </label>
                                                {VARS_TEXTO.includes(v) ? (
                                                    <textarea rows={4} value={varsPlantilla[v] ?? ""}
                                                        onChange={e => setVarsPlantilla(prev => ({ ...prev, [v]: e.target.value }))}
                                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none" />
                                                ) : (
                                                    <input type="text" value={varsPlantilla[v] ?? ""}
                                                        onChange={e => setVarsPlantilla(prev => ({ ...prev, [v]: e.target.value }))}
                                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Preview del documento */}
                                    <div className="flex-1 overflow-y-auto bg-white rounded-r-2xl">
                                        <div className="p-8 max-w-2xl mx-auto">
                                            <div className="pb-4 mb-4 border-b border-slate-100">
                                                <p className="text-xs font-bold text-slate-400 uppercase">Nuria Arau · Mediación y Abogacía</p>
                                                <h3 className="text-lg font-bold text-slate-900">{plantillaActiva.titulo}</h3>
                                            </div>
                                            <pre className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-serif">
                                                {rellenarPlantilla(plantillaActiva.contenido, varsPlantilla)}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                                    ← Selecciona una plantilla de la lista
                                </div>
                            )}
                        </div>

                        {/* Footer acciones */}
                        <div className="flex gap-3 p-4 border-t border-slate-800">
                            <button onClick={() => setModalPlantillas(false)}
                                className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors">
                                Cerrar
                            </button>
                            {plantillaActiva && (
                                <>
                                    <button onClick={() => navigator.clipboard.writeText(rellenarPlantilla(plantillaActiva.contenido, varsPlantilla))}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors">
                                        <Copy className="w-4 h-4" /> Copiar texto
                                    </button>
                                    <button onClick={imprimirPlantilla}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition-colors shadow-lg shadow-teal-600/20">
                                        <Wand2 className="w-4 h-4" /> Imprimir / Guardar PDF
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
