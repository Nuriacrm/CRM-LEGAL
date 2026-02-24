import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { googleCalendarService } from '@/lib/google';

export async function POST(request: Request) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    cookieStore.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    cookieStore.set({ name, value: '', ...options });
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
    } catch (error: any) {
        console.error('Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
