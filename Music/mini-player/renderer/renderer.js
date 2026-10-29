const playBtn = document.getElementById('play');
const nextBtn = document.getElementById('next');
const prevBtn = document.getElementById('prev');
const searchBtn = document.getElementById('searchBtn');
const closeBtn = document.getElementById('close');
const titleEl = document.getElementById('title');
const artistEl = document.getElementById('artist');
const miniEl = document.querySelector('.mini');
const artEl = document.getElementById('art');

let mode = 'Web'; // keep for backward compatibility but UI no longer exposes mode switch

const lyricsPreview = document.getElementById('lyricsPreview');
let lastTrackKey = '';
const fullLyricsModal = document.getElementById('fullLyricsModal');
const fullLyricsContent = document.getElementById('fullLyricsContent');
const closeFullLyrics = document.getElementById('closeFullLyrics');

function loadLyricsCache() { try { return JSON.parse(localStorage.getItem('mini:lyricsCache') || '{}'); } catch (e) { return {}; } }
function saveLyricsCache(c) { try { localStorage.setItem('mini:lyricsCache', JSON.stringify(c || {})); } catch (e) { } }

async function refreshInfo() {
    try {
        let res;
        if (mode === 'Web') res = await window.miniAPI.getInfo();
        else res = await window.nativeAPI.getInfo();

        if (res && res.ok && res.info) {
            const info = res.info;
            // show music name only when playing; otherwise hide title for a cleaner UI
            if (info.playing && info.title) {
                titleEl.style.display = 'block';
                titleEl.innerText = info.title;
            } else {
                titleEl.style.display = 'none';
                titleEl.innerText = '';
            }
            artistEl.innerText = info.artist || '';

            // artwork and backdrop
            if (info.artwork) {
                try {
                    const cached = await window.miniAPI.cacheArtwork(info.artwork);
                    const artUrl = cached || info.artwork;
                    artEl.classList.add('record');
                    artEl.style.backgroundImage = `url("${artUrl}")`;
                    artEl.style.backgroundSize = 'cover';
                    artEl.style.backgroundPosition = 'center';
                    miniEl.style.setProperty('--bg-art', `url("${artUrl}")`);
                } catch (e) {
                    artEl.style.backgroundImage = `url("${info.artwork}")`;
                    artEl.style.backgroundSize = 'cover';
                    artEl.style.backgroundPosition = 'center';
                    miniEl.style.setProperty('--bg-art', `url("${info.artwork}")`);
                }
            } else {
                artEl.classList.remove('record');
                artEl.style.backgroundImage = '';
                miniEl.style.setProperty('--bg-art', 'none');
            }

            // playing state
            if (info.playing === true) {
                playBtn.innerText = '❚❚';
                artEl.classList.add('playing');
                artEl.classList.add('play-active');
            } else {
                playBtn.innerText = '►';
                artEl.classList.remove('playing');
                artEl.classList.remove('play-active');
            }

            // fetch and show a small lyrics preview when track changes
            (async () => {
                const title = (info.title || '').replace(/\s*\(.*\)$/, '').trim();
                const artist = (info.artist || '').split(',')[0].trim();
                const key = (artist + '|' + title).toLowerCase();
                if (title && artist && key !== lastTrackKey) {
                    lastTrackKey = key;
                    const lyrics = await fetchLyricsSnippet(title, artist);
                    if (lyrics) {
                        // take first 3 non-empty lines
                        const lines = lyrics.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                        lyricsPreview.innerText = lines.slice(0, 3).join('\n');
                        // cache full lyrics in memory-localStorage too
                        const cache = loadLyricsCache(); cache[key] = lyrics; saveLyricsCache(cache);
                    } else {
                        lyricsPreview.innerText = 'Lyrics not available';
                    }
                }
            })();
        }
    } catch (e) { console.warn(e); }
}

