# AI-Powered Personal & Multi-Author Blog Platform

A full-stack blog application with JWT authentication, multi-author publishing, a rich text editor, AI-assisted writing tools, nested comments, likes/bookmarks, search and filters, author profiles, and admin moderation.

## Project Structure

```text
Blog Page/
  backend/
    app/
      core/
      routers/
      schemas/
      services/
      main.py
    requirements.txt
    .env.example
  frontend/
    src/
      api/
      components/
      contexts/
      pages/
      App.tsx
      main.tsx
      index.css
    index.html
    package.json
    tailwind.config.js
    postcss.config.js
    tsconfig.json
    vite.config.ts
    .env.example
```

## Features

- JWT register/login with secure password hashing
- Create, edit, publish, delete, and bookmark posts
- TipTap rich text editor with image embeds, links, code blocks, and headings
- AI summary, tag, and writing-assist endpoints with Anthropic/OpenAI fallback support
- Nested comment threads with replies and moderation hooks
- Author profile pages and public post detail pages
- Search and filter by query, tag, author, category, and sort order
- Dark/light mode toggle
- Admin dashboard for user, post, and reported comment management

## Backend Setup

1. Enter the backend folder.
2. Create a virtual environment.
3. Install dependencies from `requirements.txt`.
4. Copy `.env.example` to `.env` and fill in your MongoDB and API keys.
5. Start the API server.

Example:

```powershell
cd "d:\All Projects\Blog Page\backend"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

## Frontend Setup

1. Enter the frontend folder.
2. Install dependencies.
3. Copy `.env.example` to `.env` if you want a custom API base URL.
4. Start Vite.

Example:

```powershell
cd "d:\All Projects\Blog Page\frontend"
npm install
copy .env.example .env
npm run dev
```

## Backend API Notes

- Auth: `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/me`
- Posts: `/api/v1/posts`, `/api/v1/posts/featured`, `/api/v1/posts/{slug}`
- Comments: `/api/v1/posts/{postId}/comments`
- AI: `/api/v1/ai/summarize`, `/api/v1/ai/assist`, `/api/v1/ai/tags`
- Admin: `/api/v1/admin/overview`, `/api/v1/admin/users`, `/api/v1/admin/posts`, `/api/v1/admin/comments/reported`

## Deployment

### Render backend

- Set the root to `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Add environment variables from `.env.example`

### Vercel frontend

- Set the root to `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Add `VITE_API_BASE_URL` pointing at your Render backend URL

## Notes

- MongoDB Atlas is supported through `MONGODB_URI`.
- If no AI API key is configured, the backend falls back to deterministic summary and tag generation.
- The first registered user is promoted to admin automatically so the moderation panel is usable on a fresh install.
