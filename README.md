# ENFOR DATA

A comprehensive real estate business management platform for brokers and real estate professionals in India.

## Quick Start

### Windows Users (Automatic Setup)

1. Extract the project folder
2. Double-click `start.bat`
3. Click "Yes" when Windows asks for administrator permission
4. Wait for automatic setup (10-15 minutes first time)
5. Browser opens automatically with the application

**That's it!** The script automatically installs Node.js, Go, PostgreSQL, creates the database, and starts everything.

See `WINDOWS_QUICK_START.txt` for more details.

### Linux/Mac Users

```bash
# Install prerequisites
# Node.js 18+, Go 1.21+, PostgreSQL

# Start the application
./start.sh
```

## Features

- **Property Management** - Manage listings with images, pricing, and status tracking
- **Client Management** - Track buyers, sellers, tenants, and owners
- **Appointment Scheduling** - Schedule property viewings and meetings
- **WhatsApp Integration** - Direct client communication and marketing
- **Broker Network** - Connect with brokers across India
- **Business Posts** - Share and discover property listings
- **Marketing Tools** - Automated campaigns and client outreach
- **Dashboard & Analytics** - Real-time statistics and insights

## Tech Stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Supabase  
**Backend:** Go 1.21, Gin, PostgreSQL, JWT Authentication  

## Project Structure

```
.
├── backend/              # Go backend server
│   ├── cmd/             # Application entry points
│   ├── internal/        # Internal packages
│   ├── migrations/      # Database migrations
│   └── uploads/         # File uploads
├── src/                 # React frontend
│   ├── components/      # React components
│   ├── context/         # Context providers
│   └── services/        # API services
├── scripts/             # Build and startup scripts
├── start.bat            # Windows one-click startup
└── stop.bat             # Windows one-click shutdown
```

## Manual Installation

If you prefer manual setup:

### 1. Install Dependencies

**Node.js:** https://nodejs.org/ (LTS version)  
**Go:** https://golang.org/dl/ (1.21+)  
**PostgreSQL:** https://www.postgresql.org/download/

### 2. Setup Database

```sql
CREATE DATABASE enfor_data;
CREATE USER backend WITH PASSWORD 'enfor_data';
GRANT ALL PRIVILEGES ON DATABASE enfor_data TO backend;
```

### 3. Configure Backend

Copy `backend/config.env.example` to `backend/config.env` and update if needed.

### 4. Install Dependencies

```bash
# Frontend
npm install

# Backend
cd backend
go mod download
```

### 5. Run Migrations

```bash
cd backend
psql -U backend -d enfor_data -h localhost < migrations/001_create_users_table.sql
psql -U backend -d enfor_data -h localhost < migrations/002_create_properties_table.sql
psql -U backend -d enfor_data -h localhost < migrations/003_create_clients_table.sql
psql -U backend -d enfor_data -h localhost < migrations/004_create_appointments_table.sql
```

### 6. Start Servers

```bash
# Terminal 1 - Backend
cd backend
go run cmd/api/main.go

# Terminal 2 - Frontend
npm run dev
```

## Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8080

## Demo Credentials

- **Broker:** broker@example.com / password123
- **Channel Partner:** builder@example.com / password123
- **Admin:** admin@example.com / password123

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Properties
- `GET /api/properties` - List all properties
- `POST /api/properties` - Create property
- `GET /api/properties/:id` - Get property details
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create client
- `GET /api/clients/:id` - Get client details
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Appointments
- `GET /api/appointments` - List all appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/:id` - Get appointment details
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

## Development

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - TypeScript type checking

### Backend Commands
- `go run cmd/server/main.go` - Start development server
- `go build -o enfor-backend cmd/server/main.go` - Build binary
- `go test ./...` - Run tests

## Stopping the Application

**Windows:** Double-click `stop.bat`

**Linux/Mac:** Press `Ctrl+C` in the terminal

## Troubleshooting

### Windows: "Access Denied"
Right-click `start.bat` → Run as administrator

### "Port already in use"
Stop other applications using ports 8080 or 5173, or restart your computer

### "Cannot connect to database"
Ensure PostgreSQL service is running:
- Windows: Services → postgresql → Start
- Linux: `sudo systemctl start postgresql`
- Mac: `brew services start postgresql`

### "Node/Go/PostgreSQL not found" after installation
Close and reopen the terminal/command prompt to refresh environment variables

## System Requirements

**Minimum:**
- Windows 10/11, macOS 10.15+, or Linux
- 4 GB RAM
- 2 GB free disk space

**Recommended:**
- 8 GB RAM or more
- 5 GB free disk space
- Stable internet connection

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For issues or questions, please contact the development team.

---

**Note:** Docker support coming soon for even simpler deployment!
