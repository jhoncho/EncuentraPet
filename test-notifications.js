// test-notifications.js
require('dotenv').config();
const notificationService = require('./src/backend/services/notification.service');

async function testNotifications() {
    console.log('🧪 Probando notificaciones...\n');

    // Datos de prueba
    const pet = {
        id: 1,
        name: 'Max'
    };

    const owner = {
        email: 'jhondouglas.87@gmail.com', // TU EMAIL
        whatsapp: '59169977949', // TU NÚMERO (formato: 591 + código + número)
        name: 'Juan Pérez'
    };

    const scanData = {
        latitude: -16.5000,
        longitude: -68.1500
    };

    // Test 1: Notificación de escaneo QR
    console.log('📱 Test 1: Notificación de escaneo QR');
    const scanResults = await notificationService.notifyQRScan(pet, owner, scanData);
    console.log('Resultados:', JSON.stringify(scanResults, null, 2));

    console.log('\n⏳ Esperando 3 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 2: Notificación de reporte de ubicación
    console.log('📍 Test 2: Notificación de reporte de ubicación');
    const reportData = {
        finderName: 'María García',
        finderPhone: '59171234567',
        message: 'Encontré a tu mascota en el parque',
        latitude: -16.5000,
        longitude: -68.1500
    };

    const reportResults = await notificationService.notifyLocationReport(pet, owner, reportData);
    console.log('Resultados:', JSON.stringify(reportResults, null, 2));

    console.log('\n✅ Pruebas completadas');
}

testNotifications().catch(console.error);