playBtn.addEventListener('click', async () => {
    try {
        if (mode === 'Web') await window.miniAPI.togglePlay();
        else await window.nativeAPI.togglePlay();
    } catch (e) { console.warn(e); }
    // refresh immediately and once more shortly in case background page needs a moment
    await refreshInfo();
    setTimeout(refreshInfo, 350);
});
nextBtn.addEventListener('click', async () => {
    try {
        if (mode === 'Web') await window.miniAPI.next();
        else await window.nativeAPI.next();
    } catch (e) { console.warn(e); }
    await refreshInfo();
    setTimeout(refreshInfo, 350);
});
prevBtn.addEventListener('click', async () => {
    try {
        if (mode === 'Web') await window.miniAPI.prev();
        else await window.nativeAPI.prev();
    } catch (e) { console.warn(e); }
    await refreshInfo();
    setTimeout(refreshInfo, 350);
});
// Search modal elements
const searchModal = document.getElementById('searchModal');
const searchInput = document.getElementById('searchInput');
const doSearchBtn = document.getElementById('doSearch');
const closeSearchBtn = document.getElementById('closeSearch');
const saveCurrentBtn = document.getElementById('saveCurrent');
const loadPlaylistBtn = document.getElementById('loadPlaylistBtn');
const searchResults = document.getElementById('searchResults');
const geniusTokenInput = document.getElementById('geniusToken');
const saveTokenBtn = document.getElementById('saveTokenBtn');
const playlistBtn = document.getElementById('playlistBtn');
const playlistModal = document.getElementById('playlistModal');
const playlistList = document.getElementById('playlistList');
const savePlaylistToDiskBtn = document.getElementById('savePlaylistToDisk');
const clearPlaylistBtn = document.getElementById('clearPlaylist');
const closePlaylistBtn = document.getElementById('closePlaylist');
// settings elements
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const accentColor = document.getElementById('accentColor');
const bgColor = document.getElementById('bgColor');
const artSize = document.getElementById('artSize');
const fontSize = document.getElementById('fontSize');
const blurStrength = document.getElementById('blurStrength');
const openLogin = document.getElementById('openLogin');
const saveSessionBtn = document.getElementById('saveSession');
const restoreSessionBtn = document.getElementById('restoreSession');
const clearSessionBtn = document.getElementById('clearSession');
const autoRestore = document.getElementById('autoRestore');
const closeSettings = document.getElementById('closeSettings');
const appleDevToken = document.getElementById('appleDevToken');
const appleUserToken = document.getElementById('appleUserToken');
const appleStorefront = document.getElementById('appleStorefront');
const saveAppleTokens = document.getElementById('saveAppleTokens');

function showModal(el) { el.style.display = 'flex'; el.setAttribute('aria-hidden', 'false'); }
function hideModal(el) { el.style.display = 'none'; el.setAttribute('aria-hidden', 'true'); }

searchBtn.addEventListener('click', () => { searchInput.value = ''; showModal(searchModal); searchInput.focus(); });
closeSearchBtn.addEventListener('click', () => hideModal(searchModal));
// load saved genius token
geniusTokenInput.value = localStorage.getItem('mini:geniusToken') || '';
saveTokenBtn.addEventListener('click', () => { localStorage.setItem('mini:geniusToken', geniusTokenInput.value || ''); alert('Token saved'); });

// Theme: apply saved theme or defaults
function applyTheme(cfg) {
    const root = document.documentElement;
    if (cfg.accent) root.style.setProperty('--accent', cfg.accent);
    if (cfg.bg) root.style.setProperty('--bg', cfg.bg);
    if (cfg.artSize) root.style.setProperty('--art-size', cfg.artSize + 'px');
    if (cfg.fontSize) root.style.setProperty('--font-size', cfg.fontSize + 'px');
    if (cfg.blur != null) root.style.setProperty('--blur', cfg.blur + 'px');
}

function loadTheme() {
    try {
        const s = JSON.parse(localStorage.getItem('mini:theme') || '{}');
        return s;
    } catch (e) { return {}; }
}

function saveTheme(cfg) { localStorage.setItem('mini:theme', JSON.stringify(cfg || {})); }

// initialize theme controls from storage
const theme = loadTheme();
if (!theme.accent) theme.accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#1fb6ff';
if (!theme.bg) theme.bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0f1720';
theme.artSize = theme.artSize || 72; theme.fontSize = theme.fontSize || 14; theme.blur = theme.blur || 8;
if (accentColor) accentColor.value = theme.accent;
if (bgColor) bgColor.value = theme.bg;
if (artSize) artSize.value = theme.artSize;
if (fontSize) fontSize.value = theme.fontSize;
if (blurStrength) blurStrength.value = theme.blur;
autoRestore.checked = localStorage.getItem('mini:autoRestore') === '1';
applyTheme(theme);

