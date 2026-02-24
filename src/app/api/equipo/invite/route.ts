import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: Request) {
    // 1. Verificar que el solicitante es admin
    const cookieStore = await cookies();
    const supabaseUser = createServerClient(
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

    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    // Verificar rol admin en tabla equipo
    const { data: equipoRow } = await supabaseUser
        .from('equipo')
        .select('rol')
        .eq('email', user.email)
        .single();

    if (equipoRow?.rol !== 'admin') {
        return NextResponse.json({ error: 'Solo los administradores pueden invitar usuarios' }, { status: 403 });
    }

    // 2. Leer cuerpo de la petición
    const { email, nombre, rol } = await req.json();
    if (!email || !nombre || !rol) {
        return NextResponse.json({ error: 'Faltan campos obligatorios (email, nombre, rol)' }, { status: 400 });
    }
    if (!['admin', 'staff'].includes(rol)) {
        return NextResponse.json({ error: 'Rol no válido' }, { status: 400 });
    }

    // 3. Insertar en tabla equipo (previo a enviar invitación)
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Comprobar si ya existe
    const { data: existing } = await supabaseAdmin
        .from('equipo')
        .select('id, revocado')
        .eq('email', email)
        .single();

    if (existing && !existing.revocado) {
        return NextResponse.json({ error: 'Este email ya tiene acceso activo' }, { status: 409 });
    }

    if (existing?.revocado) {
        // Reactivar usuario revocado
        await supabaseAdmin.from('equipo').update({ revocado: false, nombre, rol }).eq('email', email);
    } else {
        // Crear nuevo registro en equipo
        const { error: insertErr } = await supabaseAdmin
            .from('equipo')
            .insert({ email, nombre, rol, revocado: false });
        if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // 4. Enviar invitación de Supabase Auth
    const { error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { nombre, rol },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://crm-despacho-nuria-arau.vercel.app'}/login`,
    });

    if (inviteErr) {
        // El usuario puede ya existir en auth — no es error fatal
        console.warn('Auth invite warning:', inviteErr.message);
    }

    return NextResponse.json({ success: true, message: `Invitación enviada a ${email}` });
}
