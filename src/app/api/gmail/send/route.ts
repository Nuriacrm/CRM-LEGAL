import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

function decodeBase64(str: string) {
    return Buffer.from(str, 'base64').toString('utf-8');
}

function encodeSafeBase64(str: string) {
    return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function makeOAuth2Client() {
    return new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    );
}

export async function POST(req: Request) {
    try {
        const { to, subject, body } = await req.json();

        if (!to || !subject || !body) {
            return NextResponse.json({ error: 'Faltan campos obligatorios (to, subject, body)' }, { status: 400 });
        }

        // 1. Verificar sesión Supabase
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

        // 2. Verificar que es admin
        const { data: equipo } = await supabase.from('equipo').select('rol').eq('email', user.email).single();
        if (equipo?.rol !== 'admin') {
            return NextResponse.json({ error: 'Solo los administradores pueden enviar correos' }, { status: 403 });
        }

        // 3. Obtener tokens
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

        // 4. Configurar Gmail Client
        const auth = makeOAuth2Client();
        auth.setCredentials({
            access_token: profile.google_access_token,
            refresh_token: profile.google_refresh_token,
            expiry_date: profile.google_token_expiry ? new Date(profile.google_token_expiry).getTime() : undefined,
        });

        const gmail = google.gmail({ version: 'v1', auth });

        // 5. Construir mensaje RFC 2822
        // Nota: UTF-8 encoding simple
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        const messageParts = [
            `To: ${to}`,
            `Subject: ${utf8Subject}`,
            'Content-Type: text/plain; charset=utf-8',
            'MIME-Version: 1.0',
            '',
            body,
        ];
        const message = messageParts.join('\n');
        const encodedMessage = encodeSafeBase64(message);

        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });

        return NextResponse.json({ success: true, messageId: res.data.id });

    } catch (err: any) {
        console.error('Error enviando Gmail:', err);
        return NextResponse.json({ error: err.message || 'Error interno al enviar email' }, { status: 500 });
    }
}
