import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeImage,
  screen,
  Tray,
  powerMonitor,
} from "electron";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { NovaStore } from "./store.js";
import { getSystemSnapshot } from "./monitor.js";
import { StartupManager } from "./startup.js";
import { ShutdownManager } from "./shutdown.js";
import { RegistryManager } from "./registry.js";
import { autoUpdater } from "electron-updater";
import log from "electron-log";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const cacheRoot = path.join(
  process.env.LOCALAPPDATA ?? tmpdir(),
  "Nova Pet",
  "ChromiumCache",
);

mkdirSync(cacheRoot, { recursive: true });
app.setPath("cache", cacheRoot);
app.commandLine.appendSwitch("disk-cache-dir", cacheRoot);

const hasInstanceLock = app.requestSingleInstanceLock();

if (!hasInstanceLock) {
  app.quit();
}

// Configure autoUpdater logging
autoUpdater.logger = log;
(autoUpdater.logger as any).transports.file.level = "info";
log.info("App starting...");

let widget: BrowserWindow | null = null;
let tray: Tray | null = null;
let quitting = false;

export function setQuitting(val: boolean) {
  quitting = val;
}
let store: NovaStore;
let dragOffset: { x: number; y: number } | null = null;

let typingWorker: ChildProcessWithoutNullStreams;
let mouseWorker: ChildProcessWithoutNullStreams;

function startTypingWorker() {
  const isPackaged = app.isPackaged;
  const projectRoot = isPackaged 
    ? process.resourcesPath
    : path.resolve(dirname, "../../..");
    
  const servicePath = isPackaged
    ? path.join(projectRoot, "services", "nova_typing_service.py")
    : path.join(projectRoot, "lap", "services", "nova_typing_service.py");
    
  const mousePath = isPackaged
    ? path.join(projectRoot, "services", "nova_mouse_service.py")
    : path.join(projectRoot, "lap", "services", "nova_mouse_service.py");
  
  const python = process.platform === "win32" ? "py" : "python3";
  const pythonArgs =
    process.platform === "win32"
      ? ["-3.13", "-u", servicePath]
      : ["-u", servicePath];

  typingWorker = spawn(python, pythonArgs, {
    cwd: projectRoot,
    windowsHide: true,
    stdio: ["pipe", "pipe", "pipe"],
  });

  const mouseArgs =
    process.platform === "win32"
      ? ["-3.13", "-u", mousePath]
      : ["-u", mousePath];

  mouseWorker = spawn(python, mouseArgs, {
    cwd: projectRoot,
    windowsHide: true,
    stdio: ["pipe", "pipe", "pipe"],
  });

  (global as any).typingWorker = typingWorker;
  (global as any).mouseWorker = mouseWorker;

  const output = readline.createInterface({ input: typingWorker.stdout });
  output.on("line", (line) => {
    if (line.trim() === "keydown") {
      widget?.webContents.send("nova:global-typing");
    } else if (line.trim() === "music_start") {
      widget?.webContents.send("nova:music-state", true);
    } else if (line.trim() === "music_stop") {
      widget?.webContents.send("nova:music-state", false);
    } else if (line.trim().startsWith("music_title:")) {
      widget?.webContents.send("nova:music-title", line.replace("music_title:", "").trim());
    } else if (line.trim().startsWith("music_artist:")) {
      widget?.webContents.send("nova:music-artist", line.replace("music_artist:", "").trim());
    }
  });

  const mouseOutput = readline.createInterface({ input: mouseWorker.stdout });
  mouseOutput.on("line", (line) => {
    if (line.trim().startsWith("scroll:")) {
      widget?.webContents.send("nova:scroll", line.replace("scroll:", "").trim());
    }
  });
  
  typingWorker.stderr.on("data", (data) => {
    console.error("Python Typing Worker Error:", data.toString());
  });
  mouseWorker.stderr.on("data", (data) => {
    console.error("Python Mouse Worker Error:", data.toString());
  });
  
  typingWorker.on("exit", () => {
    if (!quitting) setTimeout(startTypingWorker, 5000);
  });
  mouseWorker.on("exit", () => {
    if (!quitting) setTimeout(startTypingWorker, 5000);
  });
}

