# Confess It Deployment

This project is configured to run as a single full-stack web service on Render:
- `client` is built with Vite into `client/dist`
- `server` (Express) serves both API routes and the built frontend

## 1. Push Code To GitHub

Make sure your latest code is on your GitHub repository:

```bash
git add .
git commit -m "Prepare production deployment"
git push origin main
```

## 2. Deploy On Render (Blueprint)

1. Open Render dashboard.
2. Click `New` -> `Blueprint`.
3. Select this GitHub repo.
4. Render will detect `render.yaml` and create the `confess-it` web service.
5. Click `Apply`.

Render uses:
- Build command: `npm ci && npm run build`
- Start command: `npm start`
- Health check: `/api/health`

## 3. Verify Deployment

After deploy finishes, open:
- `https://<your-render-domain>/` (frontend)
- `https://<your-render-domain>/api/questions` (API)
- `https://<your-render-domain>/api/health` (health)

If all endpoints load, everything is online.

## 4. Optional: Custom Domain

1. In Render service settings, open `Custom Domains`.
2. Add your domain/subdomain.
3. Configure DNS records as instructed by Render.

