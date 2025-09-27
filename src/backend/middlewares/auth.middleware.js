// src/backend/middlewares/auth.middleware.js - Middleware de autenticación
const jwt = require('jsonwebtoken');
const { getOne } = require('../config/database');

// Verificar token JWT
exports.authenticate = async (req, res, next) => {
    try {
        // Obtener token del header
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token de autenticación no proporcionado'
            });
        }

        // Verificar token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'encuentrapet-secret-2024'
        );

        // Buscar usuario
        const user = await getOne(
            'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = ?',
            [decoded.id]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                error: 'Cuenta desactivada'
            });
        }

        // Agregar usuario al request
        req.user = {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role
        };

        next();
    } catch (error) {
        console.error('Error en autenticación:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Token inválido'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expirado'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error en autenticación'
        });
    }
};

// Verificar si es admin
exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            error: 'Acceso denegado. Se requieren permisos de administrador.'
        });
    }
};

// Verificar si es veterinario
exports.isVet = (req, res, next) => {
    if (req.user && (req.user.role === 'vet' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403).json({
            success: false,
            error: 'Acceso denegado. Se requieren permisos de veterinario.'
        });
    }
};

// Middleware opcional: autenticar si hay token, pero no requerir
exports.optionalAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (token) {
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || 'encuentrapet-secret-2024'
            );
            
            const user = await getOne(
                'SELECT id, email, first_name, last_name, role FROM users WHERE id = ?',
                [decoded.id]
            );
            
            if (user && user.is_active) {
                req.user = {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role
                };
            }
        }
        
        next();
    } catch (error) {
        // Si hay error con el token, continuar sin usuario autenticado
        next();
    }
};