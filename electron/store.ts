import Database from "better-sqlite3";
import { app } from "electron";
import path from "node:path";
import type { NovaSettings } from "./types.js";

const defaults: NovaSettings = {
  userName: "",
  petName: "",
  theme: "nova",
  launchAtLogin: true,
  stretchIntervalMinutes: 60,
};

export class NovaStore {
  private db: Database.Database;

  constructor() {
    this.db = new Database(path.join(app.getPath("userData"), "nova-pet.db"));
    this.db.pragma("journal_mode = WAL");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        body TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        due_at INTEGER NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kind TEXT NOT NULL,
        earned_at INTEGER NOT NULL
      );
    `);
  }

  getSettings(): NovaSettings {
    const rows = this.db.prepare("SELECT key, value FROM settings").all() as Array<{
      key: keyof NovaSettings;
      value: string;
    }>;
    const saved = Object.fromEntries(rows.map((row) => [row.key, JSON.parse(row.value)]));
    return { ...defaults, ...saved };
  }

  saveSettings(settings: NovaSettings): NovaSettings {
    const statement = this.db.prepare(
      "INSERT INTO settings(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    );
    const transaction = this.db.transaction(() => {
      Object.entries(settings).forEach(([key, value]) =>
        statement.run(key, JSON.stringify(value)),
      );
    });
    transaction();
    return this.getSettings();
  }

  listNotes() {
    return this.db
      .prepare("SELECT id, body, created_at AS createdAt FROM notes ORDER BY id DESC")
      .all();
  }

  addNote(body: string) {
    this.db.prepare("INSERT INTO notes(body, created_at) VALUES (?, ?)").run(body, Date.now());
    return this.listNotes();
  }

  deleteNote(id: number) {
    this.db.prepare("DELETE FROM notes WHERE id = ?").run(id);
    return this.listNotes();
  }
}
