-- database/schema.sql
-- Base de datos para EncuentraPet con registro sanitario completo

-- Tabla de usuarios (dueños)
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
);

-- Tabla de mascotas (actualizada)
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
    diet_notes TEXT,
    temperament TEXT,
    veterinarian_name TEXT,
    veterinarian_phone TEXT,
    veterinarian_address TEXT,
    emergency_contact TEXT,
    emergency_phone TEXT,
    photo_url TEXT,
    qr_code TEXT NOT NULL,
    health_card_number TEXT,  -- Número de carnet sanitario
    is_lost BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de vacunas disponibles
CREATE TABLE IF NOT EXISTS vaccines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_commercial TEXT,
    species TEXT NOT NULL,
    required BOOLEAN DEFAULT 0,  -- Si es obligatoria en Bolivia
    frequency_months INTEGER,     -- Frecuencia en meses
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    UNIQUE(name, species)
);

-- Tabla de registro de vacunación
CREATE TABLE IF NOT EXISTS vaccination_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    vaccine_id INTEGER NOT NULL,
    vaccination_date DATE NOT NULL,
    next_dose_date DATE,
    dose_number INTEGER DEFAULT 1,
    batch_number TEXT,              -- Número de lote de la vacuna
    manufacturer TEXT,              -- Fabricante
    veterinarian_name TEXT NOT NULL,
    veterinarian_license TEXT,      -- Matrícula profesional
    clinic_name TEXT,
    clinic_address TEXT,
    notes TEXT,
    certificate_number TEXT,        -- Número de certificado
    is_verified BOOLEAN DEFAULT 0,  -- Si está verificado por un veterinario
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
    FOREIGN KEY (vaccine_id) REFERENCES vaccines(id)
);

-- Tabla de desparasitaciones
CREATE TABLE IF NOT EXISTS deworming_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    deworming_date DATE NOT NULL,
    next_dose_date DATE,
    product_name TEXT NOT NULL,
    product_type TEXT CHECK(product_type IN ('Interna', 'Externa', 'Ambas')),
    dose TEXT,
    weight_at_time REAL,
    veterinarian_name TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- Tabla de consultas médicas
CREATE TABLE IF NOT EXISTS medical_consultations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    consultation_date DATE NOT NULL,
    reason TEXT NOT NULL,
    symptoms TEXT,
    diagnosis TEXT,
    treatment TEXT,
    prescription TEXT,
    follow_up_date DATE,
    weight REAL,
    temperature REAL,
    heart_rate INTEGER,
    respiratory_rate INTEGER,
    veterinarian_name TEXT NOT NULL,
    veterinarian_license TEXT,
    clinic_name TEXT,
    cost REAL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- Tabla de cirugías/procedimientos
CREATE TABLE IF NOT EXISTS medical_procedures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    procedure_date DATE NOT NULL,
    procedure_type TEXT NOT NULL,
    procedure_name TEXT NOT NULL,
    anesthesia_type TEXT,
    complications TEXT,
    recovery_notes TEXT,
    veterinarian_name TEXT NOT NULL,
    veterinarian_license TEXT,
    clinic_name TEXT,
    cost REAL,
    follow_up_required BOOLEAN DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- Tabla de exámenes/análisis
CREATE TABLE IF NOT EXISTS medical_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    test_date DATE NOT NULL,
    test_type TEXT NOT NULL CHECK(test_type IN ('Sangre', 'Orina', 'Heces', 'Radiografía', 'Ecografía', 'Otro')),
    test_name TEXT NOT NULL,
    results TEXT,
    normal_values TEXT,
    interpretation TEXT,
    file_url TEXT,  -- Para guardar PDFs o imágenes
    veterinarian_name TEXT,
    laboratory_name TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- Tabla de ubicaciones (sin cambios)
