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

let widget: BrowserWindow | null = null;
let tray: Tray | null = null;
let quitting = false;
let store: NovaStore;
let dragOffset: { x: number; y: number } | null = null;

function startTypingWorker() {
  const isPackaged = app.isPackaged;
  const projectRoot = path.resolve(dirname, "../..");
  const servicePath = isPackaged 
    ? path.join(process.resourcesPath, "services", "nova_typing_service.py")
    : path.join(projectRoot, "lap", "services", "nova_typing_service.py");
  const python = process.platform === "win32" ? "py" : "python3";
  const pythonArgs =
    process.platform === "win32"
      ? ["-3.13", "-u", servicePath]
      : ["-u", servicePath];

  const typingWorker = spawn(python, pythonArgs, {
    cwd: projectRoot,
    windowsHide: true,
    stdio: ["pipe", "pipe", "pipe"],
  });

  const output = readline.createInterface({ input: typingWorker.stdout });
  output.on("line", (line) => {
    import("node:fs").then(fs => fs.appendFileSync("c:/Users/AZLAN/Desktop/PROJECTS/LAP AI/main_debug.log", `Received: ${line}\n`));
    if (line.trim() === "keydown") {
      widget?.webContents.send("nova:global-typing");
    } else if (line.trim() === "music_start") {
      import("node:fs").then(fs => fs.appendFileSync("c:/Users/AZLAN/Desktop/PROJECTS/LAP AI/main_debug.log", `Sent IPC nova:music-state true\n`));
      widget?.webContents.send("nova:music-state", true);
    } else if (line.trim() === "music_stop") {
      import("node:fs").then(fs => fs.appendFileSync("c:/Users/AZLAN/Desktop/PROJECTS/LAP AI/main_debug.log", `Sent IPC nova:music-state false\n`));
      widget?.webContents.send("nova:music-state", false);
    }
  });
  
  typingWorker.stderr.on("data", (data) => {
    console.error("Python Typing Worker Error:", data.toString());
  });
  
  typingWorker.on("exit", () => {
    if (!quitting) setTimeout(startTypingWorker, 5000);
  });
}

function createWindow() {
  const display = screen.getPrimaryDisplay();
  widget = new BrowserWindow({
    width: 250,
    height: 260,
    x: display.bounds.width - 270,
    y: display.bounds.height - 310,
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
          if (widget) {
            ShutdownManager.executeTrueExit(store, widget, () => {});
          } else {
            app.quit();
          }
        },
      },
      {
        label: "Quit Nova Pet",
        click: () => {
          quitting = true;
          if (widget) {
            ShutdownManager.executeTrueExit(store, widget, () => {});
          } else {
            app.quit();
          }
        },
      },
    ]),
  );
  tray.on("click", () => (widget?.isVisible() ? widget.hide() : widget?.show()));
}

app.whenReady().then(() => {
  if (!hasInstanceLock) return;
  store = new NovaStore();
  createWindow();
  createTray();
  
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
  if (!quitting && widget) {
    // If not triggered by explicit quit menu, ensure we clean up.
    ShutdownManager.executeTrueExit(store, widget, () => {});
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

  const newWidth = expanded ? 390 : 250;
  const newHeight = expanded ? 520 : 260;

  // Calculate the current bottom-center of the window
  const bottomCenterX = bounds.x + bounds.width / 2;
  const bottomY = bounds.y + bounds.height;

  // Set the new bounds so that the new bottom-center exactly matches the old bottom-center
  let newX = Math.round(bottomCenterX - newWidth / 2);
  let newY = bottomY - newHeight;

  // Ensure the window doesn't go off-screen, but don't force shift it unless absolutely necessary 
  // (because shifting breaks the fox's fixed position relative to the desktop)
  if (newX < area.x) newX = area.x;
  if (newX + newWidth > area.x + area.width) newX = area.x + area.width - newWidth;
  if (newY < area.y) newY = area.y;
  if (newY + newHeight > area.y + area.height) newY = area.y + area.height - newHeight;

  widget.setBounds({ x: newX, y: newY, width: newWidth, height: newHeight }, true);
});
let dragStartBounds: { x: number; y: number; width: number; height: number } | null = null;

ipcMain.on("nova:window:drag-start", (_event, point: { x: number; y: number }) => {
  if (!widget) return;
  const bounds = widget.getBounds();
  dragOffset = { x: point.x - bounds.x, y: point.y - bounds.y };
  dragStartBounds = bounds;
});

ipcMain.on("nova:window:drag-move", (_event, point: { x: number; y: number }) => {
  if (!widget || !dragOffset || !dragStartBounds) return;
  const display = screen.getDisplayNearestPoint(point);
  const area = display.workArea;

  const rawX = point.x - dragOffset.x;
  const rawY = point.y - dragOffset.y;

  const x = Math.max(area.x, Math.min(rawX, area.x + area.width - 250));
  const y = Math.max(area.y, Math.min(rawY, area.y + area.height - 260));

  widget.setBounds({ x: Math.round(x), y: Math.round(y), width: 250, height: 260 });
});

ipcMain.on("nova:window:drag-end", () => {
  dragOffset = null;
  dragStartBounds = null;
});
