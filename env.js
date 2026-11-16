// ============================================================
//  Configuración pública del frontend
//  - En local se usan estos valores por defecto.
//  - En Vercel / Netlify / GitHub Pages, `scripts/build-env.mjs`
//    regenera este archivo (en dist/) a partir de las variables
//    de entorno SUPABASE_URL, SUPABASE_ANON_KEY y AUTH_EMAIL_DOMAIN.
//
//  Es un script clásico (no módulo): así el sitio funciona también
//  abriendo el HTML directamente (file://), sin servidor.
//
//  ⚠️ Aquí SOLO va la clave pública (anon / publishable).
//     NUNCA pongas la service_role ni una clave sb_secret_.
//     La seguridad de los datos la garantizan las políticas RLS
//     definidas en supabase/policies.sql.
// ============================================================
const SUPABASE_URL = 'https://cotocvlsdqtglomvenfd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8M0ljA29Inn5kF5WfICK3g_3OY1wWsd';

// Los usuarios inician sesión con "usuario"; se traduce a
// usuario@AUTH_EMAIL_DOMAIN para Supabase Auth (que usa email).
const AUTH_EMAIL_DOMAIN = 'artesanos.local';
