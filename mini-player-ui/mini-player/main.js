const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const https = require('https');
const crypto = require('crypto');
const { exec, execFile } = require('child_process');

// Force Chromium cache/session storage into writable app data paths on Windows.
const userDataPath = app.getPath('userData');
const sessionDataPath = path.join(userDataPath, 'session-data');
const diskCachePath = path.join(userDataPath, 'disk-cache');
try {
    if (!fs.existsSync(sessionDataPath)) fs.mkdirSync(sessionDataPath, { recursive: true });
    if (!fs.existsSync(diskCachePath)) fs.mkdirSync(diskCachePath, { recursive: true });
    app.setPath('sessionData', sessionDataPath);
    app.commandLine.appendSwitch('disk-cache-dir', diskCachePath);
    app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
    app.commandLine.appendSwitch('disable-http-cache');
    app.commandLine.appendSwitch('disk-cache-size', '1');
} catch (e) {
    console.warn('Failed to set cache/session paths', e);
}

let bgWindow; // hidden window loading music.apple.com
let miniWindow;
let tray = null;
let appleTokens = {
    developerToken: '',
    musicUserToken: '',
    storefront: 'us'
};

function getAppleTokensFile() {
    return path.join(app.getPath('userData'), 'apple_tokens.json');
}

async function loadAppleTokens() {
    try {
        const file = getAppleTokensFile();
        if (!fs.existsSync(file)) return;
        const txt = await fsPromises.readFile(file, 'utf8');
        const parsed = JSON.parse(txt || '{}');
        appleTokens = {
            developerToken: String(parsed.developerToken || '').trim(),
            musicUserToken: String(parsed.musicUserToken || '').trim(),
            storefront: String(parsed.storefront || 'us').trim() || 'us'
        };
    } catch (e) {
        console.warn('Failed to load Apple tokens', e);
    }
}

async function saveAppleTokens() {
    const file = getAppleTokensFile();
    await fsPromises.writeFile(file, JSON.stringify(appleTokens, null, 2), 'utf8');
}

function buildArtworkUrl(raw) {
    if (!raw) return '';
    if (typeof raw === 'string') return raw;
    const template = raw.url || '';
    if (!template) return '';
    return template.replace('{w}', String(raw.width || 300)).replace('{h}', String(raw.height || 300));
}

function requestJson(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, { method: 'GET', headers }, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk.toString(); });
            res.on('end', () => {
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 240)}`));
                    return;
                }
                try {
                    resolve(JSON.parse(body || '{}'));
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function searchAppleCatalog(query) {
    if (!appleTokens.developerToken || !query) return [];
    const storefront = appleTokens.storefront || 'us';
    const endpoint = `https://api.music.apple.com/v1/catalog/${encodeURIComponent(storefront)}/search?term=${encodeURIComponent(query)}&types=songs&limit=12`;
    const headers = {
        'Authorization': `Bearer ${appleTokens.developerToken}`,
        'User-Agent': 'MiniPlayer/1.0'
    };
    if (appleTokens.musicUserToken) headers['Music-User-Token'] = appleTokens.musicUserToken;

    const payload = await requestJson(endpoint, headers);
    const songs = payload?.results?.songs?.data || [];
    return songs.map((item) => {
        const attr = item?.attributes || {};
        return {
            title: attr.name || '',
            artist: attr.artistName || '',
            artwork: buildArtworkUrl(attr.artwork),
            url: attr.url || ''
        };
    }).filter((r) => r.title || r.url);
}

async function openUrlAndTryPlay(url) {
    if (!bgWindow || !url) return false;
    await bgWindow.webContents.loadURL(url);
    const res = await bgWindow.webContents.executeJavaScript(`(async function(){
        function tryPlay(){
            const buttons = Array.from(document.querySelectorAll('button,[role="button"]'));
            for (const el of buttons) {
                const t = ((el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '') + ' ' + (el.innerText || '')).toLowerCase();
                if ((t.includes('play') || t.includes('preview')) && !el.disabled) { el.click(); return true; }
            }
            const audio = document.querySelector('audio');
            if (audio) { if (audio.paused) { audio.play(); return true; } return true; }
            return false;
        }
        if (tryPlay()) return true;
        for (let i = 0; i < 10; i++) { await new Promise(r => setTimeout(r, 450)); if (tryPlay()) return true; }
        return false;
    })()`, true);
    return !!res;
}

