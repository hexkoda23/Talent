# Backend

NestJS backend scaffold for user account creation and authentication.

## Implemented endpoints

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/register-applicant`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/session`
- `GET /api/v1/campuses`
- `GET /api/v1/health`

## Local setup

1. `cd backend`
2. Copy env: `Copy-Item .env.example .env`
3. Start infrastructure: `npm run db:up`
4. Install deps: `npm install`
5. Generate Prisma client: `npm run prisma:generate`
6. Run migrations: `npm run prisma:migrate`
7. Seed baseline data: `npm run prisma:seed`
8. Start API: `npm run dev`

Swagger docs: `http://localhost:4000/api/docs`

## Notes

- Access token and refresh token are returned on signup/login/register.
- Registration supports multipart with required files:
  - `school_id_card_file`
  - `profile_picture_file`
  - `government_id_file`
- `POST /api/v1/auth/register-applicant` requires Bearer auth and creates the application for the signed-in user.
- Local file storage currently writes under `backend/uploads/`.
