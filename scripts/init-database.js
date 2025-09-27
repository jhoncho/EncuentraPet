const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Leer el archivo schema.sql
const schemaPath = path.join(__dirname, '../database/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Crear/conectar a la base de datos
const db = new sqlite3.Database('./database/encuentrapet.db');

// Ejecutar el schema
db.exec(schema, (err) => {
    if (err) {
        console.error('Error creando tablas:', err);
    } else {
        console.log('✅ Base de datos creada exitosamente');
        console.log('✅ Vacunas de Bolivia cargadas');
    }
    db.close();
});