function createWindows() {
    // Background window (hidden) loads Apple Music web
    bgWindow = new BrowserWindow({
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            autoplayPolicy: 'no-user-gesture-required',
            partition: 'applemusic-memory'
        }
    });

    // Use a desktop-like user agent and allow autoplay so playback can be controlled
    const AM_URL = 'https://music.apple.com';
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/605.1.15';
    bgWindow.loadURL(AM_URL, { userAgent: ua });
    bgWindow.webContents.on('did-finish-load', () => {
        console.log('Background window loaded:', bgWindow.webContents.getURL());
    });
    bgWindow.webContents.on('did-fail-load', (e, errCode, errDesc, validatedURL) => {
        console.warn('Background window failed to load', errCode, errDesc, validatedURL);
    });

    // Mini control window
    miniWindow = new BrowserWindow({
        width: 560,
        height: 170,
        minWidth: 560,
        minHeight: 170,
        maxWidth: 560,
        maxHeight: 170,
        useContentSize: true,
        frame: false,
        resizable: false,
        alwaysOnTop: true,
        center: true,
        transparent: false,
        backgroundColor: '#0b0b0d',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'mini-preload.js')
        }
    });

    miniWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

    ensureTray();

    // Hide to tray instead of quitting when window is closed
    miniWindow.on('close', (e) => {
        if (!app.isQuitting) {
            e.preventDefault();
            miniWindow.hide();
        }
    });

    // Optional: open devtools for debugging
    // miniWindow.webContents.openDevTools({ mode: 'detach' });
}

// create a tray icon and behavior
function ensureTray() {
    try {
        if (tray) return;
        const iconPath = path.join(__dirname, 'assets', 'icon.svg');
        const nimg = nativeImage.createFromPath(iconPath);
        tray = new Tray(nimg);
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Show Mini Player', click: () => { if (miniWindow) { miniWindow.show(); miniWindow.focus(); } } },
            { label: 'Open Apple Music', click: () => { if (bgWindow) { bgWindow.show(); bgWindow.focus(); } } },
            { type: 'separator' },
            { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
        ]);
        tray.setToolTip('Apple Music Mini');
        tray.setContextMenu(contextMenu);
        tray.on('double-click', () => { if (miniWindow) { miniWindow.show(); miniWindow.focus(); } });
    } catch (e) { console.warn('Tray creation failed', e); }
}

// create cache dir for artwork
function ensureCacheDir() {
    const d = path.join(__dirname, 'assets', 'cache');
    try { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); } catch (e) { console.warn('cache dir create failed', e); }
    return d;
}

// download artwork to local cache and return file:// path
ipcMain.handle('player:cacheArtwork', async (_ev, url) => {
    if (!url) return null;
    try {
        const cacheDir = ensureCacheDir();
        const hash = crypto.createHash('sha1').update(url).digest('hex');
        const ext = (url.split('.').pop().split('?')[0] || 'jpg').slice(0, 5);
        const fileName = `${hash}.${ext}`;
        const filePath = path.join(cacheDir, fileName);
        if (fs.existsSync(filePath)) return `file://${filePath}`;
        // download
        await new Promise((resolve, reject) => {
            const req = https.get(url, (res) => {
                if (res.statusCode !== 200) { reject(new Error('bad status ' + res.statusCode)); return; }
                const file = fs.createWriteStream(filePath);
                res.pipe(file);
                file.on('finish', () => { file.close(resolve); });
                file.on('error', (err) => { reject(err); });
            });
            req.on('error', reject);
        });
        return `file://${filePath}`;
    } catch (e) { console.warn('cache failed', e); return null; }
});

