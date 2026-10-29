const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('miniAPI', {
    togglePlay: () => ipcRenderer.invoke('player:togglePlay'),
    next: () => ipcRenderer.invoke('player:next'),
    prev: () => ipcRenderer.invoke('player:prev'),
    shuffle: () => ipcRenderer.invoke('player:shuffle'),
    repeat: () => ipcRenderer.invoke('player:repeat'),
    setVolume: (v) => ipcRenderer.invoke('player:setVolume', v),
    seek: (ratio) => ipcRenderer.invoke('player:seek', ratio),
    getInfo: () => ipcRenderer.invoke('player:getInfo'),
    openAppleMusic: () => ipcRenderer.invoke('player:openAppleMusic'),
    searchAndPlay: (q) => ipcRenderer.invoke('player:searchAndPlay', q),
    search: (q) => ipcRenderer.invoke('player:search', q),
    openUrl: (url) => ipcRenderer.invoke('player:openUrl', url),
    cacheArtwork: (url) => ipcRenderer.invoke('player:cacheArtwork', url),
    getAppleTokens: () => ipcRenderer.invoke('appleTokens:get'),
    setAppleTokens: (tokens) => ipcRenderer.invoke('appleTokens:set', tokens)
});

// frameless window chrome (hide-to-tray / quit) for the mini bar
contextBridge.exposeInMainWorld('windowAPI', {
    hide: () => ipcRenderer.invoke('window:hide'),
    quit: () => ipcRenderer.invoke('window:quit')
});
// native controls
contextBridge.exposeInMainWorld('nativeAPI', {
    togglePlay: () => ipcRenderer.invoke('native:togglePlay'),
    next: () => ipcRenderer.invoke('native:next'),
    prev: () => ipcRenderer.invoke('native:prev'),
    getInfo: () => ipcRenderer.invoke('native:getInfo')
});

contextBridge.exposeInMainWorld('playlistAPI', {
    save: (tracks) => ipcRenderer.invoke('playlist:save', tracks),
    load: () => ipcRenderer.invoke('playlist:load')
});

contextBridge.exposeInMainWorld('lyricsAPI', {
    fetchGenius: (opts) => ipcRenderer.invoke('lyrics:fetchGenius', opts)
});

contextBridge.exposeInMainWorld('sessionAPI', {
    openLoginWindow: () => ipcRenderer.invoke('session:openLoginWindow'),
    save: () => ipcRenderer.invoke('session:save'),
    restore: () => ipcRenderer.invoke('session:restore'),
    clear: () => ipcRenderer.invoke('session:clear')
});

contextBridge.exposeInMainWorld('electronBridge', {
    sendEvent: (payload) => ipcRenderer.send('musickit:event', payload)
});

