#!/usr/bin/env pwsh

Write-Host "Starting Test Docker Environment..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Test Ports:" -ForegroundColor Yellow
Write-Host "  - Frontend: http://localhost:5174" -ForegroundColor Green
Write-Host "  - Backend:  http://localhost:5001" -ForegroundColor Green
Write-Host "  - Database: localhost:3306 (your local MySQL)" -ForegroundColor Green
Write-Host ""
Write-Host "Main Application Ports (unchanged):" -ForegroundColor Yellow
Write-Host "  - Frontend: http://localhost:5173" -ForegroundColor Magenta
Write-Host "  - Backend:  http://localhost:5000" -ForegroundColor Magenta
Write-Host "  - Database: localhost:3306 (same database)" -ForegroundColor Magenta
Write-Host ""
Write-Host "NOTE: Make sure your local MySQL is running!" -ForegroundColor Yellow
Write-Host ""

# Build and start the test containers
docker-compose -f docker-compose.test.yml up --build -d

Write-Host ""
Write-Host "Test environment is starting..." -ForegroundColor Cyan
Write-Host "Waiting for services to be ready..."

# Wait a bit for services to initialize
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Test environment should be ready!" -ForegroundColor Green
Write-Host "Access the test app at: http://localhost:5174" -ForegroundColor Cyan
Write-Host ""
Write-Host "To view logs: docker-compose -f docker-compose.test.yml logs -f" -ForegroundColor Yellow
Write-Host "To stop: docker-compose -f docker-compose.test.yml down" -ForegroundColor Yellow
Write-Host ""
