import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { googleCalendarService } from '@/lib/google';

export async function POST(request: Request) {
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
        const { action, eventData, googleEventId } = await request.json();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        let result;
        if (action === 'create') {
            result = await googleCalendarService.createEvent(user.id, eventData);
        } else if (action === 'update') {
            if (!googleEventId) throw new Error('Missing googleEventId for update');
            result = await googleCalendarService.updateEvent(user.id, googleEventId, eventData);
        } else if (action === 'delete') {
            if (!googleEventId) throw new Error('Missing googleEventId for delete');
            await googleCalendarService.deleteEvent(user.id, googleEventId);
            result = { success: true };
        }

        return NextResponse.json(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Sync Error:', error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
