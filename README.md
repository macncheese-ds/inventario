# Inventario

A comprehensive inventory management system designed for controlling articles, tracking movements, managing users, and handling permissions with a modern web interface.

---

## Table of Contents
- [Quick Start](#quick-start)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Database](#database)
- [User Roles and Permissions](#user-roles-and-permissions)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

---

## Demo

![Inventario Demo](docs/demos/main-demo.gif)

---

## Overview

Inventario is a comprehensive full-stack web application for managing inventory, articles, storage locations, user accounts, and detailed movement history. It provides real-time tracking, role-based access control, image uploads, and comprehensive audit logs.

---

## Features

- Article Management: Create, read, update, and delete articles with detailed metadata
- Drawer/Storage Location Management: Organize items by storage location
- Movement History: Complete audit trail of all inventory movements
- User Management: Create and manage user accounts with role-based access
- Authentication: Secure JWT-based authentication system
- Image Uploads: Attach images to articles for visual identification
- Role-Based Access Control: Different permission levels for different user types
- Real-time Database: Track all changes with timestamps and user information
- QR Code Generation: Generate QR codes for articles
- Excel Export: Export inventory data to Excel format

---

## Tech Stack

### Backend
- Node.js with Express
- Authentication: JWT (jsonwebtoken), bcryptjs
- File Upload: Multer
- Data Validation: express-validator
- Excel Export: ExcelJS
- Security: Helmet, CORS
- Logging: Morgan
- Database: MySQL 2

### Frontend
- React 18
- Build Tool: Vite
- Styling: Tailwind CSS
- HTTP Client: Axios
- Routing: React Router DOM
- QR Code: qrcode and qrcode.react
- Icons: React Icons
- Token Decoding: jwt-decode

### DevOps
- Docker & Docker Compose (optional)

---

## Project Structure

```
inventario/
├── backend/
│   ├── src/
│   │   ├── routes/           # API endpoint definitions
│   │   ├── middleware/       # Authentication and validation middleware
│   │   ├── utils/            # Utility functions
│   │   └── index.js          # Express server entry point
│   ├── scripts/              # Database initialization and utility scripts
│   ├── schema.sql/           # Database schema files
│   ├── uploads/              # User-uploaded files and images
│   ├── package.json
│   └── .env                  # Environment variables (not committed)
├── frontend/
│   ├── src/
│   │   ├── components/       # React UI components
│   │   ├── pages/            # Page components
│   │   ├── App.jsx           # Main app component
│   │   └── main.jsx          # Entry point
│   ├── public/               # Static assets
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.cjs
│   ├── package.json
│   └── .env                  # Environment variables (not committed)
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd inventario

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Configure environment variables
# Copy .env.example to .env and update values in:
# - backend/.env
# - frontend/.env

# Start backend (from backend directory)
npm run dev

# In a new terminal, start frontend (from frontend directory)
npm run dev
```

Then open your browser to `http://localhost:5173` (or the configured VITE_PORT).

---

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MySQL Server (if using MySQL)

### Step-by-step Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd inventario
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   cd ..
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. Run database initialization scripts if needed:
   ```bash
   # From backend directory, run your schema setup scripts
   # This depends on your specific database setup
   ```

---

## Environment Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=3000
DATABASE_URL=mysql://user:password@localhost:3306/inventario
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d
MULTER_DEST=uploads
NODE_ENV=development
LOG_LEVEL=debug
```

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:3000/api
VITE_PORT=5173
```

---

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Production Build

**Backend:**
```bash
cd backend
npm run start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

### Docker (Optional)

```bash
docker-compose up --build
```

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - New user registration
- `POST /api/auth/refresh` - Refresh JWT token

### Articles
- `GET /api/articles` - Get all articles
- `GET /api/articles/:id` - Get specific article
- `POST /api/articles` - Create new article
- `PUT /api/articles/:id` - Update article
- `DELETE /api/articles/:id` - Delete article

### Drawers/Locations
- `GET /api/drawers` - Get all storage locations
- `POST /api/drawers` - Create storage location
- `PUT /api/drawers/:id` - Update storage location
- `DELETE /api/drawers/:id` - Delete storage location

### Movements/History
- `GET /api/movements` - Get movement history
- `POST /api/movements` - Record new movement
- `GET /api/movements/:id` - Get specific movement

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get specific user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Uploads
- `POST /api/uploads` - Upload image for article
- `GET /api/uploads/:filename` - Retrieve uploaded image

---

## Database

The application uses MySQL as the primary database. Database schema includes tables for:
- Users (with roles and permissions)
- Articles (inventory items)
- Drawers (storage locations)
- Movements (transaction history with audit trail)
- Uploads (image metadata)

Initialize the database using the SQL schema files in `backend/schema.sql/`.

---

## User Roles and Permissions

The system supports multiple user roles:
- **Admin**: Full access to all features and user management
- **Supervisor**: Can view reports and manage articles
- **Operator**: Can perform inventory movements and view articles
- **Viewer**: Read-only access to inventory

Each role has specific permissions for create, read, update, and delete operations.

---

## Development

### Code Style
- Use ES6+ syntax
- Follow consistent naming conventions
- Comment complex logic sections
- Keep components small and reusable

### Running Tests
```bash
cd backend
npm test

cd ../frontend
npm test
```

### Building for Production
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run build
```

---

## Troubleshooting

### Port Already in Use
If port 3000 or 5173 is in use, update the PORT variable in `.env` files.

### Database Connection Error
- Verify MySQL server is running
- Check DATABASE_URL in backend/.env
- Ensure database exists and credentials are correct

### CORS Errors
- Verify VITE_API_URL in frontend/.env matches backend URL
- Check CORS configuration in backend

### JWT Token Expired
- Clear browser cookies
- Log in again
- Token is configured to expire after 7 days by default (configurable)

### Image Upload Issues
- Verify uploads/ directory has write permissions
- Check MULTER_DEST in backend/.env
- Ensure file size doesn't exceed limits

---

## License

This project is proprietary and confidential.

---

## Support

For issues, questions, or feature requests, contact the development team.