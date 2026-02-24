import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { googleCalendarService } from '@/lib/google';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/agenda?error=no_code`);
    }

    // Next.js 15+: cookies() is async
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                },
            },
        }
    );

    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`);
        }

        await googleCalendarService.setTokensFromCode(code, user.id);

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/agenda?success=google_connected`);
    } catch (error) {
        console.error('Error in Google OAuth callback:', error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/agenda?error=auth_failed`);
    }
}
