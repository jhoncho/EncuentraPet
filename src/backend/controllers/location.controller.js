// src/backend/controllers/location.controller.js

const { getOne, runQuery } = require('../config/database');
exports.reportFoundPet = async (req, res) => {
    try {
        const { petCode, finderName, finderPhone, message, location } = req.body;
        
        // Buscar mascota por código
        const pet = await getOne(`
            SELECT p.id, p.name, p.user_id,
                   u.email, u.first_name, u.last_name, u.phone
            FROM pets p
            JOIN users u ON p.user_id = u.id
            WHERE p.pet_code = ? AND p.is_active = 1
        `, [petCode]);
        
        if (!pet) {
            return res.status(404).json({
                success: false,
                error: 'Mascota no encontrada'
            });
        }
        
        // Guardar reporte de ubicación
        await runQuery(`
            INSERT INTO pet_locations (
                pet_id, latitude, longitude, accuracy,
                found_by_name, found_by_phone, message,
                status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'reported', CURRENT_TIMESTAMP)
        `, [
            pet.id,
            location?.latitude || null,
            location?.longitude || null,
            location?.accuracy || null,
            finderName,
            finderPhone,
            message || null
        ]);
        
        console.log(`📍 Mascota reportada: ${pet.name} encontrada por ${finderName}`);
        
        // TODO: Enviar notificación al dueño (email/SMS)
        
        res.json({
            success: true,
            message: 'Reporte enviado exitosamente'
        });
        
    } catch (error) {
        console.error('Error reportando mascota encontrada:', error);
        res.status(500).json({
            success: false,
            error: 'Error al enviar el reporte'
        });
    }
};

exports.getPetLocations = async (req, res) => {
    // Implementación para obtener historial de ubicaciones
    res.json({ success: true, locations: [] });
};

exports.verifyLocation = async (req, res) => {
    res.json({ success: true, message: 'TODO: Implementar' });
};

exports.markReunited = async (req, res) => {
    res.json({ success: true, message: 'TODO: Implementar' });
};

exports.getPetLocations = async (req, res) => {
    res.json({ success: true, message: 'TODO: Implementar' });
};

exports.verifyLocation = async (req, res) => {
    res.json({ success: true, message: 'TODO: Implementar' });
};

exports.markReunited = async (req, res) => {
    res.json({ success: true, message: 'TODO: Implementar' });
};