import { useCallback, useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    void window.nova?.settings.get().then(setSettings);
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
    const unsub = window.nova?.onMusicState?.((playing: boolean) => {
      setIsMusicPlaying(playing);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!pomodoroRunning) return;
    const timer = window.setInterval(() => {
      setPomodoroSeconds((seconds) => {
        if (seconds > 1) return seconds - 1;
        setPomodoroRunning(false);
        setMood("celebration");
        setMessage("Focus session complete");
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

  let displayMood = mood;
  if (isMusicPlaying) displayMood = "listening";

  return (
    <main className={`nova-app theme-${settings.theme}`}>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
          >
            <CommandPanel
              settings={settings}
              notes={notes}
              system={system}
              pomodoroSeconds={pomodoroSeconds}
              pomodoroRunning={pomodoroRunning}
              onSettings={saveSettings}
              onAddNote={(body) => void window.nova?.notes.add(body).then(setNotes)}
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
        {(message || notes.length > 0) && (
          <motion.div
            className="speech pixel-comic"
            initial={{ opacity: 0, x: "-50%", y: 8, scale: 0.96 }}
            animate={{ opacity: 1, x: "-50%", y: 0, scale: 1 }}
            exit={{ opacity: 0, x: "-50%" }}
          >
            {message || notes[0].body}
          </motion.div>
        )}
      </AnimatePresence>



      <NovaMascot
        mood={displayMood}
        pointer={pointer}
        progress={progress}
        typingRate={typingRate}
        onActivate={toggleExpanded}
        onHover={() => {
          if (mood === "sleeping") setMood("happy");
        }}
      />
    </main>
  );
}
