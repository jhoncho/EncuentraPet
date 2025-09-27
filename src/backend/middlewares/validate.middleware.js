// src/backend/middlewares/validate.middleware.js - Middleware de validación

// Función helper para validar email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validar registro de usuario
exports.validateRegister = (req, res, next) => {
    const {
        firstName, lastName, email, phone,
        password, confirmPassword, address, city, department
    } = req.body;

    const errors = [];

    // Validar campos requeridos
    if (!firstName || firstName.trim().length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
    }

    if (!lastName || lastName.trim().length < 2) {
        errors.push('El apellido debe tener al menos 2 caracteres');
    }

    if (!email || !isValidEmail(email)) {
        errors.push('Email inválido');
    }

    if (!phone || phone.length < 8) {
        errors.push('Número de teléfono inválido');
    }

    if (!password || password.length < 8) {
        errors.push('La contraseña debe tener al menos 8 caracteres');
    }

    if (password !== confirmPassword) {
        errors.push('Las contraseñas no coinciden');
    }

    if (!address || address.trim().length < 5) {
        errors.push('La dirección es muy corta');
    }

    if (!city) {
        errors.push('Debes seleccionar una ciudad');
    }

    if (!department) {
        errors.push('Debes seleccionar un departamento');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: errors.join('. ')
        });
    }

    next();
};

// Validar login
exports.validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    const errors = [];

    if (!email || !isValidEmail(email)) {
        errors.push('Email inválido');
    }

    if (!password) {
        errors.push('La contraseña es requerida');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: errors.join('. ')
        });
    }

    next();
};

// Validar registro de mascota
exports.validatePet = (req, res, next) => {
    const { name, species, color } = req.body;
    
    const errors = [];
    
    if (!name || name.trim().length < 2) {
        errors.push('El nombre de la mascota debe tener al menos 2 caracteres');
    }
    
    if (!species) {
        errors.push('Debes seleccionar la especie');
    }
    
    if (!color || color.trim().length < 2) {
        errors.push('El color es requerido');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: errors.join('. ')
        });
    }
    
    next();
};