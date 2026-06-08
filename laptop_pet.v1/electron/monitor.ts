import { powerMonitor } from "electron";
import { networkInterfaces } from "node:os";
import si from "systeminformation";
import type { SystemSnapshot } from "./types.js";

export async function getSystemSnapshot(): Promise<SystemSnapshot> {
  const [load, memory, battery] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.battery(),
  ]);

  return {
    cpu: Math.round(load.currentLoad),
    memory: Math.round((memory.active / memory.total) * 100),
    battery: battery.hasBattery ? Math.round(battery.percent) : null,
    charging: battery.isCharging,
    online: Object.values(networkInterfaces()).some((addresses) =>
      addresses?.some((address) => !address.internal),
    ),
    timestamp: Date.now(),
  };
}
