import { BrowserWindow, screen } from "electron";
import { NovaStore } from "./store.js";
import { RegistryManager } from "./registry.js";

export class StartupManager {
  /**
   * Performs all initialization tasks required when NOVA launches.
   */
  static async initialize(
    store: NovaStore,
    widget: BrowserWindow,
    startWorkers: () => void
  ) {
    try {
      console.log("[Startup] Loading user settings and memory database...");
      const settings = store.getSettings();

      // 1. Restore widget position
      if (settings.windowPosition) {
        const display = screen.getDisplayNearestPoint({ x: settings.windowPosition.x, y: settings.windowPosition.y });
        const area = display.workArea;
        
        let newX = settings.windowPosition.x;
        let newY = settings.windowPosition.y;

        const width = 250;
        const height = 260;

        if (newX + width > area.x + area.width) newX = area.x + area.width - width;
        if (newY + height > area.y + area.height) newY = area.y + area.height - height;
        newX = Math.max(area.x, newX);
        newY = Math.max(area.y, newY);

        widget.setPosition(newX, newY);
        console.log(`[Startup] Restored widget position to (${newX}, ${newY})`);
      } else {
        const display = screen.getPrimaryDisplay();
        widget.setPosition(display.bounds.width - 270, display.bounds.height - 310);
      }

      // 2. Verify registry auto-start entry
      console.log("[Startup] Verifying registry auto-start entry...");
      await RegistryManager.verifyAutoStart(settings.launchAtLogin);

      // 3. Start background monitoring services and agents
      console.log("[Startup] Starting background monitoring services...");
      startWorkers();

      console.log("[Startup] Initialization complete.");
    } catch (error) {
      console.error("[Startup] Error during startup initialization:", error);
    }
  }
}
