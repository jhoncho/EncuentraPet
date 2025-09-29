// src/backend/controllers/pet.controller.js - Controlador de mascotas
const QRCode = require('qrcode');
const { getOne, getAll, runQuery } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar almacenamiento de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './uploads/pet-photos';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'pet-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
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

// Exportar el middleware
exports.uploadPhoto = upload.single('photo');

// Generar código único para mascota
function generatePetCode() {
    const prefix = 'PET';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}_${timestamp}${random}`;
}

// Registrar nueva mascota
exports.registerPet = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Obtener URL de la foto si se subió
        const photoUrl = req.file ? `/uploads/pet-photos/${req.file.filename}` : null;
        
        const {
            name, species, breed, sex, color,
            age_years, age_months, weight,
            microchip_code, health_card_number,
            sterilized, blood_type,
            allergies, medical_conditions, medications,
            special_care, veterinarian_name, veterinarian_phone,
            emergency_contact, emergency_phone,
            alert_email, alert_sms, alert_whatsapp,
            vaccination_reminders
        } = req.body;

        // Generar código único
        const petCode = generatePetCode();
        
        // URL de la página pública de la mascota
        const petUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/pet/${petCode}`;
        
        // Generar código QR
        const qrCodeDataURL = await QRCode.toDataURL(petUrl, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            errorCorrectionLevel: 'H'
        });

        // Insertar mascota en la base de datos
        const result = await runQuery(`
            INSERT INTO pets (
                user_id, pet_code, name, species, breed, sex, color,
                age_years, age_months, weight, microchip_code,
                health_card_number, sterilized, blood_type,
                allergies, medical_conditions, medications,
                special_care, veterinarian_name, veterinarian_phone,
                emergency_contact, emergency_phone, photo_url, qr_code,
                is_active, created_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?, ?,
                1, CURRENT_TIMESTAMP
            )
        `, [
            userId, petCode, name, species, breed || null, sex, color,
            age_years || null, age_months || null, weight || null, microchip_code || null,
            health_card_number || null, sterilized === 'true' ? 1 : 0, blood_type || null,
            allergies || null, medical_conditions || null, medications || null,
            special_care || null, veterinarian_name || null, veterinarian_phone || null,
            emergency_contact || null, emergency_phone || null, photoUrl, qrCodeDataURL
        ]);

        console.log(`✅ Nueva mascota registrada: ${name} (${petCode}) por usuario ${userId}`);

        res.status(201).json({
            success: true,
            message: 'Mascota registrada exitosamente',
            petId: result.id,
            petCode: petCode,
            qrCode: qrCodeDataURL,
            petUrl: petUrl
        });

    } catch (error) {
        console.error('Error registrando mascota:', error);
        res.status(500).json({
            success: false,
            error: 'Error al registrar la mascota: ' + error.message
        });
    }
};

// Obtener información pública de mascota (cuando escanean el QR)
exports.getPublicPetInfo = async (req, res) => {
    try {
        const { code } = req.params;
        
        // Buscar mascota por código
        const pet = await getOne(`
            SELECT 
                p.*,
                u.first_name as owner_first_name,
                u.last_name as owner_last_name,
                u.phone as owner_phone,
                u.whatsapp as owner_whatsapp,
                u.city as owner_city,
                u.department as owner_department
            FROM pets p
            JOIN users u ON p.user_id = u.id
            WHERE p.pet_code = ? AND p.is_active = 1
        `, [code]);

        if (!pet) {
            return res.status(404).json({
                success: false,
                error: 'Mascota no encontrada'
            });
        }

        // Registrar escaneo
        await runQuery(`
            INSERT INTO qr_scans (pet_id, ip_address, user_agent, scanned_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `, [
            pet.id,
            req.ip || 'unknown',
            req.headers['user-agent'] || 'unknown'
        ]);

        // Devolver información pública (sin datos sensibles del dueño)
        res.json({
            success: true,
            pet: {
                name: pet.name,
                species: pet.species,
                breed: pet.breed,
                sex: pet.sex,
                color: pet.color,
                age_years: pet.age_years,
                age_months: pet.age_months,
                photo_url: pet.photo_url,
                is_lost: pet.is_lost,
                // Información médica de emergencia
                allergies: pet.allergies,
                medical_conditions: pet.medical_conditions,
                medications: pet.medications,
                special_care: pet.special_care,
                blood_type: pet.blood_type,
                // Contacto veterinario (importante en emergencias)
                veterinarian_name: pet.veterinarian_name,
                veterinarian_phone: pet.veterinarian_phone,
                // Información básica del dueño
                owner: {
                    name: `${pet.owner_first_name} ${pet.owner_last_name}`,
                    city: pet.owner_city,
                    department: pet.owner_department,
                    phone: pet.owner_phone,
                    whatsapp: pet.owner_whatsapp
                }
            }
        });

    } catch (error) {
        console.error('Error obteniendo información pública:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener información de la mascota'
        });
    }
};

