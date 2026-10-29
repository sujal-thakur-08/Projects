# Database Setup Guide

## SQLite (Local Development)

1. Install dependencies

```bash
cd backend
npm install
```

2. Ensure `backend/.env` contains:

```
DATABASE_URL="file:./dev.db"
```

3. Generate Prisma client and apply migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
node prisma/seed.js
npm start
```

---

## PostgreSQL (Production / Remote)

### Option A: Using a Managed Service (Recommended)

Use **Railway.app**, **Render.com**, **Neon.tech**, or **Supabase** for free PostgreSQL hosting.

1. Create a PostgreSQL database on your chosen service
2. Get the connection string (looks like: `postgresql://user:password@host:port/database_name`)
3. Update `backend/.env`:

```
DATABASE_URL="postgresql://user:password@host:port/blog_db"
```

4. Update `backend/prisma/schema.prisma` (should already be PostgreSQL):

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

5. Generate Prisma client and apply migrations

```bash
npx prisma generate
npx prisma migrate deploy
node prisma/seed.js
npm start
```

### Option B: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database:

```bash
createdb blog_db
```

3. Update `.env`:

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/blog_db"
```

4. Apply migrations and seed:

```bash
npx prisma generate
npx prisma migrate deploy
node prisma/seed.js
npm start
```

---

## Switching Between SQLite and PostgreSQL

The schema automatically adapts based on the `provider` field in `prisma/schema.prisma`. Just:

1. Update the `provider` (sqlite or postgresql)
2. Update `DATABASE_URL` in `.env`
3. Run `npx prisma generate`
4. Run `npx prisma migrate deploy` or `npx prisma migrate dev` for development

---

## Environment Variables

Create `.env` in the `backend/` folder:

```env
DATABASE_URL="file:./dev.db"  # SQLite
# or
DATABASE_URL="postgresql://user:pass@host:port/db"  # PostgreSQL

JWT_SECRET="your-secret-key"  # Optional: defaults to "dev-only-change-me"
```
