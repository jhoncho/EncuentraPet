// src/backend/routes/pet.routes.js - Rutas de mascotas
const express = require('express');
const router = express.Router();
const petController = require('../controllers/pet.controller');
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');
const { validatePet } = require('../middlewares/validate.middleware');


// Rutas públicas (no requieren autenticación)
// Obtener información pública de mascota por código
// GET /api/pets/public/:code
router.get('/public/:code', petController.getPublicPetInfo);

// Registrar escaneo de QR
// POST /api/pets/scan/:code
router.post('/scan/:code', petController.registerScan);

// Rutas protegidas (requieren autenticación)
// Registrar nueva mascota
// POST /api/pets/register
router.post('/register', 
    authenticate, 
    petController.uploadPhoto, // Agregar esto
    validatePet, 
    petController.registerPet
);
// Actualizar foto de mascota
router.put('/:id/photo', authenticate, petController.uploadPhoto, petController.updatePhoto);


// Obtener mascota por ID
// GET /api/pets/:id
router.get('/:id', authenticate, petController.getPetById);

// Actualizar mascota
// PUT /api/pets/:id
router.put('/:id', 
    authenticate, 
    petController.uploadPhoto,  // Agregar el middleware de upload
    petController.updatePet
);
router.get('/:id', authenticate, petController.getPetById);
// Eliminar mascota (soft delete)
// DELETE /api/pets/:id
router.delete('/:id', authenticate, petController.deletePet);

// Marcar mascota como perdida
// POST /api/pets/:id/lost
router.post('/:id/lost', authenticate, petController.markAsLost);

// Marcar mascota como encontrada
// POST /api/pets/:id/found
router.post('/:id/found', authenticate, petController.markAsFound);

// Agregar registro de vacunación
// POST /api/pets/:id/vaccination
router.post('/:id/vaccination', authenticate, petController.addVaccination);

// Obtener historial de vacunación
// GET /api/pets/:id/vaccinations
router.get('/:id/vaccinations', authenticate, petController.getVaccinations);

// Generar nuevo QR
// POST /api/pets/:id/regenerate-qr
router.post('/:id/regenerate-qr', authenticate, petController.regenerateQR);

// Obtener estadísticas de escaneos de una mascota
// GET /api/pets/:id/scans
router.get('/:id/scans', authenticate, petController.getPetScans);

module.exports = router;