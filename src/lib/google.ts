import { google } from 'googleapis';
import { supabase } from './supabase';

const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
);

export const googleCalendarService = {
    getAuthUrl() {
        return oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/calendar.events',
                'https://www.googleapis.com/auth/gmail.send',
                'https://www.googleapis.com/auth/gmail.readonly'
            ],
            prompt: 'consent'
        });
    },

    async setTokensFromCode(code: string, userId: string) {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Save tokens to Supabase profile
        const { error } = await supabase
            .from('profiles')
            .update({
                google_access_token: tokens.access_token,
                google_refresh_token: tokens.refresh_token,
                google_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null
            })
            .eq('id', userId);

        if (error) throw error;
        return tokens;
    },

    async getClient(userId: string) {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('google_access_token, google_refresh_token, google_token_expiry')
            .eq('id', userId)
            .single();

        if (error || !profile?.google_refresh_token) {
            throw new Error('Google account not connected');
        }

        oauth2Client.setCredentials({
            access_token: profile.google_access_token,
            refresh_token: profile.google_refresh_token,
            expiry_date: profile.google_token_expiry ? new Date(profile.google_token_expiry).getTime() : undefined
        });

        return google.calendar({ version: 'v3', auth: oauth2Client });
    },

    async createEvent(userId: string, eventData: any) {
        const calendar = await this.getClient(userId);
        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: {
                summary: eventData.asunto,
                location: eventData.ubicacion,
                description: `Tipo: ${eventData.tipo}. ${eventData.es_critico ? 'IMPORTANTE' : ''}`,
                start: {
                    dateTime: eventData.fecha_hora,
                    timeZone: 'Europe/Madrid',
                },
                end: {
                    dateTime: new Date(new Date(eventData.fecha_hora).getTime() + 3600000).toISOString(),
                    timeZone: 'Europe/Madrid',
                },
            },
        });
        return response.data;
    },

    async updateEvent(userId: string, googleEventId: string, eventData: any) {
        const calendar = await this.getClient(userId);
        const response = await calendar.events.update({
            calendarId: 'primary',
            eventId: googleEventId,
            requestBody: {
                summary: eventData.asunto,
                location: eventData.ubicacion,
                description: `Tipo: ${eventData.tipo}. ${eventData.es_critico ? 'IMPORTANTE' : ''}`,
                start: {
                    dateTime: eventData.fecha_hora,
                    timeZone: 'Europe/Madrid',
                },
                end: {
                    dateTime: new Date(new Date(eventData.fecha_hora).getTime() + 3600000).toISOString(),
                    timeZone: 'Europe/Madrid',
                },
            },
        });
        return response.data;
    },

    async deleteEvent(userId: string, googleEventId: string) {
        const calendar = await this.getClient(userId);
        await calendar.events.delete({
            calendarId: 'primary',
            eventId: googleEventId,
        });
    }
};
