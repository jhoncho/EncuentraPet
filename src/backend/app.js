// src/backend/app.js - Configuración principal de Express
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Inicializar Express
const app = express();

// Configuración de seguridad con Helmet
app.use(helmet({
    contentSecurityPolicy: false, // Deshabilitado para permitir inline scripts
    crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // límite de 100 requests por IP
});
app.use('/api/', limiter);

// Middlewares para parsear JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const petRoutes = require('./routes/pet.routes');
const locationRoutes = require('./routes/location.routes');

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/locations', locationRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Rutas de páginas HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/signup.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/login.html'));
});

app.get('/register-pet', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/register-pet.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/dashboard.html'));
});

app.get('/pet/:code', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/pet-profile.html'));
});

// Ruta para el panel de administración
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/admin/index.html'));
});



// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        error: 'Ruta no encontrada' 
    });
});

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Error interno del servidor'
    });
});

module.exports = app;