app.whenReady().then(async () => {
    await loadAppleTokens();
    createWindows();

    // register global media keys
    try {
        globalShortcut.register('MediaPlayPause', () => { if (bgWindow) bgWindow.webContents.executeJavaScript(`(function(){ const b = document.querySelector('button[aria-label*="Play"]') || document.querySelector('button[aria-label*="Pause"]') || document.querySelector('button[title*="Play"]') || document.querySelector('button[title*="Pause"]'); if(b){ b.click(); } else { const a=document.querySelector('audio'); if(a){ if(a.paused) a.play(); else a.pause(); } } })()`); });
        globalShortcut.register('MediaNextTrack', () => { if (bgWindow) bgWindow.webContents.executeJavaScript(`(function(){ const s=['button[aria-label*="Next"]','button[title*="Next"]']; for(const sel of s){ const el=document.querySelector(sel); if(el){el.click(); return;} } })()`); });
        globalShortcut.register('MediaPreviousTrack', () => { if (bgWindow) bgWindow.webContents.executeJavaScript(`(function(){ const s=['button[aria-label*="Previous"]','button[title*="Previous"]']; for(const sel of s){ const el=document.querySelector(sel); if(el){el.click(); return;} } })()`); });
    } catch (e) { console.warn('globalShortcut failed', e); }

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindows();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
    try { globalShortcut.unregisterAll(); } catch (e) { }
});

// IPC handlers from mini window
ipcMain.handle('player:togglePlay', async () => {
    if (!bgWindow) return { ok: false };
    try {
        const res = await bgWindow.webContents.executeJavaScript(`(function(){
            function findByKeyword(words){
                const buttons = Array.from(document.querySelectorAll('button,[role="button"]'));
                for (const el of buttons) {
                    const t = ((el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '') + ' ' + (el.innerText || '')).toLowerCase();
                    if (words.some(w => t.includes(w)) && !el.disabled) return el;
                }
                return null;
            }
            const btn = findByKeyword(['play', 'pause']);
            if (btn) { btn.click(); return true; }
            const explicit = document.querySelector('.web-chrome-playback-controls__playpause-button button');
            if (explicit) { explicit.click(); return true; }
            const audio = document.querySelector('audio');
            if (audio) { if (audio.paused) audio.play(); else audio.pause(); return true; }
            document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
            return true;
    })()`);
        return { ok: !!res };
    } catch (e) {
        return { ok: false, error: String(e) };
    }
});

ipcMain.handle('player:next', async () => {
    if (!bgWindow) return { ok: false };
    try {
        const res = await bgWindow.webContents.executeJavaScript(`(function(){
            const buttons = Array.from(document.querySelectorAll('button,[role="button"]'));
            for (const el of buttons) {
                const t = ((el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '') + ' ' + (el.innerText || '')).toLowerCase();
                if ((t.includes('next') || t.includes('skip forward') || t.includes('forward')) && !el.disabled) { el.click(); return true; }
            }
      return false;
    })()`);
        return { ok: !!res };
    } catch (e) { return { ok: false, error: String(e) }; }
});

ipcMain.handle('player:prev', async () => {
    if (!bgWindow) return { ok: false };
    try {
        const res = await bgWindow.webContents.executeJavaScript(`(function(){
            const buttons = Array.from(document.querySelectorAll('button,[role="button"]'));
            for (const el of buttons) {
                const t = ((el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '') + ' ' + (el.innerText || '')).toLowerCase();
                if ((t.includes('previous') || t.includes('skip back') || t.includes('back')) && !el.disabled) { el.click(); return true; }
            }
      return false;
    })()`);
        return { ok: !!res };
    } catch (e) { return { ok: false, error: String(e) }; }
});

ipcMain.handle('player:shuffle', async () => {
    if (!bgWindow) return { ok: false };
    try {
        const res = await bgWindow.webContents.executeJavaScript(`(function(){
            const buttons = Array.from(document.querySelectorAll('button,[role="button"]'));
            for (const el of buttons) {
                const t = ((el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '')).toLowerCase();
                if (t.includes('shuffle') && !el.disabled) { el.click(); return true; }
            }
            return false;
        })()`);
        return { ok: !!res };
    } catch (e) { return { ok: false, error: String(e) }; }
});

