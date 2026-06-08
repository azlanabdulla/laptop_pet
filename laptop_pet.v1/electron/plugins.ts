import { EventEmitter } from "node:events";

export interface NovaPlugin {
  id: string;
  start(context: PluginContext): void | Promise<void>;
  stop?(): void | Promise<void>;
}

export interface PluginContext {
  emit: (event: string, payload?: unknown) => void;
}

export class PluginHost extends EventEmitter {
  private plugins = new Map<string, NovaPlugin>();

  register(plugin: NovaPlugin) {
    if (this.plugins.has(plugin.id)) throw new Error(`Plugin already registered: ${plugin.id}`);
    this.plugins.set(plugin.id, plugin);
  }

  async startAll() {
    for (const plugin of this.plugins.values()) {
      await plugin.start({ emit: (event, payload) => this.emit(event, payload) });
    }
  }

  async stopAll() {
    for (const plugin of this.plugins.values()) await plugin.stop?.();
  }
}
