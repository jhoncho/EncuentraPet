// src/backend/controllers/location.controller.js
const { getOne, getAll, runQuery } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar almacenamiento para fotos de ubicación
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './uploads/location-photos';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'location-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB por foto
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes'));
        }
    }
});

// EXPORTAR middleware de multer
exports.uploadLocationPhotos = upload.array('photos', 4);

// Reportar mascota encontrada
exports.reportFoundPet = async (req, res) => {
    try {
        const { petCode, latitude, longitude, accuracy, finderName, finderPhone, finderEmail, message } = req.body;
        
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
        const result = await runQuery(`
            INSERT INTO pet_locations (
                pet_id, latitude, longitude, accuracy,
                found_by_name, found_by_phone, message,
                status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'reported', CURRENT_TIMESTAMP)
        `, [
            pet.id,
            latitude || null,
            longitude || null,
            accuracy || null,
            finderName || null,
            finderPhone || null,
            message || null
        ]);
        
        // Guardar fotos si existen
        let photoCount = 0;
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                await runQuery(`
                    INSERT INTO location_photos (location_id, photo_url, created_at)
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                `, [result.lastID, `/uploads/location-photos/${file.filename}`]);
                photoCount++;
            }
        }
        
        console.log(`📍 Mascota reportada: ${pet.name} encontrada por ${finderName || 'Anónimo'}`);
        
        res.json({
            success: true,
            message: 'Reporte enviado exitosamente',
            photosUploaded: photoCount
        });
        
    } catch (error) {
        console.error('Error reportando mascota encontrada:', error);
        res.status(500).json({
            success: false,
            error: 'Error al enviar el reporte'
        });
    }
};

// Obtener ubicaciones de una mascota
exports.getPetLocations = async (req, res) => {
    try {
        const { petId } = req.params;
        const userId = req.user.id;
        
        // Verificar que la mascota pertenece al usuario
        const pet = await getOne(
            'SELECT id FROM pets WHERE id = ? AND user_id = ?',
            [petId, userId]
        );
        
        if (!pet) {
            return res.status(404).json({
                success: false,
                error: 'Mascota no encontrada'
            });
        }
        
        // Obtener ubicaciones
        const locations = await getAll(`
            SELECT * FROM pet_locations
            WHERE pet_id = ?
            ORDER BY created_at DESC
        `, [petId]);
        
        res.json({
            success: true,
            locations
        });
        
    } catch (error) {
        console.error('Error obteniendo ubicaciones:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener ubicaciones'
        });
    }
};

// Marcar ubicación como verificada
exports.verifyLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        await runQuery(
            "UPDATE pet_locations SET status = 'verified' WHERE id = ?",
            [id]
        );
        
        res.json({
            success: true,
            message: 'Ubicación verificada'
        });
        
    } catch (error) {
        console.error('Error verificando ubicación:', error);
        res.status(500).json({
            success: false,
            error: 'Error al verificar ubicación'
        });
    }
};

// Marcar mascota como reunida
exports.markReunited = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const location = await getOne(
            'SELECT pet_id FROM pet_locations WHERE id = ?',
            [id]
        );
        
        if (!location) {
            return res.status(404).json({
                success: false,
                error: 'Ubicación no encontrada'
            });
        }
        
        await runQuery(
            "UPDATE pet_locations SET status = 'reunited' WHERE id = ?",
            [id]
        );
        
        await runQuery(
            'UPDATE pets SET is_lost = 0 WHERE id = ?',
            [location.pet_id]
        );
        
        res.json({
            success: true,
            message: 'Mascota marcada como reunida'
        });
        
    } catch (error) {
        console.error('Error marcando como reunida:', error);
        res.status(500).json({
            success: false,
            error: 'Error al marcar como reunida'
        });
    }
};