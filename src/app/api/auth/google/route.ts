import { NextResponse } from 'next/server';
import { googleCalendarService } from '@/lib/google';

export async function GET() {
    const authUrl = googleCalendarService.getAuthUrl();
    return NextResponse.redirect(authUrl);
}