// Registrar escaneo de QR
exports.registerScan = async (req, res) => {
    try {
        const { code } = req.params;
        const { latitude, longitude } = req.body;
        
        // Buscar mascota
        const pet = await getOne('SELECT id, user_id FROM pets WHERE pet_code = ?', [code]);
        
        if (!pet) {
            return res.status(404).json({
                success: false,
                error: 'Mascota no encontrada'
            });
        }
        
        // Registrar escaneo con ubicación si está disponible
        await runQuery(`
            INSERT INTO qr_scans (pet_id, ip_address, user_agent, latitude, longitude, scanned_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
            pet.id,
            req.ip || 'unknown',
            req.headers['user-agent'] || 'unknown',
            latitude || null,
            longitude || null
        ]);
        
        // TODO: Enviar notificación al dueño
        
        res.json({
            success: true,
            message: 'Escaneo registrado'
        });
        
    } catch (error) {
        console.error('Error registrando escaneo:', error);
        res.status(500).json({
            success: false,
            error: 'Error al registrar escaneo'
        });
    }
};

// Obtener mascota por ID (para el dueño)
exports.getPetById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const pet = await getOne(
            'SELECT * FROM pets WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        
        if (!pet) {
            return res.status(404).json({
                success: false,
                error: 'Mascota no encontrada'
            });
        }
        
        res.json({
            success: true,
            pet
        });
        
    } catch (error) {
        console.error('Error obteniendo mascota:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener mascota'
        });
    }
};

// Actualizar mascota

// En pet.controller.js, reemplaza el método updatePet completo:
exports.updatePet = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        // Verificar que la mascota pertenece al usuario
        const pet = await getOne(
            'SELECT id, photo_url FROM pets WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        
        if (!pet) {
            return res.status(404).json({
                success: false,
                error: 'Mascota no encontrada'
            });
        }
        
        // Preparar campos para actualizar
        const updates = {};
        const allowedFields = [
            'name', 'species', 'breed', 'sex', 'color',
            'age_years', 'age_months', 'weight',
            'microchip_code', 'health_card_number',
            'blood_type', 'allergies', 'medical_conditions',
            'medications', 'special_care',
            'veterinarian_name', 'veterinarian_phone',
            'emergency_contact', 'emergency_phone'
        ];
        
        // Filtrar solo campos permitidos
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field] || null;
            }
        });
        
        // Manejar checkbox de esterilización
        if (req.body.sterilized !== undefined) {
            updates.sterilized = req.body.sterilized === 'true' ? 1 : 0;
        }
        
        // Si hay nueva foto
        if (req.file) {
            updates.photo_url = `/uploads/pet-photos/${req.file.filename}`;
            
            // Opcional: eliminar foto anterior
            if (pet.photo_url) {
                const oldPath = path.join(__dirname, '../..', pet.photo_url);
                fs.unlink(oldPath, (err) => {
                    if (err) console.log('No se pudo eliminar foto anterior:', err);
                });
            }
        }
        
        // Si no hay campos para actualizar
        if (Object.keys(updates).length === 0) {
            return res.json({
                success: true,
                message: 'No hay cambios para guardar'
            });
        }
        
        // Construir query de actualización
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(id); // Agregar ID al final para el WHERE
        
        await runQuery(
            `UPDATE pets SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            values
        );
        
        console.log(`✅ Mascota ${id} actualizada por usuario ${userId}`);
        
        res.json({
            success: true,
            message: 'Mascota actualizada exitosamente'
        });
        
    } catch (error) {
        console.error('Error actualizando mascota:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar mascota: ' + error.message
        });
    }
};

// También exporta el middleware con multer para update
exports.uploadPhotoUpdate = upload.single('photo');


// Eliminar mascota (soft delete)
exports.deletePet = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const result = await runQuery(
            'UPDATE pets SET is_active = 0 WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Mascota no encontrada'
            });
        }
        
        res.json({
            success: true,
            message: 'Mascota eliminada exitosamente'
        });
        
    } catch (error) {
        console.error('Error eliminando mascota:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar mascota'
        });
    }
};

