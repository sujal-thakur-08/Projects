# Confess It

A full-stack love quiz app with a Vite React client and an Express backend.

## What it does

- Serves the quiz UI from the built client
- Exposes API endpoints for quiz questions, health checks, and final content
- Supports local development with a Vite dev server proxy to the backend
- Deploys as a single Render web service

## Project Layout

- `client/` - React UI built with Vite
- `server/` - Express API and production static file hosting
- `render.yaml` - Render Blueprint for online deployment

## Run locally

Install dependencies from the repo root:

```powershell
npm install
```

Run the client and server together:

```powershell
npm run dev
```

The app uses these local ports:

- Client: http://localhost:5173
- Server: http://localhost:5000

## Build for production

```powershell
npm run build
```

This installs dependencies for both packages and builds the client into `client/dist`.

## Deploy on Render

This repo already includes [render.yaml](render.yaml), so the simplest online path is Render Blueprint deploy.

1. Push the repo to GitHub.
2. Open the Render dashboard.
3. Create a new Blueprint from this repository.
4. Render creates the web service defined in [render.yaml](render.yaml).
5. Wait for the deploy to finish, then open the Render URL.

Render configuration:

- Build command: `npm run build`
- Start command: `npm start`
- Health check: `/api/health`

## GitHub publish readiness

The repository is already set up to be GitHub-safe:

- `node_modules/` is ignored
- `client/dist/` is ignored
- local `.env` files are ignored

If you want the client to talk to a different backend later, keep the Vite proxy in `client/vite.config.js` aligned with your server URL.

## API endpoints

- `GET /api/questions`
- `GET /api/final-content`
- `GET /api/health`

## Notes

- Production serves the built client from the Express server.
- The app does not require a separate database or external secret to run.