// optionally auto-restore session
if (localStorage.getItem('mini:autoRestore') === '1') {
    setTimeout(async () => {
        try {
            const r = await window.sessionAPI.restore();
            if (r && r.ok) { console.log('Session auto-restore: restored', r.restored); try { await window.miniAPI.openAppleMusic(); } catch (e) { } }
            else console.log('Session auto-restore failed', r && r.error);
        } catch (e) { console.warn('session restore err', e); }
    }, 800);
}

(async () => {
    try {
        const t = await window.miniAPI.getAppleTokens();
        if (t && t.ok) {
            if (appleDevToken) appleDevToken.value = t.developerToken || '';
            if (appleUserToken) appleUserToken.value = t.musicUserToken || '';
            if (appleStorefront) appleStorefront.value = t.storefront || 'us';
        }
    } catch (e) { console.warn('load tokens failed', e); }
})();

if (accentColor) accentColor.addEventListener('input', () => { theme.accent = accentColor.value; applyTheme(theme); saveTheme(theme); });
if (bgColor) bgColor.addEventListener('input', () => { theme.bg = bgColor.value; applyTheme(theme); saveTheme(theme); });
if (artSize) artSize.addEventListener('input', () => { theme.artSize = artSize.value; applyTheme(theme); saveTheme(theme); });
if (fontSize) fontSize.addEventListener('input', () => { theme.fontSize = fontSize.value; applyTheme(theme); saveTheme(theme); });
if (blurStrength) blurStrength.addEventListener('input', () => { theme.blur = blurStrength.value; applyTheme(theme); saveTheme(theme); });
autoRestore.addEventListener('change', () => { localStorage.setItem('mini:autoRestore', autoRestore.checked ? '1' : '0'); });

settingsBtn.addEventListener('click', () => { showModal(settingsModal); });
closeSettings.addEventListener('click', () => { hideModal(settingsModal); });

openLogin.addEventListener('click', async () => {
    const r = await window.sessionAPI.openLoginWindow();
    if (r && r.ok) alert('Background login window opened. Please log in and then use Save Session.'); else alert('Failed to open login window');
});
saveSessionBtn.addEventListener('click', async () => {
    const r = await window.sessionAPI.save();
    if (r && r.ok) alert('Session saved: ' + (r.path || '') + ' (' + (r.count || 0) + ' cookies)'); else alert('Save failed: ' + (r && r.error));
});
restoreSessionBtn.addEventListener('click', async () => {
    const r = await window.sessionAPI.restore();
    if (r && r.ok) {
        alert('Session restored: ' + (r.restored || 0) + ' cookies');
        try { await window.miniAPI.openAppleMusic(); } catch (e) { }
    } else alert('Restore failed: ' + (r && r.error));
});
clearSessionBtn.addEventListener('click', async () => {
    const r = await window.sessionAPI.clear();
    if (r && r.ok) alert('Session cleared'); else alert('Clear failed: ' + (r && r.error));
});
if (saveAppleTokens) {
    saveAppleTokens.addEventListener('click', async () => {
        try {
            const r = await window.miniAPI.setAppleTokens({
                developerToken: (appleDevToken && appleDevToken.value || '').trim(),
                musicUserToken: (appleUserToken && appleUserToken.value || '').trim(),
                storefront: (appleStorefront && appleStorefront.value || 'us').trim() || 'us'
            });
            if (r && r.ok) alert('Apple Music tokens saved');
            else alert('Failed to save tokens: ' + (r && r.error || 'unknown error'));
        } catch (e) { console.warn(e); alert('Failed to save tokens'); }
    });
}
saveCurrentBtn.addEventListener('click', async () => {
    try {
        const res = await window.miniAPI.getInfo();
        if (!res || !res.ok || !res.info || !res.info.title) { alert('No track info to save'); return; }
        const info = res.info;
        // load existing from disk
        const loaded = await window.playlistAPI.load();
        let tracks = [];
        if (loaded && loaded.ok && Array.isArray(loaded.tracks)) tracks = loaded.tracks;
        tracks.push({ title: info.title || '', artist: info.artist || '', artwork: info.artwork || '' });
        const saved = await window.playlistAPI.save(tracks);
        if (saved && saved.ok) alert('Saved to playlist: ' + saved.path); else alert('Save failed');
    } catch (e) { console.warn(e); alert('Save failed'); }
});

