## Diagnóstico y Solución - Problema de Filtrado por Área

### PROBLEMAS IDENTIFICADOS

1. **Falta Columna `area` en BD**
   - Las tablas `gavetas`, `cambios` y `prestamos` no tienen la columna `area`
   - Se ha creado el script: `backend/schema.sql/add_area_column.sql`
   - **ACCIÓN REQUERIDA**: Ejecutar este script en la BD

2. **Filtrado Inconsistente**
   - `gavetas.js` usaba `WHERE area = ?` (case-sensitive)
   - `items.js` usaba `WHERE LOWER(area) = LOWER(:area)` (case-insensitive)
   - **CORREGIDO**: Se actualizó `gavetas.js` para usar `LOWER()` también

3. **Prestamos sin Área**
   - El endpoint POST `/prestamos` no guardaba el área
   - **CORREGIDO**: Se actualiza para guardar `area` del usuario autenticado

### CAMBIOS REALIZADOS

**1. Archivo: `backend/src/routes/gavetas.js`**
   - ✅ Línea 13: Cambiar `WHERE area = ?` a `WHERE LOWER(gavetas.area) = LOWER(?)`
   - ✅ Línea 33: Cambiar `WHERE area = ?` a `WHERE LOWER(gavetas.area) = LOWER(?)`

**2. Archivo: `backend/src/routes/prestamos.js`**
   - ✅ Línea 80: Agregar filtrado por área en GET `/prestamos`
   - ✅ Línea 117: Guardar `area` al crear préstamo

**3. Nuevo Script: `backend/schema.sql/add_area_column.sql`**
   - ✅ Creado script para agregar columna `area` a: gavetas, cambios, prestamos

### PRÓXIMOS PASOS

**CRÍTICO**: Ejecutar el script de migraci\u00f3n en la BD MySQL:

```bash
cd c:\Marcelo\inventario\backend

# Ejecutar el script de migraci\u00f3n
mysql -h <tu-host> -u <tu-usuario> -p <tu-password> < schema.sql/add_area_column.sql

# O manualmente en MySQL:
# USE inventario;
# ALTER TABLE gavetas ADD COLUMN area VARCHAR(50) DEFAULT NULL;
# ALTER TABLE cambios ADD COLUMN area VARCHAR(50) DEFAULT NULL;
# ALTER TABLE prestamos ADD COLUMN area VARCHAR(50) DEFAULT NULL;
```

### VALIDACIÓN POSTERIOR

Después de ejecutar la migraci\u00f3n:

1. Asegurar que todos los usuarios en `credenciales.users` tengan un `area`:
   - Ensamble: `area = 'ENSAMBLE'`
   - SMT: `area = 'SMT'`

2. Probar el filtrado:
   - Usuario con area=ENSAMBLE debe ver solo items con area=ENSAMBLE
   - Usuario con area=SMT debe ver solo items con area=SMT

3. Verificar permisos de Administrador:
   - Usuario con rol=Administrador en cualquier área debe poder editar items de su área
   - No puede editar items de otras áreas

### FLUJO DE DATOS ESPERADO

```
Usuario Login
  ↓
Token JWT contiene: username, rol, area
  ↓
Backend recibe request:
  - Valida token (auth.js)
  - Verifica permisos (roles.js)
  - Filtra por área en BD
  ↓
Frontend recibe solo items de su área
```

### DETALLES TÉCNICOS

**Autorizaciones (roles.js):**
- `FULL_ACCESS`: ['Ingeniero', 'Administrador']
- `TOOL_ACCESS`: ['AOI', 'Mantenimiento', 'Supervisor', ...]
- `GUEST`: ['Invitado']

**Acceso a funciones:**
- Editar/Eliminar items: Requiere rol en FULL_ACCESS o TOOL_ACCESS
- Decrementar cantidad: Requiere rol en FULL_ACCESS o TOOL_ACCESS
- Administrar usuarios: Solo FULL_ACCESS y NO area=Ensamble
- Ver historial: Solo FULL_ACCESS

Los usuarios con `rol=Administrador` en área `ENSAMBLE` pueden:
- ✅ Ver solo items de Ensamble
- ✅ Editar items de Ensamble
- ✅ Decrementar cantidad de items de Ensamble
- ❌ NO pueden administrar usuarios (por restricción de área)
- ❌ NO pueden hacer préstamos (por restricción de área)
