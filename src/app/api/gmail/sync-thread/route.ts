import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

function makeOAuth2Client() {
    return new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    );
}

export async function POST(req: Request) {
    try {
        const { threadId, expedienteId } = await req.json();

        if (!threadId || !expedienteId) {
            return NextResponse.json({ error: 'Faltan campos (threadId, expedienteId)' }, { status: 400 });
        }

        // 1. Verificar sesión
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

        // 2. Obtener tokens
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('google_access_token, google_refresh_token, google_token_expiry')
            .eq('id', user.id)
            .single();

        if (!profile?.google_refresh_token) {
            return NextResponse.json({ error: 'Google no conectado' }, { status: 401 });
        }

        // 3. Gmail Client
        const auth = makeOAuth2Client();
        auth.setCredentials({
            access_token: profile.google_access_token,
            refresh_token: profile.google_refresh_token,
            expiry_date: profile.google_token_expiry ? new Date(profile.google_token_expiry).getTime() : undefined,
        });

        const gmail = google.gmail({ version: 'v1', auth });

        // 4. Obtener hilo completo
        const thread = await gmail.users.threads.get({
            userId: 'me',
            id: threadId,
            format: 'full'
        });

        const messages = thread.data.messages || [];

        // 5. Guardar cada mensaje del hilo en la BD si no existe
        for (const msg of messages) {
            const headers = msg.payload?.headers || [];
            const subject = headers.find(h => h.name === 'Subject')?.value || 'Sin asunto';
            const from = headers.find(h => h.name === 'From')?.value || 'Desconocido';
            const to = headers.find(h => h.name === 'To')?.value || 'Desconocido';
            const date = headers.find(h => h.name === 'Date')?.value;

            // Snippet como cuerpo simplificado (para un guardado rápido y limpio)
            const body = msg.snippet || '';

            // Verificar si ya existe para este expediente
            const { data: existing } = await supabaseAdmin
                .from('mensajes_gmail')
                .select('id')
                .eq('message_id', msg.id)
                .eq('expediente_id', expedienteId)
                .maybeSingle();

            if (!existing) {
                await supabaseAdmin.from('mensajes_gmail').insert({
                    expediente_id: expedienteId,
                    message_id: msg.id,
                    emisor: from,
                    destinatario: to,
                    asunto: subject,
                    cuerpo: body,
                    fecha: date ? new Date(date).toISOString() : new Date().toISOString()
                });
            }
        }

        return NextResponse.json({ success: true, count: messages.length });

    } catch (err: any) {
        console.error('Error sincronizando hilo:', err);
        return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
    }
}