ipcMain.handle('player:repeat', async () => {
    if (!bgWindow) return { ok: false };
    try {
        const res = await bgWindow.webContents.executeJavaScript(`(function(){
            const buttons = Array.from(document.querySelectorAll('button,[role="button"]'));
            for (const el of buttons) {
                const t = ((el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '')).toLowerCase();
                if (t.includes('repeat') && !el.disabled) { el.click(); return true; }
            }
            return false;
        })()`);
        return { ok: !!res };
    } catch (e) { return { ok: false, error: String(e) }; }
});

// v is 0..1
ipcMain.handle('player:setVolume', async (_ev, v) => {
    if (!bgWindow) return { ok: false };
    const vol = Math.max(0, Math.min(1, Number(v) || 0));
    try {
        const res = await bgWindow.webContents.executeJavaScript(`(function(){
            try {
                const audio = document.querySelector('audio');
                if (audio) { audio.volume = ${vol}; }
                const slider = document.querySelector('input[type="range"][aria-label*="olume" i]');
                if (slider) {
                    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    setter.call(slider, String(${vol} * (Number(slider.max) || 1)));
                    slider.dispatchEvent(new Event('input', { bubbles: true }));
                    slider.dispatchEvent(new Event('change', { bubbles: true }));
                }
                return true;
            } catch (e) { return false; }
        })()`);
        return { ok: !!res, volume: vol };
    } catch (e) { return { ok: false, error: String(e) }; }
});

// ratio is 0..1 of track duration
ipcMain.handle('player:seek', async (_ev, ratio) => {
    if (!bgWindow) return { ok: false };
    const r = Math.max(0, Math.min(1, Number(ratio) || 0));
    try {
        const res = await bgWindow.webContents.executeJavaScript(`(function(){
            try {
                const audio = document.querySelector('audio');
                if (audio && audio.duration) { audio.currentTime = audio.duration * ${r}; return true; }
                const slider = document.querySelector('input[type="range"][aria-label*="osition" i], input[type="range"][aria-label*="progress" i]');
                if (slider) {
                    const max = Number(slider.max) || 1;
                    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    setter.call(slider, String(max * ${r}));
                    slider.dispatchEvent(new Event('input', { bubbles: true }));
                    slider.dispatchEvent(new Event('change', { bubbles: true }));
                    return true;
                }
                return false;
            } catch (e) { return false; }
        })()`);
        return { ok: !!res };
    } catch (e) { return { ok: false, error: String(e) }; }
});

ipcMain.handle('window:hide', async () => {
    try { if (miniWindow) miniWindow.hide(); return { ok: true }; } catch (e) { return { ok: false, error: String(e) }; }
});

ipcMain.handle('window:quit', async () => {
    try { app.isQuitting = true; app.quit(); return { ok: true }; } catch (e) { return { ok: false, error: String(e) }; }
});

