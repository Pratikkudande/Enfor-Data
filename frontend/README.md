# ENFOR DATA - Frontend

This is the scalable, production-grade frontend application for the **ENFOR DATA** platform. It is built using React 18, TypeScript, Vite, and Tailwind CSS.

## 🚀 Getting Started

Follow these steps to set up and run the frontend on a new system after cloning the repository.

### Prerequisites

Ensure you have the following installed on your system:
- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher)

---

### 1. Install Dependencies

Open your terminal, navigate to the `frontend` directory, and run:

```bash
npm install
```

This will install all required dependencies including React, Vite, TailwindCSS, React Router, and Lucide React.

---

### 2. Environment Configuration

The application requires environment variables to communicate with the backend API.

1. Create a `.env` file in the root of the `frontend` directory:
   ```bash
   # On Windows (Command Prompt):
   type nul > .env
   
   # On Mac/Linux/Powershell:
   touch .env
   ```

2. Add your backend API URL to the `.env` file:
   ```env
   VITE_API_URL=http://localhost:8080/api
   ```
   *(Note: Ensure your backend server is running on port 8080, or adjust the URL accordingly).*

---

### 3. Run the Development Server

To start the local development server, run:

```bash
npm run dev
```

Vite will start the server instantly. Open your browser and navigate to the local URL provided in the terminal (usually `http://localhost:3000` or `http://localhost:5173`).

---

### 4. Build for Production

When you are ready to deploy the application, you can generate an optimized production build:

```bash
# First, ensure all TypeScript interfaces pass validation
npm run typecheck

# Then, generate the production bundle
npm run build
```

The compiled static files will be placed inside the `dist/` folder, ready to be hosted on Vercel, Netlify, NGINX, or any standard web server.

---

## 🏗 Architecture Overview

The frontend follows a clean, modular, and scalable folder structure:

```text
src/
├── components/   # Reusable UI elements (FormInputs, Modals, LoadingStates)
├── config/       # Environment and API configuration maps
├── context/      # Global React Contexts (e.g., AuthContext)
├── layouts/      # Application Shells (MainLayout, AuthLayout, Sidebar, Navbar)
├── pages/        # Fully assembled Views/Routes (Dashboard, Properties, etc.)
├── routes/       # React Router configurations and Guards
├── services/     # API Fetch mapping and Core Http client
└── types/        # Global TypeScript Interfaces
```

## 🛠 Available Scripts

- `npm run dev` - Starts the Vite development server.
- `npm run build` - Builds the application for production.
- `npm run preview` - Previews the production build locally.
- `npm run typecheck` - Runs the TypeScript compiler to catch type errors.
- `npm run lint` - Runs ESLint to verify code quality.
