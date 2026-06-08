import { app, BrowserWindow } from "electron";
import { NovaStore } from "./store.js";
import { RegistryManager } from "./registry.js";

export class ShutdownManager {
  /**
   * Executes cleanup routines, saves state, and terminates cleanly.
   */
  static async executeTrueExit(
    store: NovaStore,
    widget: BrowserWindow,
    killWorkers: () => void
  ) {
    console.log("[Shutdown] Executing cleanup routines...");

    try {
      // 1. Save widget position and companion state
      const bounds = widget.getBounds();
      const settings = store.getSettings();
      settings.windowPosition = { x: bounds.x, y: bounds.y };
      
      console.log("[Shutdown] Saving memory and current state...");
      store.saveSettings(settings);

      // 2. Stop monitoring threads and AI agent workers
      console.log("[Shutdown] Stopping monitoring threads...");
      killWorkers();

      // 3. Database connections are closed automatically on exit by better-sqlite3
      // but we ensure all synchronous writes are completed here.
      
      console.log("[Shutdown] Writing logs safely. Terminating application.");
    } catch (error) {
      console.error("[Shutdown] Error during shutdown:", error);
    } finally {
      // 4. Fully terminate the application
      app.quit();
    }
  }
}
