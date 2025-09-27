// server.js - Archivo principal del servidor EncuentraPet
require('dotenv').config();
const app = require('./src/backend/app');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Iniciar servidor
const server = app.listen(PORT, () => {
    console.log('====================================');
    console.log('🐾 EncuentraPet Server');
    console.log('====================================');
    console.log(`✅ Servidor corriendo en: http://${HOST}:${PORT}`);
    console.log(`📁 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 JWT configurado: ${process.env.JWT_SECRET ? 'Sí' : 'No'}`);
    console.log(`📧 Email configurado: ${process.env.SMTP_USER ? 'Sí' : 'No'}`);
    console.log('====================================');
    console.log('Endpoints disponibles:');
    console.log(`   GET  ${HOST}:${PORT}/             (Landing page)`);
    console.log(`   GET  ${HOST}:${PORT}/signup       (Registro usuario)`);
    console.log(`   GET  ${HOST}:${PORT}/register-pet (Registro mascota)`);
    console.log(`   GET  ${HOST}:${PORT}/pet/:code    (Página pública mascota)`);
    console.log('====================================');
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
    console.log('SIGTERM recibido, cerrando servidor...');
    server.close(() => {
        console.log('Servidor cerrado correctamente');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\nSIGINT recibido, cerrando servidor...');
    server.close(() => {
        console.log('Servidor cerrado correctamente');
        process.exit(0);
    });
});

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
    console.error('Error no capturado:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('Promesa rechazada no manejada:', err);
    process.exit(1);
});