ipcMain.handle('player:getInfo', async () => {
    if (!bgWindow) return { ok: false };
    try {
        const info = await bgWindow.webContents.executeJavaScript(`(function(){
            // try to extract track info and artwork
            try{
                const title = document.querySelector('[data-test-now-playing-title]')?.innerText
                    || document.querySelector('.webplayer-track__title')?.innerText
                    || document.title || '';
                const artist = document.querySelector('[data-test-now-playing-artist]')?.innerText
                    || document.querySelector('.webplayer-track__byline')?.innerText || '';
                // try to find artwork
                let artwork = '';
                const artEl = document.querySelector('[data-test-now-playing-artwork] img')
                    || document.querySelector('.webplayer-album-art img')
                    || document.querySelector('.webplayer-artwork__image img')
                    || document.querySelector('meta[property="og:image"]');
                if(artEl){ artwork = artEl.src || artEl.getAttribute('content') || '' }
                // check audio or play button state
                let playing = null;
                const audio = document.querySelector('audio');
                if(audio) playing = !audio.paused;
                else {
                    const buttons = Array.from(document.querySelectorAll('button,[role="button"]'));
                    const hasPause = buttons.some((el) => (((el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '') + ' ' + (el.innerText || '')).toLowerCase().includes('pause')));
                    const hasPlay = buttons.some((el) => (((el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '') + ' ' + (el.innerText || '')).toLowerCase().includes('play')));
                    if(hasPause) playing = true;
                    else if(hasPlay) playing = false;
                }

                function toggleState(keyword){
                    const buttons = Array.from(document.querySelectorAll('button,[role="button"]'));
                    const btn = buttons.find((el) => ((el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '')).toLowerCase().includes(keyword));
                    if (!btn) return null;
                    const pressed = btn.getAttribute('aria-pressed');
                    if (pressed !== null) return pressed === 'true';
                    return /is-active|active|selected|enabled/i.test(btn.className || '');
                }
                const shuffle = toggleState('shuffle');
                const repeat = toggleState('repeat');

                let isPreview = false;
                try {
                    const all = Array.from(document.querySelectorAll('span,div,button'));
                    isPreview = all.some((el) => (el.childElementCount === 0) && (el.innerText || '').trim().toUpperCase() === 'PREVIEW');
                } catch (e) {}

                let currentTime = null, duration = null, volume = null;
                if (audio) {
                    currentTime = Number.isFinite(audio.currentTime) ? audio.currentTime : null;
                    duration = Number.isFinite(audio.duration) ? audio.duration : null;
                    volume = Number.isFinite(audio.volume) ? audio.volume : null;
                }
                if (volume === null) {
                    const vSlider = document.querySelector('input[type="range"][aria-label*="olume" i]');
                    if (vSlider) { const max = Number(vSlider.max) || 1; volume = Number(vSlider.value) / max; }
                }

                return { title, artist, artwork, playing, shuffle, repeat, isPreview, currentTime, duration, volume };
            }catch(e){ return { title: document.title || '', artist: '', artwork: '', playing: null, shuffle: null, repeat: null, isPreview: false, currentTime: null, duration: null, volume: null }; }
        })()`);
        return { ok: true, info };
    } catch (e) { return { ok: false, error: String(e) }; }
});

ipcMain.handle('player:openAppleMusic', async () => {
    if (!bgWindow) return { ok: false };
    try { bgWindow.show(); bgWindow.focus(); return { ok: true }; } catch (e) { return { ok: false, error: String(e) }; }
});

// search for a query on music.apple.com and try to play the first matching track
ipcMain.handle('player:searchAndPlay', async (_ev, query) => {
    if (!bgWindow || !query) return { ok: false };
    try {
        if (appleTokens.developerToken) {
            try {
                const viaApi = await searchAppleCatalog(query);
                if (viaApi.length && viaApi[0].url) {
                    const played = await openUrlAndTryPlay(viaApi[0].url);
                    if (played) return { ok: true, source: 'apple-api' };
                }
            } catch (apiErr) {
                console.warn('Apple API search failed, falling back to web selectors', apiErr);
            }
        }
        const AM_SEARCH = `https://music.apple.com/search?term=${encodeURIComponent(query)}`;
        // navigate to search URL in background window
        await bgWindow.webContents.loadURL(AM_SEARCH);
        // allow page scripts to settle and then attempt to click a play button or track link
        const res = await bgWindow.webContents.executeJavaScript(`(async function(){
            function tryClick(){
                const buttons = Array.from(document.querySelectorAll('button,[role="button"]'));
                for (const el of buttons) {
                    const t = ((el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '') + ' ' + (el.innerText || '')).toLowerCase();
                    if ((t.includes('play') || t.includes('preview')) && !el.disabled) { el.click(); return true; }
                }
                const explicit = document.querySelector('.web-chrome-playback-controls__playpause-button button');
                if (explicit) { explicit.click(); return true; }
                // fallback: click the first track link
                const track = document.querySelector('a[href*="/song/"]') || document.querySelector('a[href*="/album/"]') || document.querySelector('a[data-test-song-row]');
                if(track){ track.click(); return true; }
                return false;
            }
            // try repeatedly for a few seconds while the page settles
            if(tryClick()) return true;
            for(let i=0;i<10;i++){ await new Promise(r=>setTimeout(r,500)); if(tryClick()) return true; }
            return false;
        })()` , true);
        return { ok: !!res };
    } catch (e) { return { ok: false, error: String(e) }; }
});

