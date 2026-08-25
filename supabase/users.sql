-- ============================================================
--  Usuarios por defecto para Supabase
--  Genera los hashes bcrypt directamente en PostgreSQL usando
--  la extensión pgcrypto (disponible en Supabase).
--  Contraseñas por defecto (.env.example):
--    admin      / admin123
--    artesano   / artesano123
--
--  Ejecuta en el SQL Editor de Supabase tras schema.sql.
--  Si ya tienes pgcrypto habilitado (por defecto en Supabase),
--  esto funcionará sin dependencias externas.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO public.users (username, password_hash, role)
VALUES ('admin', crypt('admin123', gen_salt('bf', 10)), 'admin')
ON CONFLICT (username) DO NOTHING;

INSERT INTO public.users (username, password_hash, role)
VALUES ('artesano', crypt('artesano123', gen_salt('bf', 10)), 'artisan')
ON CONFLICT (username) DO NOTHING;
