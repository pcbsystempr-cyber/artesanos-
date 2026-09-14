# 🧶 Organización de Artesanos y Empresarios Juveniles PCB

Aplicación web full stack para un **Organización de Artesanos y Empresarios Juveniles PCB**, inspirada en la
artesanía y cultura puertorriqueña. Incluye sitio público, panel de administración con
CRUD completo y un portal exclusivo para artesanos, con persistencia en base de datos.

## ✨ Características

- **Sitio público** (HTML/CSS/JS puro): Inicio (hero), Banner de anuncios, Información
  del programa, Requisitos, Artesanos actuales (con buscador), Artesanos anteriores
  (galería histórica) y Galería de fotos.
- **Modo oscuro** persistente y **diseño responsivo** (móvil/tablet/escritorio).
- **Animaciones suaves** y accesibilidad básica.
- **Panel de administración** (`/admin`): login seguro (JWT) y CRUD completo
  (Crear, Editar, Eliminar, Guardar) para todas las secciones.
- **Portal de artesanos** (`/portal`): login protegido con información de la feria,
  mapa embebido, avisos, descarga de documentos y calendario de actividades.
- **Autenticación** con JWT + bcrypt para administradores y artesanos.
- **Subida de imágenes y documentos** (multer).
- **Optimización SEO** (meta tags, Open Graph) en la página pública.

## 🛠️ Tecnologías

- Frontend: HTML5, CSS3, JavaScript moderno (ES6+)
- Backend: Node.js + Express
- Base de datos: PostgreSQL (driver `pg`)
- Autenticación: JSON Web Tokens (`jsonwebtoken`) + `bcryptjs`

## 📁 Estructura

Todos los archivos viven en la carpeta principal del proyecto. Lo único
separado son `uploads/` (contenido subido en runtime) y `node_modules/`.

```
Artesanos/
├── index.html          # Sitio público
├── admin.html          # Panel de administración
├── portal.html         # Portal de artesanos
├── styles.css          # Estilos del sitio público
├── admin.css           # Estilos del panel admin
├── portal.css          # Estilos del portal
├── main.js             # Lógica del sitio público
├── admin.js            # Lógica del panel admin
├── portal.js           # Lógica del portal
├── supabaseClient.js   # ⭐ Toda la configuración y lógica de Supabase
├── auth.js             # JWT + bcrypt
├── db.js               # Pool de PostgreSQL (compatible con Supabase)
├── server.js           # Servidor Express + API REST
├── setup.js            # Crea usuarios por defecto
├── schema.sql          # Crea tablas, triggers y RLS (para Supabase)
├── seed.sql            # Datos de ejemplo
├── users.sql           # Usuarios por defecto (admin / artesano)
├── package.json
├── .env                # Variables de entorno (SUPABASE_* , DB_* , JWT_SECRET)
└── uploads/            # Imágenes y documentos subidos
```

## 🚀 Instalación

### 1. Requisitos
- Node.js 18+
- PostgreSQL

### 2. Dependencias
```bash
npm install
```

### 3. Base de datos (Supabase)
Toda la configuración e instrucciones de Supabase están en `supabaseClient.js`.
Para crear el esquema, insertar datos de ejemplo y crear usuarios:

```bash
npm run db:schema   # crea tablas, triggers y políticas RLS
npm run db:seed     # inserta datos de ejemplo
npm run db:users    # crea usuarios admin / artesano
```

Estos comandos usan la conexión PostgreSQL de Supabase. Define en tu `.env`:
```
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SECRET_KEY=sb_secret_xxx
DATABASE_URL=postgresql://postgres:[DB_PASSWORD]@db.TU-PROYECTO.supabase.co:5432/postgres
```
Si no defines `DATABASE_URL`, se deriva usando `DB_PASSWORD` del dashboard de Supabase.

> El backend (`db.js`) usa el driver `pg` apuntando a `DATABASE_URL`, por lo
> que funciona igual con PostgreSQL local o con Supabase.

### 4. Configuración
Edita el archivo `.env` (ya existe en la raíz) con tus valores:
```
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SECRET_KEY=sb_secret_xxx
DATABASE_URL=postgresql://postgres:[DB_PASSWORD]@db.TU-PROYECTO.supabase.co:5432/postgres
JWT_SECRET=cambia_este_secreto_en_produccion
ADMIN_USER=admin
ADMIN_PASSWORD=admin123
ARTISAN_USER=artesano
ARTISAN_PASSWORD=artesano123
```
Ajusta `DATABASE_URL`/`DB_PASSWORD`, `JWT_SECRET` y las credenciales por defecto.

### 5. Usuarios por defecto
```bash
npm run setup
```
Crea/actualiza los usuarios:
- **Admin:** `admin` / `admin123`
- **Artesano:** `artesano` / `artesano123`

> ⚠️ Cambia estas credenciales y el `JWT_SECRET` en producción.

### 6. Ejecutar
```bash
npm start
```
Abre:
- Sitio público: http://localhost:3000/
- Panel admin:  http://localhost:3000/admin
- Portal:       http://localhost:3000/portal

## 🔌 API REST (resumen)

| Recurso           | Métodos                         | Acceso        |
|-------------------|---------------------------------|---------------|
| `/api/login`      | POST                            | Público       |
| `/api/me`         | GET                             | Token         |
| `/api/announcements` | GET / POST / PUT / DELETE    | GET público, resto admin |
| `/api/program-info`  | GET / PUT                     | GET público, PUT admin |
| `/api/requirements` | GET / POST / PUT / DELETE     | GET público, resto admin |
| `/api/artisans`   | GET / POST / PUT / DELETE       | GET público, resto admin |
| `/api/alumni`     | GET / POST / PUT / DELETE       | GET público, resto admin |
| `/api/gallery`    | GET / POST / DELETE             | GET público, resto admin |
| `/api/craft-fair` | GET / PUT                        | GET público, PUT admin |
| `/api/artisan-notices` | GET / POST / DELETE        | GET público, resto admin |
| `/api/documents`  | GET / POST / DELETE             | GET público, resto admin |
| `/api/activities` | GET / POST / DELETE             | GET público, resto admin |

## 📝 Notas

- Las imágenes se optimizan con `loading="lazy"`.
- El buscador de artesanos filtra por nombre y especialidad en el cliente.
- Toda la entrada de usuario se escapa para evitar XSS en el render.
- En Supabase Storage debes crear el bucket `documents` (junto a `photos`) para alojar los archivos subidos desde el panel de administración. Ambos buckets deben tener la política RLS adecuada para permitir subidas desde el backend usando la service key.

© Organización de Artesanos y Empresarios Juveniles PCB · Puerto Rico 🇵🇷
# Artesanos
