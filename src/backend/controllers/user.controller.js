// src/backend/controllers/user.controller.js
const { getOne, getAll, runQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

exports.getProfile = async (req, res) => {
    try {
        const user = await getOne(
            'SELECT id, email, first_name, last_name, phone, city, department FROM users WHERE id = ?',
            [req.user.id]
        );
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo perfil' });
    }
};

exports.updateProfile = async (req, res) => {
    res.json({ success: true, message: 'TODO: Implementar' });
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
        
        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo estadísticas' });
    }
};

exports.deleteAccount = async (req, res) => {
    res.json({ success: true, message: 'TODO: Implementar' });
};