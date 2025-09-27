// src/backend/controllers/auth.controller.js - Lógica de autenticación
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getOne, runQuery } = require('../config/database');

// Función para generar JWT
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET || 'encuentrapet-secret-2024',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Registro de usuario
exports.register = async (req, res) => {
    try {
        const {
            firstName, lastName, email, phone,
            password, address, city, department
        } = req.body;

        // Verificar si el email ya existe
        const existingUser = await getOne(
            'SELECT id FROM users WHERE email = ?',
            [email.toLowerCase()]
        );

        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Este correo electrónico ya está registrado'
            });
        }

        // Hashear contraseña
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insertar nuevo usuario
        const result = await runQuery(`
            INSERT INTO users (
                email, password, first_name, last_name,
                phone, whatsapp, address, city, department,
                country, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Bolivia', 1)
        `, [
            email.toLowerCase(),
            hashedPassword,
            firstName,
            lastName,
            phone,
            phone, // WhatsApp es el mismo número por defecto
            address,
            city,
            department
        ]);

        // Generar token
        const token = generateToken(result.id);

        // Actualizar último login
        await runQuery(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [result.id]
        );

        console.log(`✅ Nuevo usuario registrado: ${firstName} ${lastName} (${email})`);

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            userId: result.id,
            token,
            user: {
                id: result.id,
                firstName,
                lastName,
                email: email.toLowerCase()
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            error: 'Error al registrar el usuario'
        });
    }
};

// Login de usuario
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario
        const user = await getOne(
            `SELECT id, email, password, first_name, last_name, is_active 
             FROM users WHERE email = ?`,
            [email.toLowerCase()]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Correo o contraseña incorrectos'
            });
        }

        // Verificar si la cuenta está activa
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                error: 'Tu cuenta está desactivada. Contacta al soporte.'
            });
        }

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Correo o contraseña incorrectos'
            });
        }

        // Generar token
        const token = generateToken(user.id);

        // Actualizar último login
        await runQuery(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        console.log(`✅ Login exitoso: ${user.email}`);

        res.json({
            success: true,
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            error: 'Error al iniciar sesión'
        });
    }
};

// Verificar token
exports.verifyToken = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token no proporcionado'
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'encuentrapet-secret-2024'
        );

        // Obtener datos del usuario
        const user = await getOne(
            'SELECT id, email, first_name, last_name FROM users WHERE id = ?',
            [decoded.id]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Error verificando token:', error);
        res.status(401).json({
            success: false,
            error: 'Token inválido o expirado'
        });
    }
};

// Logout
exports.logout = (req, res) => {
    // El logout se maneja principalmente en el frontend
    // borrando el token del localStorage
    res.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
    });
};

// Olvidé mi contraseña
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Verificar si el usuario existe
        const user = await getOne(
            'SELECT id, first_name FROM users WHERE email = ?',
            [email.toLowerCase()]
        );

        if (!user) {
            // Por seguridad, no revelamos si el email existe o no
            return res.json({
                success: true,
                message: 'Si el email existe, recibirás instrucciones para resetear tu contraseña'
            });
        }

        // TODO: Implementar envío de email con token de reseteo
        // Por ahora solo simulamos el envío
        console.log(`📧 Email de reseteo enviado a: ${email}`);

        res.json({
            success: true,
            message: 'Si el email existe, recibirás instrucciones para resetear tu contraseña'
        });

    } catch (error) {
        console.error('Error en forgot password:', error);
        res.status(500).json({
            success: false,
            error: 'Error procesando la solicitud'
        });
    }
};

// Resetear contraseña
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // TODO: Implementar verificación de token de reseteo
        // Por ahora esta función es un placeholder

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error reseteando contraseña:', error);
        res.status(500).json({
            success: false,
            error: 'Error al resetear la contraseña'
        });
    }
};