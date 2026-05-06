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
- **Appointment Scheduling** - Schedule property viewings and meetings with SMS reminders
- **Subscription Management** - SaaS subscription system with multiple plans and Razorpay integration
- **Payment Processing** - Secure payment handling with Razorpay for subscription plans
- **WhatsApp Integration** - Direct client communication and marketing campaigns
- **SMS Marketing** - Bulk SMS campaigns and automated messaging
- **Broker Network** - Connect and collaborate with brokers across India
- **Business Posts** - Share and discover property listings in the network
- **Marketing Tools** - Automated campaigns and client outreach
- **Dashboard & Analytics** - Real-time statistics and insights
- **OTP Authentication** - Secure mobile number verification
- **Feature Gating** - Subscription-based access control for premium features

## Tech Stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router, Lucide React  
**Backend:** Go 1.21, Gin, PostgreSQL, JWT Authentication, Razorpay Integration  
**Services:** Twilio SMS, Meta WhatsApp API, OTP Verification  

## Project Structure

```
.
├── backend/              # Go backend server
│   ├── cmd/             # Application entry points
│   ├── internal/        # Internal packages
│   │   ├── handler/     # HTTP handlers
│   │   ├── service/     # Business logic
│   │   ├── repository/  # Data access layer
│   │   ├── models/      # Data models
│   │   ├── middleware/  # HTTP middleware
│   │   └── utils/       # Utility functions
│   ├── migrations/      # Database migrations
│   └── uploads/         # File uploads
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── context/     # React contexts
│   │   ├── layouts/     # Layout components
│   │   ├── routes/      # Routing configuration
│   │   └── types/       # TypeScript types
│   └── dist/            # Production build
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

### 3. Configure Environment

**Backend Configuration:**
Copy `backend/config.env.example` to `backend/config.env` and update:

```env
# Database
DATABASE_URL=postgres://backend:enfor_data@localhost/enfor_data?sslmode=disable

# Server
PORT=8080
GIN_MODE=debug

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Razorpay (for payments)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=+1234567890
```

**Frontend Configuration:**
Create `frontend/.env` file:

```env
VITE_API_URL=http://localhost:8080/api
```

### 4. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
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
cd frontend
npm run dev
```

## Access the Application

- **Frontend:** http://localhost:3000 (or http://localhost:5173)
- **Backend API:** http://localhost:8080
- **API Documentation:** http://localhost:8080/health (health check)

## Demo Credentials

- **Broker:** broker@example.com / password123
- **Channel Partner:** builder@example.com / password123
- **Admin:** admin@example.com / password123

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user info

### OTP Verification
- `POST /api/auth/send-otp` - Send OTP to mobile number
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/resend-otp` - Resend OTP

### Subscriptions
- `GET /api/subscriptions/plans` - Get all subscription plans
- `GET /api/subscriptions/current` - Get user's current subscription
- `POST /api/subscriptions/activate-trial` - Activate free trial
- `POST /api/subscriptions/cancel` - Cancel subscription

### Payments
- `POST /api/payments/create-order` - Create Razorpay payment order
- `POST /api/payments/verify` - Verify payment and activate subscription
- `GET /api/payments/history` - Get payment history

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

### WhatsApp
- `POST /api/whatsapp/setup/business` - Initialize WhatsApp business setup
- `POST /api/whatsapp/send` - Send WhatsApp message
- `GET /api/whatsapp/campaigns` - Get WhatsApp campaigns

### SMS Marketing
- `POST /api/sms-marketing/send` - Send SMS message
- `POST /api/sms-marketing/campaigns` - Create SMS campaign
- `GET /api/sms-marketing/stats` - Get SMS statistics

## Development

### Frontend Scripts
- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality
- `npm run typecheck` - Run TypeScript type checking

### Backend Commands
- `go run cmd/api/main.go` - Start development server
- `go build -o enfor-backend cmd/api/main.go` - Build binary
- `go test ./...` - Run tests
- `go mod tidy` - Clean up dependencies

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
