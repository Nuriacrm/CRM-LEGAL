import { ClientExpedienteDetail } from "@/components/expedientes/ClientExpedienteDetail";

export default async function ExpedienteDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return <ClientExpedienteDetail id={id} />;
}