loadPlaylistBtn.addEventListener('click', async () => {
    try {
        const loaded = await window.playlistAPI.load();
        if (!loaded || !loaded.ok) { alert('No playlist found'); return; }
        const tracks = loaded.tracks || [];
        // store in localStorage for quick access and notify user
        localStorage.setItem('mini:playlist', JSON.stringify(tracks));
        alert('Loaded ' + tracks.length + ' tracks into local playlist');
    } catch (e) { console.warn(e); alert('Load failed'); }
});

// search -> fetch results and render
doSearchBtn.addEventListener('click', async () => {
    const q = (searchInput.value || '').trim();
    if (!q) return;
    searchResults.innerHTML = 'Searching...';
    try {
        const res = await window.miniAPI.search(q);
        if (!res || !res.ok) { searchResults.innerText = 'No results'; return; }
        const rows = res.results || [];
        if (!rows.length) { searchResults.innerText = 'No results'; return; }
        searchResults.innerHTML = '';
        rows.forEach((r, idx) => {
            const row = document.createElement('div'); row.className = 'sr-row';
            const left = document.createElement('div'); left.className = 'sr-left';
            const img = document.createElement('div'); img.className = 'sr-thumb'; if (r.artwork) img.style.backgroundImage = `url("${r.artwork}")`;
            const info = document.createElement('div'); info.className = 'sr-info'; info.innerText = (r.title || '') + (r.artist ? '\n' + r.artist : '');
            left.appendChild(img); left.appendChild(info);
            const actions = document.createElement('div'); actions.className = 'sr-actions';
            const play = document.createElement('button'); play.className = 'btn'; play.innerText = 'Play'; play.addEventListener('click', async () => { if (r.url) { const ok = await window.miniAPI.openUrl(r.url); if (!ok || !ok.ok) await window.miniAPI.searchAndPlay((r.title || q) + ' ' + (r.artist || '')); hideModal(searchModal); await refreshInfo(); } else { await window.miniAPI.searchAndPlay((r.title || q) + ' ' + (r.artist || '')); hideModal(searchModal); await refreshInfo(); } });
            const add = document.createElement('button'); add.className = 'btn'; add.innerText = 'Add'; add.addEventListener('click', () => { const pl = JSON.parse(localStorage.getItem('mini:playlist') || '[]'); pl.push({ title: r.title || '', artist: r.artist || '', artwork: r.artwork || '', url: r.url || '', query: q }); localStorage.setItem('mini:playlist', JSON.stringify(pl)); alert('Added to playlist'); });
            actions.appendChild(play); actions.appendChild(add);
            row.appendChild(left); row.appendChild(actions); searchResults.appendChild(row);
        });
    } catch (e) { searchResults.innerText = 'Search failed'; console.warn(e); }
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearchBtn.click();
});

// Playlist modal behavior
playlistBtn.addEventListener('click', () => { renderPlaylistModal(); showModal(playlistModal); });
closePlaylistBtn.addEventListener('click', () => hideModal(playlistModal));
savePlaylistToDiskBtn.addEventListener('click', async () => {
    const pl = JSON.parse(localStorage.getItem('mini:playlist') || '[]');
    const saved = await window.playlistAPI.save(pl);
    if (saved && saved.ok) alert('Saved to: ' + saved.path); else alert('Save failed');
});
clearPlaylistBtn.addEventListener('click', () => { localStorage.removeItem('mini:playlist'); renderPlaylistModal(); });

