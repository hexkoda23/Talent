# Talent Nation v0

A full-stack application with a React/Vite frontend and NestJS backend for user account creation, authentication, and talent management.

## Project Structure

```
talent-nation-v0/
├── apps/
│   └── user-app/          # React frontend
├── backend/               # NestJS API
├── extra info/            # Additional documentation
└── README.md
```

## Prerequisites

- **Node.js** (v18+) and **npm** or **bun**
- **PostgreSQL** (for database)
- **Redis** (for caching)
- **Docker** & **Docker Compose** (recommended for infrastructure)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd talent-nation-v0
```

### 2. Setup Backend

```bash
cd backend

# Copy environment file
cp .env.example .env

# Start infrastructure (PostgreSQL + Redis)
npm run db:up

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with baseline data
npm run prisma:seed

# Start the API server
npm run dev
```

The backend will be available at `http://localhost:4000`
Swagger docs: `http://localhost:4000/api/docs`

### 3. Setup Frontend

```bash
cd apps/user-app

# Install dependencies
npm install

# Start dev server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Environment Variables

### Backend (.env)

Required variables (copy from `.env.example`):
- `NODE_ENV` - development/production
- `PORT` - API port (default 4000)
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `JWT_ACCESS_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `FRONTEND_ORIGIN` - Frontend URL for CORS

### Frontend

Frontend configuration is in `apps/user-app/vite.config.ts` and connects to `http://localhost:4000/api/v1` via proxy.

## Available Scripts

### Backend
- `npm run dev` - Start dev server with hot reload
- `npm run build` - Build for production
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run pending migration
- `npm run prisma:seed` - Seed database
- `npm run db:up` - Start Docker containers
- `npm run db:down` - Stop Docker containers

### Frontend
- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests

## Features

### Authentication
- User registration with file uploads
- JWT-based login/logout
- Access and refresh tokens
- Session management

### Endpoints
- `POST /api/v1/auth/signup` - Create account and sign in
- `POST /api/v1/auth/register-applicant` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/session` - Get current session
- `GET /api/v1/campuses` - List campuses
- `GET /api/v1/health` - Health check

## Collaborating

### Syncing with Teammate Changes

If a teammate has frontend changes on a separate branch:

```bash
# Fetch latest remote branches
git fetch origin

# Switch to their branch (if it exists remotely)
git checkout --track origin/their-branch-name

# Or merge their changes into main
git checkout main
git merge origin/their-branch-name
```

### Making Changes

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "feat: your feature"`
3. Push to remote: `git push origin feature/your-feature`
4. Create a Pull Request on GitHub/GitLab

## Troubleshooting

### Backend won't start
- Ensure PostgreSQL and Redis are running: `npm run db:up`
- Check `.env` file has correct database URL
- Run migrations: `npm run prisma:migrate`

### Frontend can't reach backend
- Verify backend is running on port 4000
- Check `FRONTEND_ORIGIN` in backend `.env`
- Verify CORS settings in backend

### Port already in use
- Kill process on port 4000: `npx kill-port 4000`
- Kill process on port 5173: `npx kill-port 5173`

## Database Schema

See [backend/prisma/schema.prisma](backend/prisma/schema.prisma) for the complete schema.

## Notes

- File uploads are stored locally in `backend/uploads/`
- Access and refresh tokens are returned on signup/login/register
- Applicant registration (`/auth/register-applicant`) now requires auth and these files: `school_id_card_file`, `profile_picture_file`, `government_id_file`
