# Inventario

Sistema de gestión de inventario para control de artículos, historial de movimientos, usuarios y roles.

## Estructura del proyecto
- **backend/**: API Node.js (Express), autenticación, rutas, scripts y base de datos (SQLite/PostgreSQL).
- **frontend/**: Interfaz React con Vite y TailwindCSS.
- **docker-compose.yml**: Orquestación de servicios para desarrollo.

## Funcionalidades principales
- Gestión de artículos, gavetas y usuarios
- Historial de movimientos
- Subida de imágenes
- Autenticación y roles

## Instalación rápida
1. Clona el repositorio y entra a la carpeta `inventario`.
2. Configura los archivos `.env` en backend y frontend.
3. Instala dependencias en ambos (`npm install`).
4. Inicia backend y frontend (`npm run dev`).
# Inventario

Sistema integral para la gestión de inventario, control de artículos, historial de movimientos, usuarios y roles. Incluye autenticación, subida de imágenes y un historial detallado de operaciones.

---

## Tabla de Contenidos
- [Descripción General](#descripción-general)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación y Configuración](#instalación-y-configuración)
- [Uso Básico](#uso-básico)
- [Rutas y Endpoints Principales](#rutas-y-endpoints-principales)
- [Variables de Entorno](#variables-de-entorno)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Notas y Recomendaciones](#notas-y-recomendaciones)

---

## Descripción General
Inventario es una solución web para el control y gestión de artículos, usuarios y movimientos en almacenes o laboratorios. Permite llevar un registro histórico, gestionar roles y permisos, y adjuntar imágenes a los artículos.

## Tecnologías Utilizadas
- **Backend:** Node.js, Express, SQLite/PostgreSQL, JWT, Multer
- **Frontend:** React, Vite, TailwindCSS, Axios
- **DevOps:** Docker, Docker Compose

## Estructura del Proyecto
```
inventario/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── utils/
│   ├── scripts/
│   ├── schema.sql/
│   └── uploads/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   └── pages/
│   └── index.html
├── docker-compose.yml
└── README.md
```

## Instalación y Configuración
1. **Clona el repositorio:**
	```bash
	git clone <repo_url>
	cd inventario
	```
2. **Configura variables de entorno:**
	- Copia `.env.example` a `.env` en backend y frontend, y edítalos según tu entorno.
3. **Instala dependencias:**
	```bash
	cd backend && npm install
	cd ../frontend && npm install
	```
4. **Inicializa la base de datos:**
	- Ejecuta los scripts SQL en `backend/schema.sql/` si es necesario.
5. **Ejecuta los servidores:**
	- En dos terminales separados:
	  ```bash
	  cd backend && npm run dev
	  cd frontend && npm run dev
	  ```
6. **(Opcional) Usa Docker Compose:**
	```bash
	docker-compose up --build
	```

## Uso Básico
Accede a la interfaz web en `http://localhost:5173` (o el puerto configurado). Inicia sesión con un usuario registrado o crea uno usando los scripts de backend.

## Rutas y Endpoints Principales
### Backend (Express)
- `POST /api/auth/login` — Autenticación de usuarios
- `GET /api/items` — Listado de artículos
- `POST /api/items` — Crear artículo
- `PUT /api/items/:id` — Editar artículo
- `DELETE /api/items/:id` — Eliminar artículo
- `GET /api/historial` — Historial de movimientos
- `POST /api/upload` — Subida de imágenes

### Frontend (React)
- Página de login
- Panel de inventario
- Gestión de usuarios y gavetas

## Variables de Entorno
Ejemplo de `.env` para backend:
```
PORT=3001
DB_URL=sqlite://./inventario.db
JWT_SECRET=tu_clave_secreta
```

## Ejemplos de Uso
### Crear un artículo
```http
POST /api/items
Content-Type: application/json
{
  "nombre": "Microscopio",
  "cantidad": 5,
  "ubicacion": "Gaveta 2"
}
```

### Subir una imagen
```http
POST /api/upload
Content-Type: multipart/form-data
file: imagen.jpg
```

## Notas y Recomendaciones
- Usa los scripts en `backend/scripts/` para crear usuarios admin o poblar la base de datos.
- El sistema soporta roles (admin, usuario) y control de acceso por middleware.
- Puedes adaptar la base de datos a PostgreSQL modificando la configuración.
- Incluye seeds y ejemplos para pruebas rápidas.

---
¡Contribuciones y sugerencias son bienvenidas!