-- ============================================================
--  Programa Escolar de Artesanos - Esquema de Base de Datos
--  Compatible con PostgreSQL (puede adaptarse a MySQL fácilmente)
-- ============================================================

-- Crear la base de datos (ejecutar como superusuario si es necesario):
-- CREATE DATABASE artesanos;

-- ============================================================
--  TABLA: users  (administradores y artesanos)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(60) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'artisan')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  TABLA: announcements  (Banner de anuncios)
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(160) NOT NULL,
    body TEXT NOT NULL,
    published_at DATE DEFAULT CURRENT_DATE,
    is_urgent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  TABLA: program_info  (Información del programa)
--  Se guarda como filas tipo "clave/valor" para editar fácilmente
-- ============================================================
CREATE TABLE IF NOT EXISTS program_info (
    id SERIAL PRIMARY KEY,
    section VARCHAR(60) NOT NULL,     -- history, objectives, benefits, activities
    title VARCHAR(160),
    content TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  TABLA: requirements  (Requisitos de participación)
-- ============================================================
CREATE TABLE IF NOT EXISTS requirements (
    id SERIAL PRIMARY KEY,
    category VARCHAR(60) NOT NULL,    -- documents, criteria, dates
    title VARCHAR(160) NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  TABLA: artisans  (Artesanos actuales)
-- ============================================================
CREATE TABLE IF NOT EXISTS artisans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    specialty VARCHAR(120) NOT NULL,
    description TEXT,
    photo VARCHAR(255) DEFAULT '',
    instagram VARCHAR(255) DEFAULT '',
    facebook VARCHAR(255) DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  TABLA: alumni  (Artesanos anteriores / graduados)
-- ============================================================
CREATE TABLE IF NOT EXISTS alumni (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    year INT NOT NULL,
    description TEXT,
    photo VARCHAR(255) DEFAULT '',
    instagram VARCHAR(255) DEFAULT '',
    facebook VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  TABLA: gallery  (Galería de fotos)
-- ============================================================
CREATE TABLE IF NOT EXISTS gallery (
    id SERIAL PRIMARY KEY,
    title VARCHAR(160),
    image VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  TABLA: craft_fair  (Información de la próxima feria)
-- ============================================================
CREATE TABLE IF NOT EXISTS craft_fair (
    id SERIAL PRIMARY KEY,
    title VARCHAR(160) NOT NULL,
    event_date DATE,
    event_time VARCHAR(20),
    location VARCHAR(200),
    map_url TEXT,
    description TEXT,
    requirements TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  TABLA: artisan_notices  (Avisos del portal de artesanos)
-- ============================================================
CREATE TABLE IF NOT EXISTS artisan_notices (
    id SERIAL PRIMARY KEY,
    title VARCHAR(160) NOT NULL,
    body TEXT NOT NULL,
    published_at DATE DEFAULT CURRENT_DATE,
    is_urgent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  TABLA: documents  (Documentos descargables del portal)
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(160) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  TABLA: activities  (Calendario de actividades del portal)
-- ============================================================
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    title VARCHAR(160) NOT NULL,
    activity_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
