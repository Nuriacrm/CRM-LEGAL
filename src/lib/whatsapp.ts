import { supabase } from './supabase';

const WHATSAPP_API_URL = `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

export const whatsappService = {
    async sendMessage(to: string, text: string, clienteId?: string) {
        if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
            console.warn("WhatsApp credentials missing. Running in DEMO mode.");
            return this.mockSend(to, text, clienteId);
        }

        try {
            const response = await fetch(WHATSAPP_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: to.replace(/\s+/g, ''),
                    type: 'text',
                    text: { body: text },
                }),
            });

            const data = await response.json();

            if (clienteId) {
                await this.logMessage(clienteId, text, data.messages?.[0]?.id || 'error', response.ok ? 'sent' : 'failed');
            }

            return data;
        } catch (error) {
            console.error("WhatsApp Error:", error);
            throw error;
        }
    },

    async sendTemplate(to: string, templateName: string, languageCode: string = 'es', components: any[] = [], clienteId?: string) {
        if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
            console.warn("WhatsApp credentials missing. Running in DEMO mode.");
            return this.mockSend(to, `Template: ${templateName}`, clienteId);
        }

        try {
            const response = await fetch(WHATSAPP_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: to.replace(/\s+/g, ''),
                    type: 'template',
                    template: {
                        name: templateName,
                        language: { code: languageCode },
                        components: components
                    },
                }),
            });

            const data = await response.json();

            if (clienteId) {
                await this.logMessage(clienteId, `Template: ${templateName}`, data.messages?.[0]?.id || 'error', response.ok ? 'sent' : 'failed');
            }

            return data;
        } catch (error) {
            console.error("WhatsApp Error:", error);
            throw error;
        }
    },

    async logMessage(clienteId: string, content: string, messageId: string, status: string) {
        const { error } = await supabase
            .from('whatsapp_logs')
            .insert([{
                cliente_id: clienteId,
                message_id: messageId,
                content: content,
                status: status,
                created_at: new Date().toISOString()
            }]);

        if (error) console.error("Error logging WhatsApp message:", error);
    },

    async mockSend(to: string, text: string, clienteId?: string) {
        console.log(`[MOCK WHATSAPP] To: ${to}, Message: ${text}`);
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (clienteId) {
            await this.logMessage(clienteId, text, 'mock_' + Math.random().toString(36).substr(2, 9), 'sent');
        }

        return { success: true, message: "Demo mode: simulated success" };
    },

    openInApp(to: string, text: string) {
        const cleanNumber = to.replace(/\s+/g, '').replace('+', '');
        const encodedText = encodeURIComponent(text);
        const url = `https://wa.me/${cleanNumber}?text=${encodedText}`;
        window.open(url, '_blank');
    }
};
