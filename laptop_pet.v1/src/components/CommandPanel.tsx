import { useState } from "react";

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

  return (
    <section className="command-panel">
      <header>
        <div>
          <small>{(props.settings.petName || "NOVA PET").toUpperCase()} // ONLINE</small>
          <strong>Hello, {props.settings.userName}</strong>
        </div>
        <button onClick={props.onClose} aria-label="Close panel">×</button>
      </header>

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
    </section>
  );
}
