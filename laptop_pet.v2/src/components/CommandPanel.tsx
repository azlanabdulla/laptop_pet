import { useState, useEffect } from "react";

interface CommandPanelProps {
  settings: NovaSettings;
  notes: NovaNote[];
  system: SystemSnapshot | null;
  pomodoroSeconds: number;
  pomodoroRunning: boolean;
  onSettings: (settings: NovaSettings) => void;
  onAddNote: (body: string) => void;
  onDeleteNote: (id: number) => void;
  onPomodoro: () => void;
  onClose: () => void;
}

export function CommandPanel(props: CommandPanelProps) {
  const [note, setNote] = useState("");
  const [setupUserName, setSetupUserName] = useState("");
  const [setupPetName, setSetupPetName] = useState("");
  const [reminderText, setReminderText] = useState("");
  const [activeTab, setActiveTab] = useState<"tasks" | "reminders" | "settings">("tasks");
  const [mediaState, setMediaState] = useState({ playing: false, title: "", artist: "" });

  useEffect(() => {
    const unsubState = window.nova?.onMusicState?.((playing) => setMediaState(s => ({ ...s, playing })));
    const unsubTitle = window.nova?.onMediaTitle?.((title) => setMediaState(s => ({ ...s, title })));
    const unsubArtist = window.nova?.onMediaArtist?.((artist) => setMediaState(s => ({ ...s, artist })));
    
    return () => {
      unsubState?.();
      unsubTitle?.();
      unsubArtist?.();
    };
  }, []);

  const needsSetup = !props.settings.userName || !props.settings.petName;

  const minutes = String(Math.floor(props.pomodoroSeconds / 60)).padStart(2, "0");
  const seconds = String(props.pomodoroSeconds % 60).padStart(2, "0");

  if (needsSetup) {
    return (
      <section className="command-panel setup-panel">
        <header>
          <div>
            <strong>Welcome!</strong>
            <small>Let's set up your new companion</small>
          </div>
        </header>
        <form
          className="setup-form"
          style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}
          onSubmit={(e) => {
            e.preventDefault();
            if (setupUserName.trim() && setupPetName.trim()) {
              props.onSettings({
                ...props.settings,
                userName: setupUserName.trim(),
                petName: setupPetName.trim()
              });
            }
          }}
        >
          <div>
            <label style={{ fontSize: '12px', opacity: 0.7 }}>Your Name</label>
            <input
              style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', color: 'white' }}
              value={setupUserName}
              onChange={(e) => setSetupUserName(e.target.value)}
              placeholder="e.g. Azlan"
              autoFocus
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', opacity: 0.7 }}>Pet Name</label>
            <input
              style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', color: 'white' }}
              value={setupPetName}
              onChange={(e) => setSetupPetName(e.target.value)}
              placeholder="e.g. Nova"
            />
          </div>
          <button style={{ padding: '8px', background: 'var(--accent, #00f0ff)', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Start
          </button>
        </form>
      </section>
    );
  }

  const { level = 1, xp = 0 } = props.settings;
  const xpPercent = Math.min(100, (xp / 100) * 100);

  return (
    <section className="command-panel">
      <header>
        <div>
          <small>{(props.settings.petName || "NOVA PET").toUpperCase()} // LVL {level}</small>
          <strong>Hello, {props.settings.userName}</strong>
        </div>
        <button onClick={props.onClose} aria-label="Close panel">×</button>
      </header>

      <div className="xp-bar" style={{ height: 4, background: 'rgba(255,255,255,0.1)', margin: '8px 0', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${xpPercent}%`, height: '100%', background: 'var(--accent, #00f0ff)', transition: 'width 0.3s' }} />
      </div>

      <div className="tabs" style={{ display: 'flex', gap: '10px', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px' }}>
        <button style={{ opacity: activeTab === 'tasks' ? 1 : 0.5, background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => setActiveTab('tasks')}>Tasks</button>
        <button style={{ opacity: activeTab === 'reminders' ? 1 : 0.5, background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => setActiveTab('reminders')}>Reminders</button>
        <button style={{ opacity: activeTab === 'settings' ? 1 : 0.5, background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => setActiveTab('settings')}>Settings</button>
      </div>

      {activeTab === 'tasks' && (
        <>
          <div className="pomodoro">
            <span>{minutes}:{seconds}</span>
            <button onClick={props.onPomodoro}>
              {props.pomodoroRunning ? "Pause focus" : "Start focus"}
            </button>
          </div>

          <form
            className="note-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!note.trim()) return;
              props.onAddNote(note);
              setNote("");
            }}
          >
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={`Attach a note to ${props.settings.petName || "NOVA"}...`}
            />
            <button>Add</button>
          </form>

          <div className="notes">
            {props.notes.slice(0, 3).map((item) => (
              <button key={item.id} onClick={() => props.onDeleteNote(item.id)}>
                {item.body}<span>×</span>
              </button>
            ))}
          </div>
        </>
      )}

      {activeTab === 'reminders' && (
        <div className="reminders-tab">
          <form
            style={{ display: 'flex', gap: '5px' }}
            onSubmit={(event) => {
              event.preventDefault();
              if (!reminderText.trim()) return;
              window.nova?.notes.add(`[REMINDER] ${reminderText}`); // Hack using notes for now
              setReminderText("");
            }}
          >
            <input
              style={{ flex: 1, padding: '5px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }}
              value={reminderText}
              onChange={(event) => setReminderText(event.target.value)}
              placeholder="Remind me to..."
            />
            <button style={{ padding: '5px 10px', background: 'var(--accent)', border: 'none' }}>Set</button>
          </form>
          <div className="media-controls" style={{ marginTop: '15px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '4px' }}>
            <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '5px' }}>NOW PLAYING</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{mediaState.title || "Waiting for media..."}</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>{mediaState.artist || ""}</div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'center' }}>
              <button onClick={() => window.nova?.media?.previous()} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>⏮</button>
              <button onClick={() => window.nova?.media?.playPause()} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>{mediaState.playing ? '⏸' : '⏯'}</button>
              <button onClick={() => window.nova?.media?.next()} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>⏭</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="settings-tab" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            Primary Color:
            <input type="color" value={props.settings.petColor || "#ff8800"} onChange={(e) => props.onSettings({ ...props.settings, petColor: e.target.value })} style={{ width: '40px', height: '30px', padding: 0, border: 'none' }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            Accent Color:
            <input type="color" value={props.settings.accentColor || "#00f3ff"} onChange={(e) => props.onSettings({ ...props.settings, accentColor: e.target.value })} style={{ width: '40px', height: '30px', padding: 0, border: 'none' }} />
          </label>
          <button 
            className="pixel-btn" 
            style={{ marginTop: '10px' }}
            onClick={() => props.onSettings({ ...props.settings, petColor: '#ff8800', accentColor: '#00f3ff' })}
          >
            Reset to Default Colors
          </button>
        </div>
      )}
    </section>
  );
}