// return a list of search results (title, artist, artwork, url) by inspecting the Apple Music search page
ipcMain.handle('player:search', async (_ev, query) => {
    if (!bgWindow || !query) return { ok: false, results: [] };
    try {
        if (appleTokens.developerToken) {
            try {
                const apiResults = await searchAppleCatalog(query);
                if (apiResults.length) return { ok: true, source: 'apple-api', results: apiResults };
            } catch (apiErr) {
                console.warn('Apple API search failed, falling back to DOM search', apiErr);
            }
        }
        const AM_SEARCH = `https://music.apple.com/search?term=${encodeURIComponent(query)}`;
        await bgWindow.webContents.loadURL(AM_SEARCH);
        // give page time to settle and extract possible results
        const results = await bgWindow.webContents.executeJavaScript(`(function(){
            try{
                const rows = [];
                // common result selectors (fallbacks)
                const items = document.querySelectorAll('div.songs-list-row, li.songs-list-row, div.search-results__item, .search-result-item');
                if(items && items.length){
                    for(let i=0;i<items.length && rows.length<12;i++){
                        const el = items[i];
                        const title = el.querySelector('[data-test-song-title], .songs-list-row__song-name, .search-result__title')?.innerText || el.querySelector('h3')?.innerText || '';
                        const artist = el.querySelector('[data-test-artist-name], .songs-list-row__by-line, .search-result__subtitle')?.innerText || '';
                        const art = el.querySelector('img')?.src || '';
                        const a = el.querySelector('a[href*="/song/"]') || el.querySelector('a');
                        const url = a ? a.href : '';
                        if(title) rows.push({ title: title.trim(), artist: artist.trim(), artwork: art, url });
                    }
                }
                // fallback: try picking track links
                if(rows.length===0){
                    const links = document.querySelectorAll('a[href*="/song/"]');
                    for(let i=0;i<links.length && rows.length<12;i++){
                        const a = links[i];
                        const title = a.innerText || a.querySelector('h3')?.innerText || '';
                        const url = a.href;
                        rows.push({ title: title.trim(), artist: '', artwork: '', url });
                    }
                }
                return rows;
            }catch(e){ return []; }
        })()` , true);
        return { ok: true, results };
    } catch (e) { return { ok: false, error: String(e), results: [] }; }
});

// open a URL in the background window and try to start playback
ipcMain.handle('player:openUrl', async (_ev, url) => {
    if (!bgWindow || !url) return { ok: false };
    try {
        const played = await openUrlAndTryPlay(url);
        return { ok: !!played };
    } catch (e) { return { ok: false, error: String(e) }; }
});

ipcMain.handle('appleTokens:get', async () => {
    return {
        ok: true,
        developerToken: appleTokens.developerToken || '',
        musicUserToken: appleTokens.musicUserToken || '',
        storefront: appleTokens.storefront || 'us'
    };
});

ipcMain.handle('appleTokens:set', async (_ev, tokens) => {
    try {
        const developerToken = String(tokens?.developerToken || '').trim();
        const musicUserToken = String(tokens?.musicUserToken || '').trim();
        const storefront = String(tokens?.storefront || 'us').trim() || 'us';
        appleTokens = { developerToken, musicUserToken, storefront };
        await saveAppleTokens();
        return { ok: true };
    } catch (e) {
        return { ok: false, error: String(e) };
    }
});

