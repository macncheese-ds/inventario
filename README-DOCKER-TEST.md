# Docker Test Environment

This is a simplified Docker setup that runs **frontend + backend in ONE container** and connects to your **local MySQL database**.

## Port Mapping

### Test Environment (Docker)
- **Frontend**: http://localhost:201
- **Backend**: http://localhost:101/api
- **Database**: Uses your local MySQL (localhost:3306)

### Main Environment (Your usual setup)
- **Frontend**: http://localhost:201
- **Backend**: http://localhost:101/api
- **Database**: localhost:3306 (same as test)

## Prerequisites

Your local MySQL database must be running and accessible with:
- **Host**: localhost (accessible as `host.docker.internal` from Docker)
- **Port**: 3306
- **Database**: inventario
- **User**: inventario
- **Password**: inventario123

## Quick Start

### Start Test Environment
```powershell
.\start-test-docker.ps1
```

Or manually:
```powershell
docker-compose -f docker-compose.test.yml up --build -d
```

### Stop Test Environment
```powershell
.\stop-test-docker.ps1
```

Or manually:
```powershell
docker-compose -f docker-compose.test.yml down
```

### View Logs
```powershell
docker-compose -f docker-compose.test.yml logs -f
```

View specific service:
```powershell
docker-compose -f docker-compose.test.yml logs -f app-test
```

### Restart Services
```powershell
docker-compose -f docker-compose.test.yml restart
```

### Rebuild After Code Changes
```powershell
docker-compose -f docker-compose.test.yml up --build -d
```

## Database Access

The test environment connects to your **local MySQL database** at `localhost:3306`.

Make sure your local MySQL is running:
```powershell
# Check if MySQL is running
Get-Service MySQL* | Select-Object Status, Name
```

Connect to database (same as your main app):
```bash
mysql -h 127.0.0.1 -P 3306 -u inventario -p inventario
# Password: inventario123
```

## Clean Up

Remove containers and networks:
```powershell
docker-compose -f docker-compose.test.yml down
```

Remove containers, networks, AND volumes (deletes uploaded files):
```powershell
docker-compose -f docker-compose.test.yml down -v
```

## Notes

- **Single container** runs both frontend and backend
- Uses your **local MySQL database** (same as main app)
- Both environments use **hot reload** - changes to code will automatically refresh
- Backend runs on port **101**
- Frontend runs on port **201**
- You can run both main and test environments **simultaneously**

## Troubleshooting

### Cannot Connect to Database
Make sure your local MySQL is running and accessible:
```powershell
# Check MySQL service
Get-Service MySQL*

# Test connection
mysql -h 127.0.0.1 -u inventario -p inventario
```

If Docker can't reach `host.docker.internal`, you may need to:
- Check Windows Firewall settings
- Ensure MySQL is listening on 0.0.0.0, not just 127.0.0.1
```powershell
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up --build -d
```
