// src/backend/routes/user.routes.js - Rutas de usuario
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticate);

// Obtener perfil del usuario actual
// GET /api/users/profile
router.get('/profile', userController.getProfile);

// Actualizar perfil del usuario
// PUT /api/users/profile
router.put('/profile', userController.updateProfile);

// Cambiar contraseña
// PUT /api/users/change-password
router.put('/change-password', userController.changePassword);

// Obtener todas las mascotas del usuario
// GET /api/users/pets
router.get('/pets', userController.getUserPets);

// Obtener estadísticas del usuario
// GET /api/users/stats
router.get('/stats', userController.getUserStats);

// Eliminar cuenta (soft delete)
// DELETE /api/users/account
router.delete('/account', userController.deleteAccount);

module.exports = router;