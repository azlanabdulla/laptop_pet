/// <reference types="vite/client" />

type NovaMood =
  | "happy"
  | "thinking"
  | "working"
  | "sleeping"
  | "excited"
  | "error"
  | "celebration"
  | "furious"
  | "listening"
  | "stretching"
  | "weather-sun"
  | "weather-rain"
  | "weather-snow"
  | "weather-cloudy";

interface NovaSettings {
  userName: string;
  petName?: string;
  theme: "nova" | "cyberpunk" | "arc" | "minimal";
  launchAtLogin: boolean;
  stretchIntervalMinutes: number;
}

interface NovaNote {
  id: number;
  body: string;
  createdAt: number;
}

interface SystemSnapshot {
  cpu: number;
  memory: number;
  battery: number | null;
  charging: boolean;
  online: boolean;
  timestamp: number;
}

interface Window {
  nova?: {
    settings: {
      get: () => Promise<NovaSettings>;
      save: (settings: NovaSettings) => Promise<NovaSettings>;
    };
    notes: {
      list: () => Promise<NovaNote[]>;
      add: (body: string) => Promise<NovaNote[]>;
      remove: (id: number) => Promise<NovaNote[]>;
    };
    system: () => Promise<SystemSnapshot>;
    onVoiceEvent: (callback: (payload: unknown) => void) => () => void;
    onGlobalTyping: (callback: () => void) => () => void;
    onMusicState: (callback: (playing: boolean) => void) => () => void;
    hide: () => Promise<void>;
    setExpanded: (expanded: boolean) => Promise<void>;
    dragWindow: {
      start: (x: number, y: number) => void;
      move: (x: number, y: number) => void;
      end: () => void;
    };
  };
}
