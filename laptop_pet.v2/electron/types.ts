export type NovaMood =
  | "happy"
  | "thinking"
  | "working"
  | "sleeping"
  | "excited"
  | "error"
  | "celebration"
  | "listening"
  | "hunting"
  | "scrolling";

export interface NovaSettings {
  userName: string;
  petName?: string;
  theme: "nova" | "cyberpunk" | "arc" | "minimal";
  launchAtLogin: boolean;
  stretchIntervalMinutes: number;
  windowPosition?: { x: number; y: number };
  level: number;
  xp: number;
  petColor: string;
  accentColor: string;
}

export interface SystemSnapshot {
  cpu: number;
  memory: number;
  battery: number | null;
  charging: boolean;
  online: boolean;
  timestamp: number;
}
