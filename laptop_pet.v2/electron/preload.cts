import { contextBridge, ipcRenderer } from "electron";
import type { NovaSettings, SystemSnapshot } from "./types.js";

contextBridge.exposeInMainWorld("nova", {
  settings: {
    get: (): Promise<NovaSettings> => ipcRenderer.invoke("nova:settings:get"),
    save: (settings: NovaSettings): Promise<NovaSettings> =>
      ipcRenderer.invoke("nova:settings:save", settings),
  },
  notes: {
    list: () => ipcRenderer.invoke("nova:notes:list"),
    add: (body: string) => ipcRenderer.invoke("nova:notes:add", body),
    remove: (id: number) => ipcRenderer.invoke("nova:notes:delete", id),
  },
  system: (): Promise<SystemSnapshot> => ipcRenderer.invoke("nova:system"),
  onVoiceEvent: (callback: (payload: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: unknown) => callback(payload);
    ipcRenderer.on("nova:voice:event", listener);
    return () => ipcRenderer.removeListener("nova:voice:event", listener);
  },
  onGlobalTyping: (callback: () => void) => {
    const listener = () => {
      callback();
    };
    ipcRenderer.on("nova:global-typing", listener);
    return () => {
      ipcRenderer.removeListener("nova:global-typing", listener);
    };
  },
  onMusicState: (callback: (playing: boolean) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, playing: boolean) => callback(playing);
    ipcRenderer.on("nova:music-state", listener);
    return () => {
      ipcRenderer.removeListener("nova:music-state", listener);
    };
  },
  onMediaTitle: (callback: (title: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, title: string) => callback(title);
    ipcRenderer.on("nova:music-title", listener);
    return () => ipcRenderer.removeListener("nova:music-title", listener);
  },
  onMediaArtist: (callback: (artist: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, artist: string) => callback(artist);
    ipcRenderer.on("nova:music-artist", listener);
    return () => ipcRenderer.removeListener("nova:music-artist", listener);
  },
  onScroll: (callback: (dir: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, dir: string) => callback(dir);
    ipcRenderer.on("nova:scroll", listener);
    return () => ipcRenderer.removeListener("nova:scroll", listener);
  },
  hide: () => ipcRenderer.invoke("nova:window:close"),
  setExpanded: (expanded: boolean) => ipcRenderer.invoke("nova:window:expand", expanded),
  dragWindow: {
    start: (x: number, y: number) =>
      ipcRenderer.send("nova:window:drag-start", { x, y }),
    move: (x: number, y: number) =>
      ipcRenderer.send("nova:window:drag-move", { x, y }),
    end: () => ipcRenderer.send("nova:window:drag-end"),
  },
  roamWindow: () => ipcRenderer.send("nova:window:roam"),
  media: {
    previous: () => ipcRenderer.send("nova:media:previous"),
    playPause: () => ipcRenderer.send("nova:media:playpause"),
    next: () => ipcRenderer.send("nova:media:next"),
  }
});