function renderPlaylistModal() {
    const pl = JSON.parse(localStorage.getItem('mini:playlist') || '[]');
    playlistList.innerHTML = '';
    if (!pl.length) { playlistList.innerText = 'Playlist empty'; return; }
    pl.forEach((item, idx) => {
        const row = document.createElement('div'); row.className = 'pl-row';
        const info = document.createElement('div'); info.className = 'pl-info'; info.innerText = (item.title || '') + (item.artist ? '\n' + item.artist : '');
        const actions = document.createElement('div'); actions.className = 'pl-actions';
        const play = document.createElement('button'); play.className = 'btn'; play.innerText = 'Play'; play.addEventListener('click', async () => { if (item.url) { const ok = await window.miniAPI.openUrl(item.url); if (!ok || !ok.ok) await window.miniAPI.searchAndPlay((item.title || '') + ' ' + (item.artist || '')); } else await window.miniAPI.searchAndPlay((item.title || '') + ' ' + (item.artist || '')); hideModal(playlistModal); await refreshInfo(); });
        const up = document.createElement('button'); up.className = 'btn'; up.innerText = '↑'; up.addEventListener('click', () => { if (idx === 0) return; const p = JSON.parse(localStorage.getItem('mini:playlist') || '[]'); const a = p.splice(idx, 1)[0]; p.splice(idx - 1, 0, a); localStorage.setItem('mini:playlist', JSON.stringify(p)); renderPlaylistModal(); });
        const down = document.createElement('button'); down.className = 'btn'; down.innerText = '↓'; down.addEventListener('click', () => { const p = JSON.parse(localStorage.getItem('mini:playlist') || '[]'); if (idx === p.length - 1) return; const a = p.splice(idx, 1)[0]; p.splice(idx + 1, 0, a); localStorage.setItem('mini:playlist', JSON.stringify(p)); renderPlaylistModal(); });
        const rem = document.createElement('button'); rem.className = 'btn'; rem.innerText = 'Remove'; rem.addEventListener('click', () => { const p = JSON.parse(localStorage.getItem('mini:playlist') || '[]'); p.splice(idx, 1); localStorage.setItem('mini:playlist', JSON.stringify(p)); renderPlaylistModal(); });
        actions.appendChild(play); actions.appendChild(up); actions.appendChild(down); actions.appendChild(rem);
        row.appendChild(info); row.appendChild(actions); playlistList.appendChild(row);
    });
}

// clicking the lyrics preview opens the full lyrics modal
lyricsPreview.addEventListener('click', async () => {
    try {
        const res = await window.miniAPI.getInfo();
        if (!res || !res.ok || !res.info) { alert('No track info'); return; }
        const title = (res.info.title || '').replace(/\s*\(.*\)$/, '').trim();
        const artist = (res.info.artist || '').split(',')[0].trim();
        const key = (artist + '|' + title).toLowerCase();
        let cache = loadLyricsCache();
        let lyrics = cache[key];
        if (!lyrics) lyrics = await fetchLyricsSnippet(title, artist);
        fullLyricsContent.innerText = lyrics || 'Lyrics not available';
        showModal(fullLyricsModal);
    } catch (e) { console.warn(e); }
});

closeFullLyrics.addEventListener('click', () => hideModal(fullLyricsModal));

async function fetchLyricsSnippet(title, artist) {
    if (!title || !artist) return '';
    const key = (artist + '|' + title).toLowerCase();
    const cache = loadLyricsCache();
    if (cache[key]) return cache[key];
    try {
        // prefer Genius if user provided a token
        const token = localStorage.getItem('mini:geniusToken');
        if (token) {
            try {
                const g = await window.lyricsAPI.fetchGenius({ artist, title, token });
                if (g && g.ok && g.lyrics) { cache[key] = g.lyrics; saveLyricsCache(cache); return g.lyrics; }
            } catch (e) { /* fallback */ }
        }
        const apiUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
        const r = await fetch(apiUrl);
        if (!r.ok) return '';
        const j = await r.json();
        const lyrics = (j && j.lyrics) ? j.lyrics.trim() : '';
        if (lyrics) { cache[key] = lyrics; saveLyricsCache(cache); }
        return lyrics;
    } catch (e) { return ''; }
}
// hide to tray via closing window (main prevents full quit)
if (closeBtn) closeBtn.addEventListener('click', () => { window.close(); });

// ESC hides
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.close(); });

// show animation
document.addEventListener('DOMContentLoaded', () => { setTimeout(() => miniEl.classList.add('visible'), 20); });

// poll for info
// poll for info
setInterval(refreshInfo, 1500);
refreshInfo();
