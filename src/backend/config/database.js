// src/backend/config/database.js - Configuración y conexión a SQLite
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ruta de la base de datos
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../../database/encuentrapet.db');
const DB_DIR = path.dirname(DB_PATH);

// Crear directorio si no existe
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    console.log('📁 Directorio de base de datos creado');
}

// Crear conexión a la base de datos
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Conectado a la base de datos SQLite');
        console.log(`📍 Ubicación: ${DB_PATH}`);
        initializeDatabase();
    }
});

// Función para inicializar las tablas
function initializeDatabase() {
    // Habilitar foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Tabla de usuarios
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            whatsapp TEXT,
            address TEXT,
            city TEXT DEFAULT 'La Paz',
            department TEXT DEFAULT 'La Paz',
            country TEXT DEFAULT 'Bolivia',
            role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin', 'vet')),
            email_verified BOOLEAN DEFAULT 0,
            is_active BOOLEAN DEFAULT 1,
            last_login DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creando tabla users:', err);
        } else {
            console.log('✅ Tabla users verificada');
        }
    });

    // Tabla de mascotas
    db.run(`
        CREATE TABLE IF NOT EXISTS pets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            pet_code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            species TEXT NOT NULL CHECK(species IN ('Perro', 'Gato', 'Conejo', 'Ave', 'Otro')),
            breed TEXT,
            sex TEXT CHECK(sex IN ('Macho', 'Hembra')),
            color TEXT,
            birth_date DATE,
            age_years INTEGER,
            age_months INTEGER,
            weight REAL,
            microchip_code TEXT UNIQUE,
            sterilized BOOLEAN DEFAULT 0,
            sterilization_code TEXT,
            sterilization_date DATE,
            blood_type TEXT,
            allergies TEXT,
            medical_conditions TEXT,
            medications TEXT,
            special_care TEXT,
            veterinarian_name TEXT,
            veterinarian_phone TEXT,
            emergency_contact TEXT,
            emergency_phone TEXT,
            photo_url TEXT,
            qr_code TEXT NOT NULL,
            health_card_number TEXT,
            is_lost BOOLEAN DEFAULT 0,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creando tabla pets:', err);
        } else {
            console.log('✅ Tabla pets verificada');
        }
    });

    // Tabla de vacunas
    db.run(`
        CREATE TABLE IF NOT EXISTS vaccines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            name_commercial TEXT,
            species TEXT NOT NULL,
            required BOOLEAN DEFAULT 0,
            frequency_months INTEGER,
            description TEXT,
            is_active BOOLEAN DEFAULT 1,
            UNIQUE(name, species)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creando tabla vaccines:', err);
        } else {
            console.log('✅ Tabla vaccines verificada');
            insertDefaultVaccines();
        }
    });

    // Tabla de registro de vacunación
    db.run(`
        CREATE TABLE IF NOT EXISTS vaccination_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pet_id INTEGER NOT NULL,
            vaccine_id INTEGER NOT NULL,
            vaccination_date DATE NOT NULL,
            next_dose_date DATE,
            dose_number INTEGER DEFAULT 1,
            batch_number TEXT,
            manufacturer TEXT,
            veterinarian_name TEXT NOT NULL,
            veterinarian_license TEXT,
            clinic_name TEXT,
            notes TEXT,
            certificate_number TEXT,
            is_verified BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
            FOREIGN KEY (vaccine_id) REFERENCES vaccines(id)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creando tabla vaccination_records:', err);
        } else {
            console.log('✅ Tabla vaccination_records verificada');
        }
    });

    // Tabla de ubicaciones
    db.run(`
        CREATE TABLE IF NOT EXISTS pet_locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pet_id INTEGER NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            accuracy REAL,
            address TEXT,
            city TEXT,
            department TEXT,
            found_by_name TEXT,
            found_by_phone TEXT NOT NULL,
            found_by_email TEXT,
            message TEXT,
            status TEXT DEFAULT 'reported' CHECK(status IN ('reported', 'verified', 'reunited')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creando tabla pet_locations:', err);
        } else {
            console.log('✅ Tabla pet_locations verificada');
        }
    });

    // Tabla de escaneos QR
    db.run(`
        CREATE TABLE IF NOT EXISTS qr_scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pet_id INTEGER NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            latitude REAL,
            longitude REAL,
            scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creando tabla qr_scans:', err);
        } else {
            console.log('✅ Tabla qr_scans verificada');
        }
    });

    // Crear índices
    db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    db.run('CREATE INDEX IF NOT EXISTS idx_pets_user ON pets(user_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_pets_code ON pets(pet_code)');
    db.run('CREATE INDEX IF NOT EXISTS idx_pets_lost ON pets(is_lost)');
    db.run('CREATE INDEX IF NOT EXISTS idx_locations_pet ON pet_locations(pet_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_qr_scans_pet ON qr_scans(pet_id)');
}

// Insertar vacunas por defecto para Bolivia
function insertDefaultVaccines() {
    const vaccines = [
        // Vacunas para perros
        { name: 'Antirrábica', species: 'Perro', required: 1, frequency: 12, description: 'Vacuna obligatoria contra la rabia' },
        { name: 'Parvovirus', species: 'Perro', required: 1, frequency: 12, description: 'Protección contra parvovirus canino' },
        { name: 'Moquillo', species: 'Perro', required: 1, frequency: 12, description: 'Protección contra distemper canino' },
        { name: 'Hepatitis', species: 'Perro', required: 1, frequency: 12, description: 'Protección contra hepatitis infecciosa' },
        { name: 'Séxtuple', species: 'Perro', required: 1, frequency: 12, description: 'Vacuna combinada séxtuple' },
        { name: 'Bordetella', species: 'Perro', required: 0, frequency: 6, description: 'Protección contra tos de las perreras' },
        
        // Vacunas para gatos
        { name: 'Antirrábica', species: 'Gato', required: 1, frequency: 12, description: 'Vacuna obligatoria contra la rabia' },
        { name: 'Triple Felina', species: 'Gato', required: 1, frequency: 12, description: 'Panleucopenia, Rinotraqueitis, Calicivirus' },
        { name: 'Leucemia Felina', species: 'Gato', required: 0, frequency: 12, description: 'Protección contra leucemia felina' }
    ];

    const stmt = db.prepare(`
        INSERT OR IGNORE INTO vaccines (name, species, required, frequency_months, description, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
    `);

    vaccines.forEach(vaccine => {
        stmt.run(vaccine.name, vaccine.species, vaccine.required, vaccine.frequency, vaccine.description);
    });

    stmt.finalize();
}

// Funciones helper para queries
const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
};

const getOne = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const getAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

module.exports = {
    db,
    runQuery,
    getOne,
    getAll
};