// Fetch lyrics via Genius (requires token) by searching then scraping the song page HTML
ipcMain.handle('lyrics:fetchGenius', async (_ev, { artist, title, token }) => {
    try {
        if (!token) return { ok: false, error: 'no-token' };
        const q = encodeURIComponent((artist || '') + ' ' + (title || ''));
        const options = {
            hostname: 'api.genius.com',
            path: `/search?q=${q}`,
            headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'MiniPlayer/1.0' }
        };
        const searchRes = await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (d) => body += d.toString());
                res.on('end', () => resolve({ status: res.statusCode, body }));
            });
            req.on('error', reject); req.end();
        });
        if (searchRes.status !== 200) return { ok: false, error: 'search-failed' };
        const j = JSON.parse(searchRes.body || '{}');
        const hits = j.response && j.response.hits ? j.response.hits : [];
        if (!hits.length) return { ok: false, error: 'no-hits' };
        const pathUrl = hits[0].result && hits[0].result.url ? hits[0].result.url : null;
        if (!pathUrl) return { ok: false, error: 'no-url' };
        // fetch page HTML and try to extract lyrics
        const htmlRes = await new Promise((resolve, reject) => {
            https.get(pathUrl, { headers: { 'User-Agent': 'MiniPlayer/1.0' } }, (res) => {
                let b = '';
                res.on('data', (d) => b += d.toString());
                res.on('end', () => resolve({ status: res.statusCode, body: b }));
            }).on('error', reject);
        });
        if (htmlRes.status !== 200) return { ok: false, error: 'fetch-page-failed' };
        const html = htmlRes.body;
        // attempt to extract lyrics blocks
        const m = html.match(/<div[^>]*class="Lyrics__Root[^"]*"[\s\S]*?<\/div>\s*<\/div>/i);
        let lyrics = '';
        if (m && m[0]) {
            // strip tags
            lyrics = m[0].replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, '').replace(/\s{2,}/g, '\n').trim();
        } else {
            // fallback: look for <div class="lyrics"> block
            const m2 = html.match(/<div[^>]*class="lyrics"[^>]*>([\s\S]*?)<\/div>/i);
            if (m2 && m2[1]) lyrics = m2[1].replace(/<[^>]+>/g, '').trim();
        }
        if (!lyrics) return { ok: false, error: 'no-lyrics-found' };
        return { ok: true, lyrics };
    } catch (e) { return { ok: false, error: String(e) }; }
});

// Simple playlist persistence: save and load playlist JSON in userData
ipcMain.handle('playlist:save', async (_ev, tracks) => {
    try {
        const d = app.getPath('userData');
        const file = path.join(d, 'playlist.json');
        await fsPromises.writeFile(file, JSON.stringify(tracks || []), 'utf8');
        return { ok: true, path: file };
    } catch (e) { return { ok: false, error: String(e) }; }
});

ipcMain.handle('playlist:load', async () => {
    try {
        const d = app.getPath('userData');
        const file = path.join(d, 'playlist.json');
        if (!fs.existsSync(file)) return { ok: true, tracks: [] };
        const txt = await fsPromises.readFile(file, 'utf8');
        const tracks = JSON.parse(txt || '[]');
        return { ok: true, tracks };
    } catch (e) { return { ok: false, error: String(e) }; }
});

// Session persistence: save and restore cookies for the background partition
ipcMain.handle('session:openLoginWindow', async () => {
    try {
        if (!bgWindow) return { ok: false, error: 'no-bg' };
        bgWindow.show(); bgWindow.focus();
        return { ok: true };
    } catch (e) { return { ok: false, error: String(e) }; }
});

ipcMain.handle('session:save', async () => {
    try {
        if (!bgWindow) return { ok: false, error: 'no-bg' };
        const ses = bgWindow.webContents.session;
        const cookies = await ses.cookies.get({});
        const d = app.getPath('userData');
        const file = path.join(d, 'session_cookies.json');
        await fsPromises.writeFile(file, JSON.stringify(cookies, null, 2), 'utf8');
        return { ok: true, path: file, count: cookies.length };
    } catch (e) { return { ok: false, error: String(e) }; }
});

