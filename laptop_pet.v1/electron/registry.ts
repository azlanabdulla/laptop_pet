import { app } from "electron";

export const RegistryManager = {
  /**
   * Registers NOVA Core to start automatically with Windows.
   */
  async enableAutoStart(): Promise<void> {
    if (process.platform !== "win32") return;
    try {
      app.setLoginItemSettings({
        openAtLogin: true,
        path: app.getPath("exe"),
        args: app.isPackaged ? [] : [app.getAppPath()]
      });
      console.log("[Registry] Auto-start enabled successfully.");
    } catch (error) {
      console.error("[Registry] Failed to enable auto-start:", error);
    }
  },

  /**
   * Removes NOVA Core from Windows startup.
   */
  async disableAutoStart(): Promise<void> {
    if (process.platform !== "win32") return;
    try {
      app.setLoginItemSettings({
        openAtLogin: false,
        path: app.getPath("exe"),
        args: app.isPackaged ? [] : [app.getAppPath()]
      });
      console.log("[Registry] Auto-start disabled successfully.");
    } catch (error) {
      console.log("[Registry] Auto-start is already disabled:", error);
    }
  },

  /**
   * Verifies if the auto-start setting matches user preference.
   */
  async verifyAutoStart(shouldBeEnabled: boolean): Promise<void> {
    if (process.platform !== "win32") return;
    try {
      const settings = app.getLoginItemSettings({
        path: app.getPath("exe"),
        args: app.isPackaged ? [] : [app.getAppPath()]
      });
      if (settings.executableWillLaunchAtLogin !== shouldBeEnabled) {
        if (shouldBeEnabled) {
          console.log("[Registry] Auto-start key missing, recreating...");
          await this.enableAutoStart();
        } else {
          await this.disableAutoStart();
        }
      }
    } catch (error) {
      console.error("[Registry] Failed to verify auto-start:", error);
    }
  }
};

