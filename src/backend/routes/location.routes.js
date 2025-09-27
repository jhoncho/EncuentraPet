// src/backend/routes/location.routes.js - Rutas de ubicación y notificaciones
const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');

// Rutas públicas (para quien encuentra la mascota)
// Reportar mascota encontrada
// POST /api/locations/report
router.post('/report', locationController.reportFoundPet);

// Obtener ubicaciones de una mascota (requiere autenticación)
// GET /api/locations/pet/:petId
router.get('/pet/:petId', authenticate, locationController.getPetLocations);

// Marcar ubicación como verificada
// PUT /api/locations/:id/verify
router.put('/:id/verify', authenticate, locationController.verifyLocation);

// Marcar mascota como reunida
// PUT /api/locations/:id/reunited
router.put('/:id/reunited', authenticate, locationController.markReunited);

module.exports = router;