// Marcar como perdida
exports.markAsLost = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        await runQuery(
            'UPDATE pets SET is_lost = 1 WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        
        res.json({
            success: true,
            message: 'Mascota marcada como perdida'
        });
        
    } catch (error) {
        console.error('Error marcando como perdida:', error);
        res.status(500).json({
            success: false,
            error: 'Error al marcar como perdida'
        });
    }
};

// Marcar como encontrada
exports.markAsFound = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        await runQuery(
            'UPDATE pets SET is_lost = 0 WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        
        res.json({
            success: true,
            message: 'Mascota marcada como encontrada'
        });
        
    } catch (error) {
        console.error('Error marcando como encontrada:', error);
        res.status(500).json({
            success: false,
            error: 'Error al marcar como encontrada'
        });
    }
};

// Agregar vacunación
exports.addVaccination = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const {
            vaccine_id, vaccination_date, next_dose_date,
            dose_number, batch_number, veterinarian_name,
            clinic_name, notes
        } = req.body;
        
        // Verificar que la mascota pertenece al usuario
        const pet = await getOne(
            'SELECT id FROM pets WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        
        if (!pet) {
            return res.status(404).json({
                success: false,
                error: 'Mascota no encontrada'
            });
        }
        
        await runQuery(`
            INSERT INTO vaccination_records (
                pet_id, vaccine_id, vaccination_date, next_dose_date,
                dose_number, batch_number, veterinarian_name,
                clinic_name, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
            id, vaccine_id, vaccination_date, next_dose_date,
            dose_number || 1, batch_number, veterinarian_name,
            clinic_name, notes
        ]);
        
        res.json({
            success: true,
            message: 'Vacunación registrada exitosamente'
        });
        
    } catch (error) {
        console.error('Error registrando vacunación:', error);
        res.status(500).json({
            success: false,
            error: 'Error al registrar vacunación'
        });
    }
};

// Obtener historial de vacunación
exports.getVaccinations = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        // Verificar que la mascota pertenece al usuario
        const pet = await getOne(
            'SELECT id FROM pets WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        
        if (!pet) {
            return res.status(404).json({
                success: false,
                error: 'Mascota no encontrada'
            });
        }
        
        const vaccinations = await getAll(`
            SELECT 
                vr.*,
                v.name as vaccine_name,
                v.description as vaccine_description
            FROM vaccination_records vr
            JOIN vaccines v ON vr.vaccine_id = v.id
            WHERE vr.pet_id = ?
            ORDER BY vr.vaccination_date DESC
        `, [id]);
        
        res.json({
            success: true,
            vaccinations
        });
        
    } catch (error) {
        console.error('Error obteniendo vacunaciones:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener vacunaciones'
        });
    }
};

// Regenerar QR
exports.regenerateQR = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        // Obtener mascota
        const pet = await getOne(
            'SELECT pet_code FROM pets WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        
        if (!pet) {
            return res.status(404).json({
                success: false,
                error: 'Mascota no encontrada'
            });
        }
        
        // Generar nuevo QR
        const petUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/pet/${pet.pet_code}`;
        const qrCodeDataURL = await QRCode.toDataURL(petUrl, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            errorCorrectionLevel: 'H'
        });
        
        // Actualizar en base de datos
        await runQuery(
            'UPDATE pets SET qr_code = ? WHERE id = ?',
            [qrCodeDataURL, id]
        );
        
        res.json({
            success: true,
            qrCode: qrCodeDataURL
        });
        
    } catch (error) {
        console.error('Error regenerando QR:', error);
        res.status(500).json({
            success: false,
            error: 'Error al regenerar código QR'
        });
    }
};

// Agregar ruta específica para actualizar foto
exports.updatePhoto = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const photoUrl = req.file ? `/uploads/pet-photos/${req.file.filename}` : null;
        
        if (!photoUrl) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionó foto'
            });
        }
        
        // Verificar que la mascota pertenece al usuario
        const pet = await getOne(
            'SELECT id, photo_url FROM pets WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        
        if (!pet) {
            return res.status(404).json({
                success: false,
                error: 'Mascota no encontrada'
            });
        }
        
        // Eliminar foto anterior si existe
        if (pet.photo_url) {
            const oldPath = path.join(__dirname, '../..', pet.photo_url);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }
        
        // Actualizar URL de foto
        await runQuery(
            'UPDATE pets SET photo_url = ? WHERE id = ?',
            [photoUrl, id]
        );
        
        res.json({
            success: true,
            message: 'Foto actualizada',
            photoUrl
        });
        
    } catch (error) {
        console.error('Error actualizando foto:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar foto'
        });
    }
};