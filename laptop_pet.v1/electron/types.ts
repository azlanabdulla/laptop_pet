export type NovaMood =
  | "happy"
  | "thinking"
  | "working"
  | "sleeping"
  | "excited"
  | "error"
  | "celebration"
  | "listening";

export interface NovaSettings {
  userName: string;
  petName?: string;
  theme: "nova" | "cyberpunk" | "arc" | "minimal";
  launchAtLogin: boolean;
  stretchIntervalMinutes: number;
  windowPosition?: { x: number; y: number };
}

export interface SystemSnapshot {
  cpu: number;
  memory: number;
  battery: number | null;
  charging: boolean;
  online: boolean;
  timestamp: number;
}
