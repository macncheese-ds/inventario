# Actualización del Sistema de Inventario - Integración con Credenciales

## Cambios Realizados

### 1. Sistema de Autenticación
El sistema de inventario ahora utiliza la base de datos `credenciales` para la autenticación de usuarios, igual que el sistema de checklist.

### 2. Módulo de Login con Escaneo de Gafete
- Se implementó el componente `LoginModal` con soporte para escaneo de gafetes desde PDA
- Los usuarios ahora inician sesión escaneando su gafete y luego ingresando su contraseña
- Compatible con escáneres Zebra y otros dispositivos PDA

### 3. Sistema de Roles
Los roles del sistema de credenciales se mapean de la siguiente manera:

| Rol en Credenciales | Rol en Inventario | Permisos |
|---------------------|-------------------|----------|
| The Goat | admin | Acceso total (crear, editar, eliminar, exportar) |
| Administrador | admin | Acceso total (crear, editar, eliminar, exportar) |
| Lider | operador | Puede editar items, exportar |
| Operador | operador | Puede editar items, exportar |
| Invitado | guest | Solo lectura |

### 4. Validación de Contraseñas
Todas las operaciones que requieren confirmación de contraseña (editar, eliminar) ahora validan contra la base de datos de credenciales.

### 5. Historial de Cambios
El historial ahora muestra información enriquecida de los usuarios obtenida de la tabla `users` en credenciales, incluyendo:
- Nombre completo del usuario
- Rol original en el sistema de credenciales

## Archivos Modificados

### Backend
- `src/routes/auth.js` - Autenticación con credenciales, lookup de usuarios
- `src/routes/users.js` - Gestión de usuarios desde credenciales
- `src/routes/items.js` - Validación de contraseñas desde credenciales
- `src/routes/historial.js` - Enriquecimiento de historial con datos de usuarios
- `.env` - Agregada variable `CRED_DB_NAME=credenciales`

### Frontend
- `src/api.js` - Funciones para lookup y autenticación
- `src/pages/Login.jsx` - Nueva interfaz con modal de escaneo
- `src/components/LoginModal.jsx` - Componente de escaneo de gafete (copiado de checklist)

### Base de Datos
- `migrate_to_credentials.sql` - Script para eliminar tabla `users` local

## Migración

### Paso 1: Ejecutar script de migración
```bash
mysql -u root -p < backend/migrate_to_credentials.sql
```

### Paso 2: Reiniciar el servidor backend
```bash
cd backend
npm install
npm start
```

### Paso 3: Reconstruir frontend
```bash
cd frontend
npm install
npm run build
```

## Notas Importantes

1. **Tabla Users Eliminada**: La tabla `users` de la base de datos `inventario` fue eliminada. Todos los usuarios ahora se gestionan desde `credenciales.users`.

2. **Compatibilidad con PDA**: El sistema de login está optimizado para escáneres de gafetes en dispositivos PDA (probado con Zebra).

3. **Campo username**: En el código, el campo `username` ahora contiene el `num_empleado` del usuario (ej: "1234A").

4. **Historial**: Los registros antiguos en la tabla `cambios` seguirán mostrando el username que se usaba en ese momento.

## Configuración de .env

Asegúrate de que tu archivo `.env` tenga estas variables:

```properties
PORT=4000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password

DB_NAME=inventario
CRED_DB_NAME=credenciales
JWT_SECRET=tu_secret
JWT_EXPIRES_IN=8h
```

## Testing

Para probar el sistema:

1. Accede a la página de login
2. Haz clic en "Escanear Gafete"
3. Escanea tu gafete (o escribe manualmente tu número de empleado)
4. Ingresa tu contraseña
5. El sistema validará tus credenciales y te dará acceso según tu rol

## Soporte

Si encuentras problemas:
- Verifica que la base de datos `credenciales` existe y tiene usuarios
- Verifica que la variable `CRED_DB_NAME` en `.env` está configurada correctamente
- Revisa los logs del servidor para errores de conexión