function createWindow() {
  const display = screen.getPrimaryDisplay();
  widget = new BrowserWindow({
    width: 350,
    height: 350,
    x: display.bounds.width - 370,
    y: display.bounds.height - 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  widget.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[FRONTEND ERROR]: ${message} (at ${sourceId}:${line})`);
  });

  widget.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  widget.on("close", (event) => {
    if (!quitting) {
      event.preventDefault();
      widget?.hide();
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) void widget.loadURL(devUrl);
  else void widget.loadFile(path.join(dirname, "../dist/index.html"));
}

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip("Nova Pet");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Show NOVA", click: () => widget?.show() },
      { label: "Hide NOVA", click: () => widget?.hide() },
      { type: "separator" },
      {
        label: "Restart",
        click: () => {
          app.relaunch();
          app.quit();
        },
      },
      {
        label: "Quit Nova Pet",
        click: () => {
          app.quit();
        },
      },
    ]),
  );
  tray.on("click", () => {
    if (widget && !widget.isDestroyed()) {
      widget.isVisible() ? widget.hide() : widget.show();
    }
  });
}

app.whenReady().then(() => {
  // Configure the app to automatically launch on Windows startup
  if (process.platform === 'win32' || process.platform === 'darwin') {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: false,
    });
  }

  if (!hasInstanceLock) return;
  store = new NovaStore();
  createWindow();
  createTray();
  
  // Check for updates
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', () => {
    log.info('Update available.');
  });
  
  autoUpdater.on('update-downloaded', () => {
    log.info('Update downloaded; will install on quit or can be triggered manually.');
    // Optionally we can send an IPC to the renderer to show an "Update Ready" notification.
  });
  
  if (widget) {
    StartupManager.initialize(store, widget, () => {
      startTypingWorker();
    });
  }

  if (process.argv.includes("--background")) widget?.hide();

  powerMonitor.on("suspend", () => {
    // Do not quit on suspend; just save state
    if (widget && store) {
      const bounds = widget.getBounds();
      const settings = store.getSettings();
      settings.windowPosition = { x: bounds.x, y: bounds.y };
      store.saveSettings(settings);
    }
  });

  powerMonitor.on("resume", () => {
    if (widget) {
      if (widget.isMinimized()) widget.restore();
      widget.hide();
      setTimeout(() => {
        widget?.setAlwaysOnTop(true, "screen-saver");
        widget?.showInactive();
      }, 500);
    }
  });

  powerMonitor.on("unlock-screen", () => {
    if (widget) {
      if (widget.isMinimized()) widget.restore();
      widget.hide();
      setTimeout(() => {
        widget?.setAlwaysOnTop(true, "screen-saver");
        widget?.showInactive();
      }, 500);
    }
  });
});

app.on("second-instance", () => {
  if (!widget) return;
  if (widget.isMinimized()) widget.restore();
  widget.show();
  widget.focus();
});

app.on("before-quit", (event) => {
  if (!quitting) {
    quitting = true;
    event.preventDefault();
    if (widget && !widget.isDestroyed()) {
      ShutdownManager.executeTrueExit(store, widget, () => {
        if (typingWorker) typingWorker.kill();
        if ((global as any).mouseWorker) (global as any).mouseWorker.kill();
      });
    } else {
      app.quit();
    }
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") return;
});

ipcMain.handle("nova:settings:get", () => store.getSettings());
ipcMain.handle("nova:settings:save", async (_event, settings) => {
  const previous = store.getSettings();
  const saved = store.saveSettings(settings);
  
  // RegistryManager checks launchAtLogin inside
  if (saved.launchAtLogin) {
    await RegistryManager.enableAutoStart();
  } else {
    await RegistryManager.disableAutoStart();
  }
  
  return saved;
});
ipcMain.handle("nova:notes:list", () => store.listNotes());
ipcMain.handle("nova:notes:add", (_event, body: string) => store.addNote(body.trim()));
ipcMain.handle("nova:notes:delete", (_event, id: number) => store.deleteNote(id));
ipcMain.handle("nova:system", () => getSystemSnapshot());
ipcMain.handle("nova:window:close", () => widget?.hide());
ipcMain.handle("nova:window:expand", (_event, expanded: boolean) => {
  if (!widget) return;
  const bounds = widget.getBounds();
  const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
  const area = display.workArea;

  const newWidth = expanded ? 700 : 350;
  const newHeight = expanded ? 520 : 350;

  // Calculate the current right edge of the window
  const rightEdgeX = bounds.x + bounds.width;
  const bottomY = bounds.y + bounds.height;

  // Set the new bounds so that the right edge exactly matches the old right edge
  let newX = rightEdgeX - newWidth;
  let newY = bottomY - newHeight;

  // Ensure the window doesn't go off-screen, but don't force shift it unless absolutely necessary 
  // (because shifting breaks the fox's fixed position relative to the desktop)
  if (newX < area.x) newX = area.x;
  if (newX + newWidth > area.x + area.width) newX = area.x + area.width - newWidth;
  if (newY < area.y) newY = area.y;
  if (newY + newHeight > area.y + area.height) newY = area.y + area.height - newHeight;

  widget.setBounds({ x: newX, y: newY, width: newWidth, height: newHeight }, false);
});

let dragStartBounds: { x: number; y: number; width: number; height: number } | null = null;
  
ipcMain.on("nova:window:drag-start", (_event, point: { x: number; y: number }) => {
  if (!widget) return;
  const bounds = widget.getBounds();
  dragStartBounds = bounds;
  
  // Do NOT expand the window during drag! Changing bounds while Framer Motion is active
  // causes the mouse event coordinates to jump, ripping the fox away from the cursor!
  dragOffset = { x: point.x - bounds.x, y: point.y - bounds.y };
});

ipcMain.on("nova:window:drag-move", (_event, point: { x: number; y: number }) => {
  if (!widget || !dragOffset || !dragStartBounds) return;
  
  let x = Math.round(point.x - dragOffset.x);
  let y = Math.round(point.y - dragOffset.y);
  
  // Only update position, keep original width/height
  widget.setBounds({ x, y, width: dragStartBounds.width, height: dragStartBounds.height }, false);
});

ipcMain.on("nova:window:drag-end", () => {
  dragOffset = null;
  dragStartBounds = null;
});

ipcMain.on("nova:window:roam", () => {
  if (!widget) return;
  const bounds = widget.getBounds();
  const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
  const area = display.workArea;

  const roamDistance = 20;
  const newX = bounds.x + (Math.random() * roamDistance * 2 - roamDistance);
  const newY = bounds.y + (Math.random() * roamDistance * 2 - roamDistance);

  const x = Math.max(area.x, Math.min(newX, area.x + area.width - bounds.width));
  const y = Math.max(area.y, Math.min(newY, area.y + area.height - bounds.height));

  widget.setBounds({ x: Math.round(x), y: Math.round(y), width: bounds.width, height: bounds.height });
});

ipcMain.on("nova:media:playpause", () => {
  (global as any).typingWorker?.stdin?.write("playpause\n");
});
ipcMain.on("nova:media:next", () => {
  (global as any).typingWorker?.stdin?.write("next\n");
});
ipcMain.on("nova:media:previous", () => {
  (global as any).typingWorker?.stdin?.write("previous\n");
});
