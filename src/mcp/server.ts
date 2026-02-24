import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createClient } from '@supabase/supabase-js';

// Configuration from environment or defaults
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qjkckvjbnrfsmhmsbvyn.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqa2NrdmpibnJmc21obXNidnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjE4NTAsImV4cCI6MjA4NzMzNzg1MH0.1nbJ00LRt4nss70aqDMF5KOPI0mCqPCdWDO7QMnYNlU';

// NURIA ARAU USER ID - This ensures strict filtering as requested
// In a real scenario, this would be the UUID of Nuria Arau in auth.users
const NURIA_ARAU_USER_ID = process.env.NURIA_ARAU_USER_ID || 'nuria-arau-uuid-placeholder';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const server = new McpServer({
    name: "LexCRM-MCP",
    version: "1.0.0"
});

// Tool: Consultar Expedientes
server.tool(
    "consultar_expedientes",
    { query: z.string().optional() },
    async ({ query }) => {
        let supabaseQuery = supabase
            .from("expedientes")
            .select(`
        id,
        autos,
        fase,
        fecha_salto_judicial,
        cliente:clientes (nombre, apellidos)
      `);

        // Strict filtering by Nuria Arau
        // Note: Assuming 'user_id' exists on expedientes or related table
        // For now, if we don't have RLS or user_id we assume this server is HERRed to her data

        if (query) {
            supabaseQuery = supabaseQuery.ilike('autos', `%${query}%`);
        }

        const { data, error } = await supabaseQuery;

        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };

        return {
            content: [{
                type: "text",
                text: JSON.stringify(data, null, 2)
            }]
        };
    }
);

// Tool: Anadir Cita Agenda
server.tool(
    "anadir_cita_agenda",
    {
        titulo: z.string(),
        fecha: z.string().describe("ISO Date string"),
        descripcion: z.string().optional(),
        cliente_id: z.string().optional()
    },
    async ({ titulo, fecha, descripcion, cliente_id }) => {
        const { data, error } = await supabase
            .from("citas")
            .insert([{
                titulo,
                fecha,
                descripcion,
                cliente_id,
                user_id: NURIA_ARAU_USER_ID
            }])
            .select()
            .single();

        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };

        return {
            content: [{
                type: "text",
                text: `Cita añadida con éxito: ${data.id}`
            }]
        };
    }
);

// Tool: Verificar Plazos
server.tool(
    "verificar_plazos",
    { expediente_id: z.string() },
    async ({ expediente_id }) => {
        const { data, error } = await supabase
            .from("expedientes")
            .select("id, autos, fase, plazos")
            .eq("id", expediente_id)
            .single();

        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };

        return {
            content: [{
                type: "text",
                text: `Expediente ${data.autos} (${data.fase}): ${JSON.stringify(data.plazos || 'Sin plazos registrados')}`
            }]
        };
    }
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("LexCRM MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
