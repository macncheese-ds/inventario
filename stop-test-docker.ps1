#!/usr/bin/env pwsh

Write-Host "Stopping Test Docker Environment..." -ForegroundColor Cyan

docker-compose -f docker-compose.test.yml down

Write-Host ""
Write-Host "Test environment stopped." -ForegroundColor Green
Write-Host "Your main application (if running) is unaffected." -ForegroundColor Yellow
Write-Host ""
Write-Host "To remove test volumes and data: docker-compose -f docker-compose.test.yml down -v" -ForegroundColor Yellow
Write-Host ""