CREATE TABLE IF NOT EXISTS pet_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    accuracy REAL,
    altitude REAL,
    address TEXT,
    city TEXT,
    department TEXT,
    found_by_name TEXT,
    found_by_phone TEXT NOT NULL,
    found_by_email TEXT,
    message TEXT,
    photo_url TEXT,
    status TEXT DEFAULT 'reported' CHECK(status IN ('reported', 'verified', 'reunited')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    pet_id INTEGER,
    type TEXT NOT NULL CHECK(type IN ('email', 'sms', 'whatsapp', 'push', 'vaccination_reminder', 'deworming_reminder', 'checkup_reminder')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    scheduled_date DATETIME,  -- Para recordatorios programados
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed', 'cancelled')),
    sent_at DATETIME,
    read_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- Tabla de razas
CREATE TABLE IF NOT EXISTS breeds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    species TEXT NOT NULL,
    name TEXT NOT NULL,
    name_english TEXT,
    is_common BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    UNIQUE(species, name)
);

-- Tabla de escaneos QR
CREATE TABLE IF NOT EXISTS qr_scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    latitude REAL,
    longitude REAL,
    scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- Insertar vacunas básicas para perros (Bolivia)
INSERT OR IGNORE INTO vaccines (name, name_commercial, species, required, frequency_months, description) VALUES 
('Antirrábica', 'Rabisin/Nobivac', 'Perro', 1, 12, 'Vacuna obligatoria contra la rabia'),
('Parvovirus', 'Nobivac Parvo-C', 'Perro', 1, 12, 'Protección contra parvovirus canino'),
('Moquillo', 'Nobivac Puppy DP', 'Perro', 1, 12, 'Protección contra distemper canino'),
('Hepatitis', 'Nobivac DHP', 'Perro', 1, 12, 'Protección contra hepatitis infecciosa'),
('Leptospirosis', 'Nobivac Lepto', 'Perro', 0, 12, 'Protección contra leptospirosis'),
('Parainfluenza', 'Nobivac Pi', 'Perro', 0, 12, 'Protección contra parainfluenza'),
('Coronavirus', 'Nobivac Corona', 'Perro', 0, 12, 'Protección contra coronavirus canino'),
('Bordetella', 'Nobivac KC', 'Perro', 0, 6, 'Protección contra tos de las perreras'),
('Séxtuple', 'Nobivac DHPPi+L', 'Perro', 1, 12, 'Vacuna combinada séxtuple'),
('Óctuple', 'Nobivac Canine 1-DAPPv+Cv+L4', 'Perro', 0, 12, 'Vacuna combinada óctuple');

-- Insertar vacunas básicas para gatos (Bolivia)
INSERT OR IGNORE INTO vaccines (name, name_commercial, species, required, frequency_months, description) VALUES 
('Antirrábica', 'Rabisin/Nobivac', 'Gato', 1, 12, 'Vacuna obligatoria contra la rabia'),
('Triple Felina', 'Nobivac Tricat', 'Gato', 1, 12, 'Panleucopenia, Rinotraqueitis, Calicivirus'),
('Leucemia Felina', 'Nobivac FeLV', 'Gato', 0, 12, 'Protección contra leucemia felina'),
('Peritonitis Infecciosa', 'Primucell FIP', 'Gato', 0, 12, 'Protección contra PIF'),
('Clamidia', 'Nobivac Chlamydia', 'Gato', 0, 12, 'Protección contra clamidiosis');

-- Índices para optimización
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_pets_user ON pets(user_id);
CREATE INDEX idx_pets_code ON pets(pet_code);
CREATE INDEX idx_pets_lost ON pets(is_lost);
CREATE INDEX idx_vaccinations_pet ON vaccination_records(pet_id);
CREATE INDEX idx_vaccinations_date ON vaccination_records(vaccination_date);
CREATE INDEX idx_deworming_pet ON deworming_records(pet_id);
CREATE INDEX idx_medical_pet ON medical_consultations(pet_id);
CREATE INDEX idx_locations_pet ON pet_locations(pet_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_date);
CREATE INDEX idx_qr_scans_pet ON qr_scans(pet_id);

-- Vistas útiles
CREATE VIEW IF NOT EXISTS pet_health_summary AS
SELECT 
    p.id,
    p.name,
    p.species,
    p.user_id,
    COUNT(DISTINCT vr.id) as total_vaccinations,
    COUNT(DISTINCT dr.id) as total_dewormings,
    COUNT(DISTINCT mc.id) as total_consultations,
    MAX(vr.vaccination_date) as last_vaccination,
    MAX(dr.deworming_date) as last_deworming,
    MAX(mc.consultation_date) as last_consultation
FROM pets p
LEFT JOIN vaccination_records vr ON p.id = vr.pet_id
LEFT JOIN deworming_records dr ON p.id = dr.pet_id
LEFT JOIN medical_consultations mc ON p.id = mc.pet_id
GROUP BY p.id;

CREATE VIEW IF NOT EXISTS pending_vaccinations AS
SELECT 
    p.id as pet_id,
    p.name as pet_name,
    p.user_id,
    v.name as vaccine_name,
    vr.next_dose_date
FROM pets p
JOIN vaccination_records vr ON p.id = vr.pet_id
JOIN vaccines v ON vr.vaccine_id = v.id
WHERE vr.next_dose_date <= date('now', '+30 days')
AND vr.next_dose_date >= date('now')
ORDER BY vr.next_dose_date;

ALTER TABLE location_reports 
ADD COLUMN photo_url TEXT AFTER message;

CREATE TABLE IF NOT EXISTS location_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    latitude REAL,
    longitude REAL,
    accuracy REAL,
    finder_name TEXT,
    finder_phone TEXT,
    finder_email TEXT,
    message TEXT,
    reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(id)
);

CREATE TABLE IF NOT EXISTS location_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_report_id INTEGER NOT NULL,
    photo_url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_report_id) REFERENCES location_reports(id)
);