// src/backend/services/whatsapp.service.js
const axios = require('axios');

const WHATSAPP_API_URL = `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v21.0'}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

// Enviar mensaje de texto
exports.sendTextMessage = async (to, message) => {
    try {
        if (!process.env.WHATSAPP_API_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
            console.log('⚠️ WhatsApp no configurado');
            return { success: false, error: 'WhatsApp no configurado' };
        }

        // Limpiar número: solo dígitos, sin + ni espacios
        const cleanNumber = to.replace(/\D/g, '');

        const response = await axios.post(
            WHATSAPP_API_URL,
            {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: cleanNumber,
                type: 'text',
                text: {
                    preview_url: true,
                    body: message
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ WhatsApp enviado:', response.data);
        return { success: true, data: response.data };

    } catch (error) {
        console.error('❌ Error enviando WhatsApp:', error.response?.data || error.message);
        return { 
            success: false, 
            error: error.response?.data?.error?.message || error.message 
        };
    }
};

// Enviar mensaje con ubicación
exports.sendLocationMessage = async (to, latitude, longitude, name, address) => {
    try {
        if (!process.env.WHATSAPP_API_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
            console.log('⚠️ WhatsApp no configurado');
            return { success: false, error: 'WhatsApp no configurado' };
        }

        const cleanNumber = to.replace(/\D/g, '');

        const response = await axios.post(
            WHATSAPP_API_URL,
            {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: cleanNumber,
                type: 'location',
                location: {
                    latitude: latitude.toString(),
                    longitude: longitude.toString(),
                    name: name || 'Ubicación de tu mascota',
                    address: address || 'Ubicación donde fue encontrada'
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ WhatsApp con ubicación enviado:', response.data);
        return { success: true, data: response.data };

    } catch (error) {
        console.error('❌ Error enviando ubicación por WhatsApp:', error.response?.data || error.message);
        return { 
            success: false, 
            error: error.response?.data?.error?.message || error.message 
        };
    }
};

// Enviar mensaje con template (para casos especiales)
exports.sendTemplateMessage = async (to, templateName, languageCode = 'es') => {
    try {
        if (!process.env.WHATSAPP_API_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
            console.log('⚠️ WhatsApp no configurado');
            return { success: false, error: 'WhatsApp no configurado' };
        }

        const cleanNumber = to.replace(/\D/g, '');

        const response = await axios.post(
            WHATSAPP_API_URL,
            {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: cleanNumber,
                type: 'template',
                template: {
                    name: templateName,
                    language: {
                        code: languageCode
                    }
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Template WhatsApp enviado:', response.data);
        return { success: true, data: response.data };

    } catch (error) {
        console.error('❌ Error enviando template WhatsApp:', error.response?.data || error.message);
        return { 
            success: false, 
            error: error.response?.data?.error?.message || error.message 
        };
    }
};