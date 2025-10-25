// src/backend/services/notification.service.js
const nodemailer = require('nodemailer');
const whatsappService = require('./whatsapp.service');

// Configurar transporter de email
const emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Enviar email de notificación
exports.sendEmailNotification = async (to, subject, html) => {
    try {
        if (!process.env.SMTP_USER) {
            console.log('⚠️ Email no configurado, saltando envío');
            return { success: false, error: 'Email no configurado' };
        }

        const info = await emailTransporter.sendMail({
            from: `"EncuentraPet" <${process.env.SMTP_USER}>`,
            to: to,
            subject: subject,
            html: html
        });

        console.log('✅ Email enviado:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error enviando email:', error);
        return { success: false, error: error.message };
    }
};

// Notificación cuando escanean QR
exports.notifyQRScan = async (pet, owner, scanData) => {
    const notifications = [];
    const petName = pet.name;
    const scanTime = new Date().toLocaleString('es-BO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Email
    if (owner.email) {
        const location = scanData.latitude && scanData.longitude 
            ? `https://www.google.com/maps?q=${scanData.latitude},${scanData.longitude}`
            : null;

        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                    .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
                    .info-box { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border: 1px solid #dee2e6; }
                    .button { display: inline-block; background: #4ecdc4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🚨 Alerta de Escaneo QR</h1>
                    <p>Tu mascota ${petName} ha sido encontrada</p>
                </div>
                <div class="content">
                    <div class="alert-box">
                        <strong>¡Buenas noticias!</strong> Alguien acaba de escanear el código QR de ${petName}.
                    </div>
                    
                    <div class="info-box">
                        <h3>📋 Detalles del Escaneo:</h3>
                        <p><strong>Mascota:</strong> ${petName}</p>
                        <p><strong>Fecha y hora:</strong> ${scanTime}</p>
                        ${location ? `<p><strong>Ubicación:</strong> <a href="${location}" target="_blank">Ver en Google Maps</a></p>` : ''}
                    </div>

                    <center>
                        <a href="${process.env.BASE_URL || 'http://localhost:3000'}/dashboard" class="button">
                            Ver Dashboard
                        </a>
                    </center>
                </div>
            </body>
            </html>
        `;

        const emailResult = await this.sendEmailNotification(
            owner.email,
            `🚨 Alguien encontró a ${petName}!`,
            emailHtml
        );
        notifications.push({ type: 'email', ...emailResult });
    }

    // WhatsApp
    if (owner.whatsapp) {
        const whatsappMessage = `🚨 *EncuentraPet - Alerta*

¡Alguien acaba de escanear el código QR de *${petName}*!

📅 *Fecha:* ${scanTime}

La persona que encontró a ${petName} puede ver tu información de contacto. Es posible que te contacte pronto.

Ver dashboard: ${process.env.BASE_URL || 'http://localhost:3000'}/dashboard`;

        // Enviar mensaje de texto
        const textResult = await whatsappService.sendTextMessage(
            owner.whatsapp,
            whatsappMessage
        );
        notifications.push({ type: 'whatsapp_text', ...textResult });

        // Si hay ubicación, enviar también mensaje con ubicación
        if (scanData.latitude && scanData.longitude) {
            const locationResult = await whatsappService.sendLocationMessage(
                owner.whatsapp,
                scanData.latitude,
                scanData.longitude,
                `${petName} fue encontrada aquí`,
                'Ubicación donde escanearon el QR'
            );
            notifications.push({ type: 'whatsapp_location', ...locationResult });
        }
    }

    return notifications;
};

// Notificación cuando reportan ubicación
exports.notifyLocationReport = async (pet, owner, reportData) => {
    const notifications = [];
    const petName = pet.name;
    const finderName = reportData.finderName || 'Alguien';
    const finderPhone = reportData.finderPhone || 'No proporcionado';
    const message = reportData.message || 'Sin mensaje adicional';
    const reportTime = new Date().toLocaleString('es-BO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Email
    if (owner.email) {
        const location = reportData.latitude && reportData.longitude 
            ? `https://www.google.com/maps?q=${reportData.latitude},${reportData.longitude}`
            : null;

        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
                    .header { background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                    .alert-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px; }
                    .info-box { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border: 1px solid #dee2e6; }
                    .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🎉 ¡${petName} fue reportada!</h1>
                    <p>Alguien encontró a tu mascota</p>
                </div>
                <div class="content">
                    <div class="alert-box">
                        <strong>¡Excelente noticia!</strong> ${finderName} ha reportado haber encontrado a ${petName}.
                    </div>
                    
                    <div class="info-box">
                        <h3>👤 Información del Contacto:</h3>
                        <p><strong>Nombre:</strong> ${finderName}</p>
                        <p><strong>Teléfono:</strong> <a href="tel:${finderPhone}">${finderPhone}</a></p>
                        <p><strong>Mensaje:</strong> ${message}</p>
                        <p><strong>Hora del reporte:</strong> ${reportTime}</p>
                        ${location ? `<p><strong>Ubicación:</strong> <a href="${location}" target="_blank">Ver en Google Maps</a></p>` : ''}
                    </div>

                    <center>
                        <a href="tel:${finderPhone}" class="button">Llamar Ahora</a>
                    </center>
                </div>
            </body>
            </html>
        `;

        const emailResult = await this.sendEmailNotification(
            owner.email,
            `🎉 ${finderName} encontró a ${petName}!`,
            emailHtml
        );
        notifications.push({ type: 'email', ...emailResult });
    }

    // WhatsApp
    if (owner.whatsapp) {
        const whatsappMessage = `🎉 *EncuentraPet - ${petName} fue encontrada!*

*${finderName}* ha reportado haber encontrado a ${petName}.

👤 *Información de contacto:*
📱 Teléfono: ${finderPhone}
💬 Mensaje: ${message}
⏰ Hora: ${reportTime}

¡Comunícate lo antes posible!`;

        // Enviar mensaje de texto
        const textResult = await whatsappService.sendTextMessage(
            owner.whatsapp,
            whatsappMessage
        );
        notifications.push({ type: 'whatsapp_text', ...textResult });

        // Enviar ubicación si está disponible
        if (reportData.latitude && reportData.longitude) {
            const locationResult = await whatsappService.sendLocationMessage(
                owner.whatsapp,
                reportData.latitude,
                reportData.longitude,
                `${finderName} encontró a ${petName} aquí`,
                'Ubicación donde fue encontrada tu mascota'
            );
            notifications.push({ type: 'whatsapp_location', ...locationResult });
        }
    }

    return notifications;
};