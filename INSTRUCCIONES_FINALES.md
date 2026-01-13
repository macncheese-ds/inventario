## Diagnóstico y Solución - Problema de Filtrado por Área

### ESTADO ACTUAL

✅ **Completado:**
- Columnas `area` agregadas a: gavetas, cambios, prestamos
- Tabla `credenciales.users` ya tiene columna area
- Script de migracion ejecutado: EXIT CODE 0

### PROBLEMAS CORREGIDOS

1. ✅ **Filtrado Inconsistente en gavetas.js**
   - Cambiar `WHERE area = ?` a `WHERE LOWER(gavetas.area) = LOWER(?)`
   - Ahora es case-insensitive como en items.js

2. ✅ **Prestamos sin Área**
   - Endpoint POST `/prestamos` actualizado para guardar `area` del usuario
   - Endpoint GET `/prestamos` actualizado para filtrar por área

### PRÓXIMOS PASOS - CRÍTICO

**1. Asignar áreas a items existentes:**

```bash
cd c:\Marcelo\inventario\backend

# Ejecutar script de población de áreas
mysql -h 127.0.0.1 -u root -p6235642 inventario < schema.sql/populate_areas.sql
```

**2. Validar que todo está correcto:**

```bash
# Ejecutar script de validación
mysql -h 127.0.0.1 -u root -p6235642 inventario < schema.sql/validate_area_setup.sql
```

### CAMBIOS DE CÓDIGO REALIZADOS

**Archivo: `backend/src/routes/gavetas.js` - Línea 13 y 33**
```javascript
// ANTES:
const whereClause = area ? 'WHERE area = ?' : '';

// DESPUÉS:
const whereClause = area ? 'WHERE LOWER(gavetas.area) = LOWER(?)' : '';
```

**Archivo: `backend/src/routes/prestamos.js` - Línea 80 y 117**
```javascript
// GET / - Ahora filtra por área
WHERE (LOWER(p.area) = LOWER(:userArea) OR p.area IS NULL)

// POST / - Ahora guarda área
INSERT INTO prestamos (..., area) VALUES (..., :area)
```

### SCRIPTS CREADOS

1. `schema.sql/add_area_column.sql` - ✅ EJECUTADO
   - Agrega columnas area a gavetas, cambios, prestamos

2. `schema.sql/populate_areas.sql` - ⏳ PENDIENTE EJECUTAR
   - Asigna áreas a items existentes basándose en equipos
   - Items con equipos SMT (FUJI, YAMAHA, KIC, etc) → area = 'SMT'
   - Otros items → area = 'ENSAMBLE'

3. `schema.sql/validate_area_setup.sql` - ℹ️ INFORMATIVO
   - Verifica que todo está correctamente configurado

### FLUJO DE DATOS ESPERADO

```
1. Usuario Login (credenciales.users)
   ↓ Token JWT: {username, rol, area}
   ↓
2. Request a /items
   ↓ Middleware auth.js: Valida token
   ↓ Middleware roles.js: Verifica permisos
   ↓
3. Backend filtra por área
   SELECT * FROM gavetas WHERE LOWER(area) = LOWER(userArea)
   ↓
4. Frontend recibe solo items del usuario
```

### AUTORIZACIONES DESPUÉS DE LOS CAMBIOS

- `FULL_ACCESS`: ['Ingeniero', 'Administrador'] ← Acceso completo a su área
- `TOOL_ACCESS`: ['AOI', 'Mantenimiento', 'Supervisor', ...] ← Acceso limitado
- `GUEST`: ['Invitado'] ← Solo lectura

**Usuario con rol=Administrador en area=ENSAMBLE:**
- ✅ Ver solo items de ENSAMBLE
- ✅ Editar items de ENSAMBLE
- ✅ Decrementar cantidad de items de ENSAMBLE
- ✅ Ver historial del área
- ❌ Ver items de SMT (filtrado por backend)
- ❌ Administrar usuarios (bloqueado por restricción de área)
- ❌ Hacer préstamos (bloqueado por restricción de área)

### VERIFICACIÓN CHECKLIST

Después de ejecutar populate_areas.sql, verificar:

- [ ] `SELECT COUNT(*) FROM gavetas WHERE LOWER(area) = 'ensamble';` → Cuenta debe ser > 0
- [ ] `SELECT COUNT(*) FROM gavetas WHERE LOWER(area) = 'smt';` → Cuenta debe ser > 0
- [ ] Usuario A (area=ENSAMBLE) ve solo items de Ensamble
- [ ] Usuario B (area=SMT) ve solo items de SMT
- [ ] Usuario Administrador ENSAMBLE puede editar/decrementar items
- [ ] Usuario Administrador SMT puede editar/decrementar items
- [ ] Endpoint GET /prestamos filtra por área

### IMPORTANTE

- El filtrado es **case-insensitive**: 'ENSAMBLE' = 'Ensamble' = 'ensamble'
- Items sin área (NULL) se muestran si el usuario tiene un área (backward compatibility)
- Todos los endpoints de edición requieren autenticación y autorización
- El token JWT contiene el area del usuario
