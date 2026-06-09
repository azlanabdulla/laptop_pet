import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CommandPanel } from "./components/CommandPanel";
import { NovaMascot } from "./components/NovaMascot";
import { useNovaActivity } from "./hooks/useNovaActivity";

const fallbackSettings: NovaSettings = {
  userName: "",
  petName: "",
  theme: "nova",
  launchAtLogin: true,
  stretchIntervalMinutes: 45,
  level: 1,
  xp: 0,
  petColor: "#ff8800",
  accentColor: "#00f3ff",
};

export function App() {
  const [mood, setMoodState] = useState<NovaMood>("happy");
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState("");
  const [settings, setSettings] = useState(fallbackSettings);
  const [notes, setNotes] = useState<NovaNote[]>([]);
  const [system, setSystem] = useState<SystemSnapshot | null>(null);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const setMood = useCallback((next: NovaMood) => setMoodState(next), []);
  const { pointer, typingRate } = useNovaActivity(setMood);

  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    void window.nova?.settings.get().then((s: any) => {
      if (s) {
        setSettings(s);
        if (!s.userName || !s.petName) setShowWelcome(true);
      } else {
        setShowWelcome(true);
      }
    });
    void window.nova?.notes.list().then(setNotes);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const refresh = () => void window.nova?.system().then(setSystem);
    refresh();
    const interval = window.setInterval(refresh, 2000);
    return () => window.clearInterval(interval);
  }, [expanded]);

  // Stretch Reminder
  useEffect(() => {
    if (!settings.stretchIntervalMinutes) return;
    const intervalId = window.setInterval(() => {
      setMood("stretching");
      setMessage("Time to stretch!");
      
      // Clear the stretching state after 5 seconds
      window.setTimeout(() => {
        setMood("happy");
        setMessage("");
      }, 5000);
      
    }, settings.stretchIntervalMinutes * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, [settings.stretchIntervalMinutes, setMood]);



  useEffect(() => {
    const unsubState = window.nova?.onMusicState?.((playing: boolean) => {
      setIsMusicPlaying(playing);
    });
    const unsubScroll = window.nova?.onScroll?.((dir: string) => {
      setMood("scrolling");
      // @ts-ignore
      if (window.scrollMoodTimer) window.clearTimeout(window.scrollMoodTimer);
      // @ts-ignore
      window.scrollMoodTimer = window.setTimeout(() => setMood("happy"), 800);
    });

    return () => {
      unsubState?.();
      unsubScroll?.();
    };
  }, []);

  useEffect(() => {
    if (!pomodoroRunning) return;
    const timer = window.setInterval(() => {
      setPomodoroSeconds((seconds) => {
        if (seconds > 1) return seconds - 1;
        setPomodoroRunning(false);
        setMood("celebration");
        setMessage("Focus session complete");
        
        // Add XP
        const currentXp = settings.xp || 0;
        const currentLevel = settings.level || 1;
        const newXp = currentXp + 50;
        if (newXp >= 100) {
          saveSettings({ ...settings, xp: newXp - 100, level: currentLevel + 1 });
        } else {
          saveSettings({ ...settings, xp: newXp });
        }
        
        return 25 * 60;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [pomodoroRunning, setMood]);

  const progress = useMemo(
    () => ((25 * 60 - pomodoroSeconds) / (25 * 60)) * 100,
    [pomodoroSeconds],
  );

  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    void window.nova?.setExpanded(next);
  };

  const saveSettings = (next: NovaSettings) => {
    setSettings(next);
    void window.nova?.settings.save(next).then(setSettings);
  };

  const [showLevelUp, setShowLevelUp] = useState(false);
  const prevLevelRef = useRef(settings.level);

  useEffect(() => {
    if (settings.level > prevLevelRef.current) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }
    prevLevelRef.current = settings.level;
  }, [settings.level]);

  let displayMood = mood;
  if (showLevelUp) displayMood = "levelup";
  else if (isMusicPlaying) displayMood = "listening";
  
  const handleHover = () => {
    if (mood === "sleeping") setMood("happy");
  };

  return (
    <main 
      className={`nova-app theme-${settings.theme}`}
      style={{ "--accent": settings.accentColor || "#43eaff" } as React.CSSProperties}
    >
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.85)",
              zIndex: 1000
            }}
          >
            <div className="command-panel" style={{ width: 350, textAlign: "center" }}>
              <strong style={{ color: "#fff", fontSize: 18, display: "block", marginBottom: 8 }}>WELCOME TO NOVA PET</strong>
              <small style={{ color: "#fff", display: "block", marginBottom: 20 }}>Let's configure your companion</small>
              
              <div style={{ textAlign: "left", marginBottom: 12 }}>
                <small style={{ color: "#fff", display: "block", marginBottom: 4 }}>YOUR NAME</small>
                <input 
                  type="text" 
                  value={settings.userName || ""} 
                  onChange={e => setSettings({...settings, userName: e.target.value})}
                  style={{ width: "100%", padding: 8, background: "#000", color: "#fff", border: "2px solid #fff", fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ textAlign: "left", marginBottom: 24 }}>
                <small style={{ color: "#fff", display: "block", marginBottom: 4 }}>PET NAME</small>
                <input 
                  type="text" 
                  value={settings.petName || ""} 
                  onChange={e => setSettings({...settings, petName: e.target.value})}
                  style={{ width: "100%", padding: 8, background: "#000", color: "#fff", border: "2px solid #fff", fontFamily: 'monospace' }}
                />
              </div>
              
              <button 
                onClick={() => {
                  if (settings.userName && settings.petName) {
                    saveSettings(settings);
                    setShowWelcome(false);
                  }
                }}
                style={{ width: "100%", padding: 12, background: "#fff", color: "#000", border: "none", fontWeight: "bold", cursor: "pointer", fontFamily: 'monospace' }}
              >
                START
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {expanded && (
          <motion.div
            style={{ position: 'absolute', bottom: 85, right: 280, zIndex: 100 }}
            initial={{ opacity: 0, x: 12, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 8, scale: 0.97 }}
          >
            <CommandPanel
              settings={settings}
              notes={notes}
              system={system}
              pomodoroSeconds={pomodoroSeconds}
              pomodoroRunning={pomodoroRunning}
              onSettings={saveSettings}
              onAddNote={(body) => {
                void window.nova?.notes.add(body).then(setNotes);
                const currentXp = settings.xp || 0;
                const currentLevel = settings.level || 1;
                const newXp = currentXp + 5;
                if (newXp >= 100) {
                  saveSettings({ ...settings, xp: newXp - 100, level: currentLevel + 1 });
                } else {
                  saveSettings({ ...settings, xp: newXp });
                }
              }}
              onDeleteNote={(id) => void window.nova?.notes.remove(id).then(setNotes)}
              onPomodoro={() => {
                setPomodoroRunning((value) => !value);
                setMood("working");
              }}
              onClose={toggleExpanded}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(showLevelUp || message || notes.length > 0) && (
          <motion.div
            className={`speech pixel-comic ${showLevelUp ? 'levelup-text' : ''}`}
            initial={{ opacity: 0, x: "-50%", y: 8, scale: 0.96 }}
            animate={{ opacity: 1, x: "-50%", y: 0, scale: 1 }}
            exit={{ opacity: 0, x: "-50%" }}
          >
            {showLevelUp ? "LEVEL UP!" : (message || notes[0]?.body)}
          </motion.div>
        )}
      </AnimatePresence>

      <NovaMascot
        mood={displayMood}
        pointer={pointer}
        progress={progress}
        typingRate={typingRate}
        petColor={settings.petColor}
        accentColor={settings.accentColor}
        onActivate={toggleExpanded}
        onHover={handleHover}
      />
    </main>
  );
}
