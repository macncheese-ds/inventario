# Script para reconstruir el frontend y recargar nginx
Write-Host "=== Reconstruyendo Frontend de Inventario ===" -ForegroundColor Cyan

# Cambiar al directorio del frontend
Set-Location "c:\app\inventario\frontend"

# Construir el proyecto
Write-Host "`nEjecutando build..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nBuild completado exitosamente!" -ForegroundColor Green
    
    # Recargar nginx
    Write-Host "`nRecargando nginx..." -ForegroundColor Yellow
    Set-Location "C:\nginx"
    .\nginx.exe -s reload
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nNginx recargado exitosamente!" -ForegroundColor Green
        Write-Host "`nLa aplicación está lista en: http://localhost" -ForegroundColor Cyan
    } else {
        Write-Host "`nError al recargar nginx" -ForegroundColor Red
    }
} else {
    Write-Host "`nError en el build" -ForegroundColor Red
}

# Volver al directorio original
Set-Location "c:\app"
