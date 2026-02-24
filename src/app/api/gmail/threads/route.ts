import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// ── OAuth2 client (server-side) ──────────────────────────────────────────────
function makeOAuth2Client() {
    return new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    );
}

// ── Gmail threads API route ──────────────────────────────────────────────────
// GET /api/gmail/threads?email=cliente@ejemplo.com
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const clienteEmail = searchParams.get('email');
    const query = clienteEmail ? `from:${clienteEmail} OR to:${clienteEmail}` : "in:inbox OR in:sent";

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

    // 2. Verificar que es admin (solo Nuria puede ver correos)
    const { data: equipo } = await supabase.from('equipo').select('rol').eq('email', user.email).single();
    if (equipo?.rol !== 'admin') {
        return NextResponse.json({ error: 'Solo los administradores pueden acceder a los correos' }, { status: 403 });
    }

    // 3. Obtener tokens de Google desde profiles
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
        return NextResponse.json({
            error: 'Google no conectado',
            needsAuth: true,
            authUrl: makeOAuth2Client().generateAuthUrl({
                access_type: 'offline',
                scope: [
                    'https://www.googleapis.com/auth/calendar',
                    'https://www.googleapis.com/auth/calendar.events',
                    'https://www.googleapis.com/auth/gmail.send',
                    'https://www.googleapis.com/auth/gmail.readonly',
                ],
                prompt: 'consent',
            })
        }, { status: 401 });
    }

    // 4. Configurar cliente OAuth con los tokens guardados
    const auth = makeOAuth2Client();
    auth.setCredentials({
        access_token: profile.google_access_token,
        refresh_token: profile.google_refresh_token,
        expiry_date: profile.google_token_expiry ? new Date(profile.google_token_expiry).getTime() : undefined,
    });

    // Auto-refresh: si el token caduca, renovarlo y guardar
    auth.on('tokens', async (tokens) => {
        if (tokens.access_token) {
            await supabaseAdmin.from('profiles').update({
                google_access_token: tokens.access_token,
                google_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
            }).eq('id', user.id);
        }
    });

    // 5. Buscar threads con ese email
    const gmail = google.gmail({ version: 'v1', auth });

    try {
        const threadsRes = await gmail.users.threads.list({
            userId: 'me',
            q: query,
            maxResults: 20,
        });

        const threads = threadsRes.data.threads ?? [];

        // 6. Para cada thread, obtener el primer mensaje para preview
        const threadDetails = await Promise.all(
            threads.map(async (t) => {
                const detail = await gmail.users.threads.get({
                    userId: 'me',
                    id: t.id!,
                    format: 'metadata',
                    metadataHeaders: ['Subject', 'From', 'To', 'Date'],
                });

                const msg = detail.data.messages?.[0];
                const headers = msg?.payload?.headers ?? [];
                const getH = (name: string) => headers.find(h => h.name === name)?.value ?? '';

                return {
                    id: t.id,
                    snippet: detail.data.snippet ?? '',
                    subject: getH('Subject') || '(Sin asunto)',
                    from: getH('From'),
                    to: getH('To'),
                    date: getH('Date'),
                    msgCount: detail.data.messages?.length ?? 1,
                };
            })
        );

        return NextResponse.json({ threads: threadDetails });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error Gmail';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
