# Login Tracker

Simple demo that tracks login state with React Context API, persists username in localStorage, and tracks total logins across sessions/tabs (live sync via storage events).

## Quick start

1. cd into the project folder:

   ```bash
   cd Experimant-1/login-tracker
   ```

2. Install deps:

   ```bash
   npm install
   ```

3. Start dev server:

   ```bash
   npm run dev
   ```

Open the local dev URL Vite prints (usually http://localhost:5173).

## Deploy online

This app is ready for Netlify or other static hosting.

### Netlify

1. Push the repo to GitHub.
2. Set the project root to `Experimant-1/login-tracker`.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. The included [netlify.toml](netlify.toml) handles SPA-style refreshes.
