// Plantillas de documentos legales para el módulo de Firma Digital.
// Las variables {{nombre}}, {{dni}}, {{fecha}}, etc. se sustituyen en runtime.

export type PlantillaId =
    | "rgpd"
    | "encargo"
    | "reclamacion_extrajudicial"
    | "honorarios"
    | "personalizado";

export interface Plantilla {
    id: PlantillaId;
    titulo: string;
    descripcion: string;
    variables: string[]; // variables adicionales requeridas (además de nombre/dni/fecha)
    texto: string;       // plantilla con {{variables}}
}

const hoy = () => new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

export const PLANTILLAS: Plantilla[] = [
    {
        id: "rgpd",
        titulo: "Consentimiento RGPD / Protección de Datos",
        descripcion: "Cláusula de protección de datos para nuevos clientes.",
        variables: [],
        texto: `CLÁUSULA DE PROTECCIÓN DE DATOS PERSONALES

En cumplimiento del Reglamento General de Protección de Datos (RGPD – UE 2016/679) y la Ley Orgánica 3/2018 de Protección de Datos Personales (LOPDGDD), se informa a:

Nombre: {{nombre}}
DNI/NIE: {{dni}}

que sus datos personales serán tratados por Nuria Arau, Mediadora y Abogada (en adelante, "el Despacho"), con los siguientes fines:

1. Gestión de la relación profesional y prestación de servicios jurídicos y de mediación contratados.
2. Cumplimiento de obligaciones legales y fiscales.
3. Comunicaciones relacionadas con su expediente.

Sus datos no serán cedidos a terceros salvo obligación legal. Puede ejercer sus derechos de acceso, rectificación, supresión, portabilidad y oposición dirigiéndose a: arau.derechoymediacion@gmail.com

Fecha: {{fecha}}

El/La abajo firmante declara haber leído y comprendido la presente cláusula y consiente expresamente el tratamiento de sus datos personales conforme a lo indicado.`,
    },
    {
        id: "encargo",
        titulo: "Hoja de Encargo Profesional",
        descripcion: "Formalización del encargo de servicios jurídicos.",
        variables: ["asunto", "honorarios"],
        texto: `HOJA DE ENCARGO PROFESIONAL

En {{fecha}}, las partes que se expresan a continuación formalizan el presente encargo profesional:

CLIENTE
Nombre: {{nombre}}
DNI/NIE: {{dni}}

LETRADA / MEDIADORA
Nuria Arau — Mediación y Abogacía
Colegiada en ejercicio. Inscrita en el Registro de Mediadores del Ministerio de Justicia.

OBJETO DEL ENCARGO
{{asunto}}

HONORARIOS PACTADOS
{{honorarios}}

Los honorarios se devengarán conforme al trabajo efectivamente realizado. En caso de resolución anticipada, se facturarán los trabajos realizados hasta ese momento.

La presente hoja de encargo se rige por las normas deontológicas del Consejo General de la Abogacía Española y por el Real Decreto-Ley 5/2023.

El/La cliente manifiesta haber sido informado/a de sus derechos y acepta las condiciones anteriores mediante su firma.`,
    },
    {
        id: "reclamacion_extrajudicial",
        titulo: "Reclamación Extrajudicial",
        descripcion: "Carta de reclamación previa a actuación judicial.",
        variables: ["destinatario", "concepto_reclamacion", "cantidad", "plazo_dias"],
        texto: `RECLAMACIÓN EXTRAJUDICIAL

{{fecha}}

A la atención de: {{destinatario}}

Por medio de la presente, y actuando en nombre y representación de D./Dña. {{nombre}}, con DNI/NIE {{dni}}, paso a formular la siguiente:

RECLAMACIÓN

Mi representado/a ha sufrido los siguientes hechos y/o perjuicios:

{{concepto_reclamacion}}

Como consecuencia de los hechos descritos, se reclama la cantidad de:

▶ {{cantidad}} €

Se otorga un plazo de {{plazo_dias}} días hábiles desde la recepción de este escrito para proceder al abono o contestar motivadamente a la presente reclamación.

Transcurrido dicho plazo sin respuesta satisfactoria, mi representado/a queda expresamente facultado/a para ejercitar cuantas acciones judiciales y/o extrajudiciales procedan en defensa de sus derechos e intereses legítimos.

Atentamente,

Nuria Arau
Abogada y Mediadora
arau.derechoymediacion@gmail.com

—————————————————————
La parte destinataria de esta reclamación firma y fecha a continuación como acuse de recibo:`,
    },
    {
        id: "honorarios",
        titulo: "Contrato de Honorarios",
        descripcion: "Contrato formal de honorarios profesionales.",
        variables: ["servicios", "importe_total", "forma_pago"],
        texto: `CONTRATO DE HONORARIOS PROFESIONALES

En {{fecha}}, se suscribe el presente Contrato de Honorarios entre:

CLIENTE: {{nombre}} (DNI/NIE: {{dni}})
PROFESIONAL: Nuria Arau — Mediación y Abogacía

SERVICIOS CONTRATADOS
{{servicios}}

IMPORTE TOTAL
{{importe_total}} € (más IVA aplicable según normativa vigente)

FORMA DE PAGO
{{forma_pago}}

El impago de los honorarios en los plazos pactados facultará a la Letrada para cesar en la prestación del servicio, sin perjuicio de las acciones legales para el cobro de lo adeudado.

El presente contrato se somete a la jurisdicción de los Tribunales del domicilio de la Letrada, con renuncia expresa a cualquier otro fuero.

Firmado por ambas partes:`,
    },
    {
        id: "personalizado",
        titulo: "Documento Personalizado",
        descripcion: "Redacta libremente el contenido del documento.",
        variables: ["contenido"],
        texto: `{{contenido}}`,
    },
];

export function rellenarPlantilla(plantilla: Plantilla, vars: Record<string, string>): string {
    let texto = plantilla.texto;
    // Variables estándar
    texto = texto.replace(/{{fecha}}/g, vars.fecha || hoy());
    texto = texto.replace(/{{nombre}}/g, vars.nombre || "");
    texto = texto.replace(/{{dni}}/g, vars.dni || "");
    // Variables adicionales de cada plantilla
    for (const [key, value] of Object.entries(vars)) {
        texto = texto.replace(new RegExp(`{{${key}}}`, "g"), value);
    }
    return texto;
}
