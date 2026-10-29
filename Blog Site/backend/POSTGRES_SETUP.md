# PostgreSQL Setup Guide (Quick Start)

## Quick Setup with Render (Free PostgreSQL Hosting)

**Why Render?** Free PostgreSQL database, no credit card required initially, 90-day free tier.

### Step 1: Create a Render PostgreSQL Database

1. Go to https://render.com and sign up
2. Click "New +" → "PostgreSQL"
3. Fill in:
   - **Name:** `blog-db` (or your preference)
   - **Database:** `blog_db`
   - **User:** `blog_user` (or your preference)
   - **Region:** Pick closest to you
   - **Keep other defaults**
4. Click "Create Database" (takes ~5 min)
5. Once ready, copy the **External Database URL** (looks like: `postgresql://user:password@host:port/db`)

### Step 2: Update Your Backend `.env`

```bash
cd backend
```

Edit `.env`:

```env
DATABASE_URL="postgresql://blog_user:PASSWORD@HOST:5432/blog_db"
```

Replace `PASSWORD` and `HOST` from Render's connection string.

### Step 3: Deploy the Schema

```bash
npx prisma generate
npx prisma migrate deploy
node prisma/seed.js
```

### Step 4: Test

```bash
npm start
```

Visit `http://localhost:4000/api/blogs` → should see seeded blogs from PostgreSQL.

---

## Alternative Free Options

### Option A: Railway.app

1. Go to https://railway.app and sign up (GitHub login easiest)
2. Create new project → Add PostgreSQL
3. Copy connection string from the UI
4. Update `.env` and follow Step 2-4 above

### Option B: Neon (Serverless PostgreSQL)

1. Go to https://neon.tech and sign up
2. Create a new project
3. Go to Connection String → Pooling (recommended)
4. Copy connection string
5. Follow Step 2-4 above

### Option C: Supabase (PostgreSQL + extras)

1. Go to https://supabase.com and sign up
2. Create new project (free tier available)
3. Go to Settings → Database → Connection String
4. Copy the `full_url` (PostgreSQL URI)
5. Follow Step 2-4 above

---

## Reverting to SQLite

If you want to switch back to SQLite:

1. Update `backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "sqlite"  # Change back from "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Update `backend/.env`:

```env
DATABASE_URL="file:./dev.db"
```

3. Run:

```bash
npx prisma generate
npx prisma migrate dev --name back_to_sqlite
npm start
```

---

## Troubleshooting

**"PrismaClientInitializationError: Can't reach database server"**
- Check `DATABASE_URL` is correct
- Verify internet connection
- Ensure PostgreSQL service is running (if local)
- For Render/Railway: check if database is "available" in UI

**"relation does not exist"**
- Run `npx prisma migrate deploy` to create tables

**"permission denied"**
- Ensure user in connection string has proper permissions
- Use the credentials provided by your database service

---

## Environment Variables for Production

For production deployments (Vercel, Render, Railway, etc.), set these environment variables in your deployment platform's settings:

```
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-production-secret-key
NODE_ENV=production
```
