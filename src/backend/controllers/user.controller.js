// src/backend/controllers/user.controller.js
const { getOne, getAll, runQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

exports.getProfile = async (req, res) => {
    try {
        const user = await getOne(
            'SELECT id, email, first_name, last_name, phone, whatsapp, address, city, department FROM users WHERE id = ?',
            [req.user.id]
        );
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'Usuario no encontrado' 
            });
        }
        
        res.json({ success: true, user });
    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error obteniendo perfil' 
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, whatsapp, address, city, department } = req.body;
        
        // Validaciones básicas
        if (!firstName || !lastName || !email || !phone || !city || !department) {
            return res.status(400).json({ 
                success: false, 
                error: 'Faltan campos requeridos' 
            });
        }

        // Verificar si el email ya existe (si cambió)
        const existingUser = await getOne(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [email, req.user.id]
        );

        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                error: 'El email ya está en uso por otro usuario' 
            });
        }

        // Actualizar perfil
        await runQuery(`
            UPDATE users 
            SET 
                first_name = ?,
                last_name = ?,
                email = ?,
                phone = ?,
                whatsapp = ?,
                address = ?,
                city = ?,
                department = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            firstName,
            lastName,
            email,
            phone,
            whatsapp || null,
            address || null,
            city,
            department,
            req.user.id
        ]);

        // Obtener datos actualizados
        const updatedUser = await getOne(
            'SELECT id, email, first_name, last_name, phone, whatsapp, address, city, department FROM users WHERE id = ?',
            [req.user.id]
        );

        res.json({ 
            success: true, 
            message: 'Perfil actualizado correctamente',
            user: updatedUser
        });

    } catch (error) {
        console.error('Error actualizando perfil:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al actualizar el perfil' 
        });
    }
};

exports.changePassword = async (req, res) => {
    res.json({ success: true, message: 'TODO: Implementar' });
};

exports.getUserPets = async (req, res) => {
    try {
        const pets = await getAll(
            'SELECT * FROM pets WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json({ success: true, pets });
    } catch (error) {
        console.error('Error obteniendo mascotas:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener las mascotas' 
        });
    }
};

exports.getUserStats = async (req, res) => {
    try {
        const stats = await getOne(`
            SELECT 
                COUNT(DISTINCT p.id) as total_pets,
                SUM(CASE WHEN p.is_lost = 1 THEN 1 ELSE 0 END) as lost_pets,
                COUNT(DISTINCT qs.id) as total_scans
            FROM pets p
            LEFT JOIN qr_scans qs ON p.id = qs.pet_id
            WHERE p.user_id = ? AND p.is_active = 1
        `, [req.user.id]);
        
        res.json({ 
            success: true, 
            stats: {
                total_pets: stats.total_pets || 0,
                lost_pets: stats.lost_pets || 0,
                total_scans: stats.total_scans || 0
            }
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error obteniendo estadísticas' 
        });
    }
};

exports.deleteAccount = async (req, res) => {
    res.json({ success: true, message: 'TODO: Implementar' });
};