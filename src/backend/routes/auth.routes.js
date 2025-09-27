// src/backend/routes/auth.routes.js - Rutas de autenticación
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateRegister, validateLogin } = require('../middlewares/validate.middleware');

// Ruta para registro de usuario
// POST /api/auth/register
router.post('/register', validateRegister, authController.register);

// Ruta para login
// POST /api/auth/login
router.post('/login', validateLogin, authController.login);

// Ruta para verificar token
// GET /api/auth/verify
router.get('/verify', authController.verifyToken);

// Ruta para logout (opcional, principalmente limpia el frontend)
// POST /api/auth/logout
router.post('/logout', authController.logout);

// Ruta para recuperar contraseña
// POST /api/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

// Ruta para resetear contraseña
// POST /api/auth/reset-password
router.post('/reset-password', authController.resetPassword);

module.exports = router;