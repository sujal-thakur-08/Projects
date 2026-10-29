# Apple Music Mini Player (Electron)

This is a simple Electron mini-player that loads Apple Music Web in a hidden background window and exposes a compact control UI.

Quick start

1. Install Node.js (v18+ recommended) and Git.
2. In the project folder, install dependencies and run:

```bash
npm install
npm start
```

Build for Windows (optional)

1. Install dev dependencies: `npm install --save-dev electron-builder`
2. Run the packager or create installer:

```bash
npm run pack   # create unpacked build
npm run dist   # create installer (requires electron-builder)
```

Notes

- This uses the web version at https://music.apple.com — the app will control the web player via DOM commands. If you prefer controlling the native Apple Music app, additional native automation tools are required.
- On first run the background window will load Apple Music; you may need to sign in.
- Electron devtools can be enabled in `main.js` for debugging.

Files

- `main.js` — Electron main process and IPC handlers.
- `mini-preload.js` — exposes a safe `miniAPI` for the renderer.
- `preload.js` — background preload stub.
- `renderer/` — mini-player UI.

