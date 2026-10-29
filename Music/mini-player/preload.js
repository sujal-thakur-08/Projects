// preload for background window (not used heavily but keeps contextIsolation safe)
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('bgBridge', {
    // placeholder - background window is controlled from main
});