ipcMain.handle('session:restore', async () => {
    try {
        if (!bgWindow) return { ok: false, error: 'no-bg' };
        const d = app.getPath('userData');
        const file = path.join(d, 'session_cookies.json');
        if (!fs.existsSync(file)) return { ok: false, error: 'no-file' };
        const txt = await fsPromises.readFile(file, 'utf8');
        const cookies = JSON.parse(txt || '[]');
        const ses = bgWindow.webContents.session;
        for (const c of cookies) {
            try {
                // construct a URL for cookie setting
                const domain = c.domain && c.domain.startsWith('.') ? c.domain.slice(1) : (c.domain || '');
                const url = `${c.secure ? 'https' : 'http'}://${domain || 'music.apple.com'}${c.path || '/'}`;
                const details = { url, name: c.name, value: c.value, path: c.path || '/', secure: !!c.secure, httpOnly: !!c.httpOnly };
                if (c.expirationDate) details.expirationDate = c.expirationDate;
                await ses.cookies.set(details);
            } catch (inner) { /* continue */ }
        }
        return { ok: true, restored: cookies.length };
    } catch (e) { return { ok: false, error: String(e) }; }
});

ipcMain.handle('session:clear', async () => {
    try {
        if (!bgWindow) return { ok: false, error: 'no-bg' };
        const ses = bgWindow.webContents.session;
        await ses.clearStorageData({ storages: ['cookies'] });
        const d = app.getPath('userData');
        const file = path.join(d, 'session_cookies.json');
        try { if (fs.existsSync(file)) await fsPromises.unlink(file); } catch (e) { }
        return { ok: true };
    } catch (e) { return { ok: false, error: String(e) }; }
});

// send media key via PowerShell fallback
function sendMediaKeyVK(vk) {
    return new Promise((resolve) => {
        // Build a PowerShell command to add the keybd_event import and invoke it.
        const psCmd = `Add-Type -MemberDefinition '[System.Runtime.InteropServices.DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, int dwFlags, int dwExtraInfo);' -Name K -Namespace P;[P.K]::keybd_event(${vk}, 0, 0, 0)`;
        // Use execFile to avoid shell quoting issues
        execFile('powershell', ['-NoProfile', '-Command', psCmd], { windowsHide: true }, (err) => {
            resolve(!err);
        });
    });
}

// Native control handlers (iTunes COM if available, otherwise send media keys)
ipcMain.handle('native:togglePlay', async () => {
    try {
        try {
            const winax = require('winax');
            const iTunes = new winax.Object('iTunes.Application');
            // Try Play/Pause via COM
            if (iTunes) { iTunes.PlayPause(); return { ok: true, method: 'com' }; }
        } catch (e) {
            // fallback to media key
            const ok = await sendMediaKeyVK(0xB3); // VK_MEDIA_PLAY_PAUSE
            return { ok, method: 'key' };
        }
    } catch (e) { return { ok: false, error: String(e) }; }
});

ipcMain.handle('native:next', async () => {
    try {
        try {
            const winax = require('winax');
            const iTunes = new winax.Object('iTunes.Application');
            if (iTunes) { iTunes.NextTrack(); return { ok: true, method: 'com' }; }
        } catch (e) {
            const ok = await sendMediaKeyVK(0xB0); // VK_MEDIA_NEXT_TRACK
            return { ok, method: 'key' };
        }
    } catch (e) { return { ok: false, error: String(e) }; }
});

ipcMain.handle('native:prev', async () => {
    try {
        try {
            const winax = require('winax');
            const iTunes = new winax.Object('iTunes.Application');
            if (iTunes) { iTunes.PreviousTrack(); return { ok: true, method: 'com' }; }
        } catch (e) {
            const ok = await sendMediaKeyVK(0xB1); // VK_MEDIA_PREV_TRACK
            return { ok, method: 'key' };
        }
    } catch (e) { return { ok: false, error: String(e) }; }
});

ipcMain.handle('native:getInfo', async () => {
    try {
        try {
            const winax = require('winax');
            const iTunes = new winax.Object('iTunes.Application');
            if (iTunes) {
                const track = iTunes.CurrentTrack;
                if (track) {
                    const title = track.Name || '';
                    const artist = track.Artist || '';
                    // artwork via COM is complex; leave blank for now
                    return { ok: true, info: { title, artist, artwork: '' }, method: 'com' };
                }
            }
        } catch (e) {
            return { ok: false, error: 'native-com-unavailable' };
        }
        return { ok: false, error: 'no-track' };
    } catch (e) { return { ok: false, error: String(e) }; }
});
