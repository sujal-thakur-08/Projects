(() => {
  'use strict';

  // ---------- element refs ----------
  const $ = (id) => document.getElementById(id);

  const playBtn = $('playBtn');
  const iconPlay = $('iconPlay');
  const iconPause = $('iconPause');
  const prevBtn = $('prevBtn');
  const nextBtn = $('nextBtn');
  const shuffleBtn = $('shuffleBtn');
  const repeatBtn = $('repeatBtn');

  const artworkWrap = $('artworkWrap');
  const artworkImg = $('artworkImg');
  const titleText = $('titleText');
  const artistText = $('artistText');
  const previewBadge = $('previewBadge');

  const moreBtn = $('moreBtn');
  const lyricsBtn = $('lyricsBtn');
  const queueBtn = $('queueBtn');

  const volumeWrap = $('volumeWrap');
  const volumeBtn = $('volumeBtn');
  const volumeSlider = $('volumeSlider');
  const volIconOn = $('volIconOn');
  const volIconMute = $('volIconMute');

  const progress = $('progress');
  const progressTrack = progress.querySelector('.progress-track');
  const progressFill = $('progressFill');
  const timeCurrent = $('timeCurrent');
  const timeTotal = $('timeTotal');

  const searchToggle = $('searchToggle');
  const searchOverlay = $('searchOverlay');
  const searchInput = $('searchInput');
  const searchResults = $('searchResults');
  const searchClose = $('searchClose');

  const lyricsOverlay = $('lyricsOverlay');
  const lyricsBody = $('lyricsBody');
  const lyricsClose = $('lyricsClose');

  const queueOverlay = $('queueOverlay');
  const queueList = $('queueList');
  const queueClose = $('queueClose');

  const menuOverlay = $('menuOverlay');
  const menuOpenAM = $('menuOpenAM');
  const menuSaveSession = $('menuSaveSession');
  const menuRestoreSession = $('menuRestoreSession');
  const menuClearSession = $('menuClearSession');
  const menuSettings = $('menuSettings');
  const menuClose = $('menuClose');

  const settingsOverlay = $('settingsOverlay');
  const settingsClose = $('settingsClose');
  const setStorefront = $('setStorefront');
  const setDevToken = $('setDevToken');
  const setUserToken = $('setUserToken');
  const setGeniusToken = $('setGeniusToken');
  const saveSettings = $('saveSettings');

  const hideBtn = $('hideBtn');
  const quitBtn = $('quitBtn');

  const overlays = [searchOverlay, lyricsOverlay, queueOverlay, menuOverlay, settingsOverlay];

  // ---------- local (non-sensitive) client state ----------
  const LS_GENIUS_KEY = 'miniplayer.geniusToken';

  function closeAllOverlays() {
    overlays.forEach((o) => o.classList.remove('is-open'));
  }
  function openOverlay(el) {
    closeAllOverlays();
    el.classList.add('is-open');
  }

  // ---------- formatting ----------
  function fmtTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  // ---------- playback state polling ----------
  let lastKnownDuration = 0;
  let userScrubbing = false;
  let lastPlaying = null;

  function setPlayingIcon(playing) {
    if (playing === lastPlaying) return;
    lastPlaying = playing;
    const isPlaying = !!playing;
    iconPlay.style.display = isPlaying ? 'none' : '';
    iconPause.style.display = isPlaying ? '' : 'none';
    playBtn.title = isPlaying ? 'Pause' : 'Play';
  }

  function applyInfo(info) {
    if (!info) return;

    titleText.textContent = info.title || 'Not Playing';
    artistText.textContent = info.artist || 'Open Apple Music to get started';

    if (info.artwork) {
      if (artworkImg.dataset.src !== info.artwork) {
        artworkImg.dataset.src = info.artwork;
        // cache locally so we're not re-fetching remote artwork every poll
        if (window.miniAPI?.cacheArtwork) {
          window.miniAPI.cacheArtwork(info.artwork).then((localPath) => {
            artworkImg.src = localPath || info.artwork;
            artworkWrap.classList.add('has-art');
          }).catch(() => {
            artworkImg.src = info.artwork;
            artworkWrap.classList.add('has-art');
          });
        } else {
          artworkImg.src = info.artwork;
          artworkWrap.classList.add('has-art');
        }
      }
    } else {
      artworkImg.removeAttribute('src');
      artworkImg.dataset.src = '';
      artworkWrap.classList.remove('has-art');
    }

    previewBadge.classList.toggle('is-visible', !!info.isPreview);

    if (typeof info.playing === 'boolean') setPlayingIcon(info.playing);

    if (info.shuffle !== null && info.shuffle !== undefined) {
      shuffleBtn.classList.toggle('is-active', !!info.shuffle);
    }
    if (info.repeat !== null && info.repeat !== undefined) {
      repeatBtn.classList.toggle('is-active', !!info.repeat);
    }

    if (!userScrubbing && Number.isFinite(info.duration) && info.duration > 0) {
      lastKnownDuration = info.duration;
      const cur = Number.isFinite(info.currentTime) ? info.currentTime : 0;
      const ratio = Math.max(0, Math.min(1, cur / info.duration));
      progressFill.style.width = `${ratio * 100}%`;
      timeCurrent.textContent = fmtTime(cur);
      timeTotal.textContent = fmtTime(info.duration);
    }

    if (Number.isFinite(info.volume) && document.activeElement !== volumeSlider) {
      const pct = Math.round(info.volume * 100);
      volumeSlider.value = String(pct);
      volumeSlider.style.setProperty('--fill', `${pct}%`);
      volIconOn.style.display = pct > 0 ? '' : 'none';
      volIconMute.style.display = pct > 0 ? 'none' : '';
    }
  }

  async function refreshInfo() {
    try {
      const res = await window.miniAPI.getInfo();
      if (res && res.ok) applyInfo(res.info);
    } catch (e) { /* background window may not be ready yet */ }
  }

  refreshInfo();
  setInterval(refreshInfo, 1200);

  // ---------- transport controls ----------
  playBtn.addEventListener('click', async () => {
    setPlayingIcon(!(iconPause.style.display !== 'none'));
    await window.miniAPI.togglePlay();
    refreshInfo();
  });
  prevBtn.addEventListener('click', async () => { await window.miniAPI.prev(); setTimeout(refreshInfo, 300); });
  nextBtn.addEventListener('click', async () => { await window.miniAPI.next(); setTimeout(refreshInfo, 300); });
  shuffleBtn.addEventListener('click', async () => {
    shuffleBtn.classList.toggle('is-active');
    await window.miniAPI.shuffle();
    setTimeout(refreshInfo, 250);
  });
  repeatBtn.addEventListener('click', async () => {
    repeatBtn.classList.toggle('is-active');
    await window.miniAPI.repeat();
    setTimeout(refreshInfo, 250);
  });

  // ---------- progress bar seek ----------
  function ratioFromEvent(evt) {
    const rect = progressTrack.getBoundingClientRect();
    const x = Math.max(rect.left, Math.min(evt.clientX, rect.right));
    return (x - rect.left) / rect.width;
  }

  progressTrack.addEventListener('mousedown', (evt) => {
    userScrubbing = true;
    const ratio = ratioFromEvent(evt);
    progressFill.style.width = `${ratio * 100}%`;
    if (lastKnownDuration) timeCurrent.textContent = fmtTime(ratio * lastKnownDuration);

    const onMove = (e) => {
      const r = ratioFromEvent(e);
      progressFill.style.width = `${r * 100}%`;
      if (lastKnownDuration) timeCurrent.textContent = fmtTime(r * lastKnownDuration);
    };
    const onUp = async (e) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const r = ratioFromEvent(e);
      await window.miniAPI.seek(r);
      userScrubbing = false;
      refreshInfo();
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  });

  // ---------- volume ----------
  let volumeCloseTimer = null;
  function openVolume() {
    clearTimeout(volumeCloseTimer);
    volumeWrap.classList.add('is-open');
  }
  function scheduleCloseVolume() {
    clearTimeout(volumeCloseTimer);
    volumeCloseTimer = setTimeout(() => volumeWrap.classList.remove('is-open'), 350);
  }
  volumeBtn.addEventListener('click', () => {
    volumeWrap.classList.contains('is-open') ? volumeWrap.classList.remove('is-open') : openVolume();
  });
  volumeWrap.addEventListener('mouseenter', openVolume);
  volumeWrap.addEventListener('mouseleave', scheduleCloseVolume);
  function setVolumeFillVar() {
    volumeSlider.style.setProperty('--fill', `${volumeSlider.value}%`);
  }
  setVolumeFillVar();
  volumeSlider.addEventListener('input', () => {
    const v = Number(volumeSlider.value) / 100;
    volIconOn.style.display = v > 0 ? '' : 'none';
    volIconMute.style.display = v > 0 ? 'none' : '';
    setVolumeFillVar();
    window.miniAPI.setVolume(v);
  });

  // ---------- search ----------
  let searchDebounce = null;
  searchToggle.addEventListener('click', () => {
    openOverlay(searchOverlay);
    searchInput.value = '';
    searchResults.innerHTML = '';
    setTimeout(() => searchInput.focus(), 30);
  });
  searchClose.addEventListener('click', closeAllOverlays);

  function renderResults(results) {
    searchResults.innerHTML = '';
    if (!results || !results.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-row';
      empty.textContent = 'No results';
      searchResults.appendChild(empty);
      return;
    }
    results.forEach((r) => {
      const row = document.createElement('div');
      row.className = 'result-row';

      const img = document.createElement('img');
      img.src = r.artwork || '';
      img.alt = '';

      const meta = document.createElement('div');
      meta.className = 'result-meta';
      const t = document.createElement('span');
      t.className = 'result-title';
      t.textContent = r.title || 'Unknown';
      const a = document.createElement('span');
      a.className = 'result-artist';
      a.textContent = r.artist || '';
      meta.appendChild(t);
      meta.appendChild(a);

      row.appendChild(img);
      row.appendChild(meta);

      row.addEventListener('click', async () => {
        row.style.opacity = '0.5';
        await window.miniAPI.openUrl(r.url);
        closeAllOverlays();
        setTimeout(refreshInfo, 400);
      });

      searchResults.appendChild(row);
    });
  }

  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    const q = searchInput.value.trim();
    if (!q) { searchResults.innerHTML = ''; return; }
    searchDebounce = setTimeout(async () => {
      const res = await window.miniAPI.search(q);
      if (res && res.ok) renderResults(res.results);
    }, 350);
  });

  searchInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const q = searchInput.value.trim();
      if (!q) return;
      await window.miniAPI.searchAndPlay(q);
      closeAllOverlays();
      setTimeout(refreshInfo, 400);
    } else if (e.key === 'Escape') {
      closeAllOverlays();
    }
  });

  // ---------- lyrics ----------
  lyricsBtn.addEventListener('click', async () => {
    openOverlay(lyricsOverlay);
    lyricsBody.textContent = 'Loading lyrics…';
    const token = localStorage.getItem(LS_GENIUS_KEY) || '';
    if (!token) {
      lyricsBody.textContent = 'Add a Genius token in Settings to fetch lyrics.';
      return;
    }
    try {
      const res = await window.lyricsAPI.fetchGenius({
        artist: artistText.textContent,
        title: titleText.textContent,
        token
      });
      lyricsBody.textContent = (res && res.ok && res.lyrics) ? res.lyrics : 'No lyrics found for this track.';
    } catch (e) {
      lyricsBody.textContent = 'Could not fetch lyrics.';
    }
  });
  lyricsClose.addEventListener('click', closeAllOverlays);

  // ---------- queue / saved playlist ----------
  queueBtn.addEventListener('click', async () => {
    openOverlay(queueOverlay);
    queueList.innerHTML = '<div class="empty-row">Loading…</div>';
    try {
      const res = await window.playlistAPI.load();
      const tracks = (res && res.ok) ? res.tracks : [];
      if (!tracks || !tracks.length) {
        queueList.innerHTML = '<div class="empty-row">No saved tracks yet</div>';
        return;
      }
      queueList.innerHTML = '';
      renderQueue(tracks);
    } catch (e) {
      queueList.innerHTML = '<div class="empty-row">Could not load playlist</div>';
    }
  });
  queueClose.addEventListener('click', closeAllOverlays);

  function renderQueue(tracks) {
    tracks.forEach((r) => {
      const row = document.createElement('div');
      row.className = 'result-row';
      const img = document.createElement('img');
      img.src = r.artwork || '';
      const meta = document.createElement('div');
      meta.className = 'result-meta';
      const t = document.createElement('span');
      t.className = 'result-title';
      t.textContent = r.title || 'Unknown';
      const a = document.createElement('span');
      a.className = 'result-artist';
      a.textContent = r.artist || '';
      meta.appendChild(t); meta.appendChild(a);
      row.appendChild(img); row.appendChild(meta);
      row.addEventListener('click', async () => {
        if (r.url) { await window.miniAPI.openUrl(r.url); closeAllOverlays(); setTimeout(refreshInfo, 400); }
      });
      queueList.appendChild(row);
    });
  }

  // ---------- overflow menu ----------
  moreBtn.addEventListener('click', () => openOverlay(menuOverlay));
  menuClose.addEventListener('click', closeAllOverlays);
  menuOpenAM.addEventListener('click', async () => { await window.miniAPI.openAppleMusic(); closeAllOverlays(); });
  menuSaveSession.addEventListener('click', async () => { await window.sessionAPI.save(); closeAllOverlays(); });
  menuRestoreSession.addEventListener('click', async () => { await window.sessionAPI.restore(); closeAllOverlays(); setTimeout(refreshInfo, 500); });
  menuClearSession.addEventListener('click', async () => { await window.sessionAPI.clear(); closeAllOverlays(); });
  menuSettings.addEventListener('click', async () => {
    openOverlay(settingsOverlay);
    try {
      const tokens = await window.miniAPI.getAppleTokens();
      if (tokens && tokens.ok) {
        setStorefront.value = tokens.storefront || 'us';
        setDevToken.value = tokens.developerToken || '';
        setUserToken.value = tokens.musicUserToken || '';
      }
    } catch (e) { /* ignore */ }
    setGeniusToken.value = localStorage.getItem(LS_GENIUS_KEY) || '';
  });

  // ---------- settings ----------
  settingsClose.addEventListener('click', closeAllOverlays);
  saveSettings.addEventListener('click', async () => {
    await window.miniAPI.setAppleTokens({
      storefront: setStorefront.value.trim() || 'us',
      developerToken: setDevToken.value.trim(),
      musicUserToken: setUserToken.value.trim()
    });
    localStorage.setItem(LS_GENIUS_KEY, setGeniusToken.value.trim());
    closeAllOverlays();
  });

  // ---------- window chrome ----------
  hideBtn.addEventListener('click', () => window.windowAPI.hide());
  quitBtn.addEventListener('click', () => window.windowAPI.quit());

  // click outside an open overlay's content (but inside bar) does nothing special;
  // Escape key closes whatever overlay is open
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllOverlays();
  });

})();
