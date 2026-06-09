import { motion } from "framer-motion";
import { useRef, useState } from "react";

interface NovaOrbProps {
  mood: NovaMood;
  pointer: { x: number; y: number };
  progress: number;
  onHover: () => void;
  onActivate: () => void;
}

export function NovaOrb({ mood, pointer, progress, onHover, onActivate }: NovaOrbProps) {
  const [dragging, setDragging] = useState(false);
  const lastPoint = useRef({ x: 0, y: 0, at: 0 });
  const eyeX = Math.max(-5, Math.min(5, (pointer.x - window.innerWidth / 2) / 24));
  const eyeY = Math.max(-4, Math.min(4, (pointer.y - 125) / 26));

  const startDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    lastPoint.current = { x: event.screenX, y: event.screenY, at: performance.now() };
    setDragging(true);
    window.nova?.dragWindow.start(event.screenX, event.screenY);
  };

  const moveDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging) return;
    const now = performance.now();
    const elapsed = Math.max(now - lastPoint.current.at, 16);
    const speed =
      (Math.hypot(event.screenX - lastPoint.current.x, event.screenY - lastPoint.current.y) /
        elapsed) *
      1000;
    if (speed > 1500) onHover();
    lastPoint.current = { x: event.screenX, y: event.screenY, at: now };
    window.nova?.dragWindow.move(event.screenX, event.screenY);
  };

  const endDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false);
    window.nova?.dragWindow.end();
  };

  return (
    <motion.button
      className={`nova-orb mood-${mood}`}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onMouseEnter={onHover}
      onDoubleClick={onActivate}
      animate={{
        y: dragging ? 0 : [0, -6, 0],
        scaleX: dragging ? 1.09 : 1,
        scaleY: dragging ? 0.94 : 1,
        rotate: mood === "celebration" ? [0, 7, -7, 0] : 0,
      }}
      transition={{ y: { repeat: Infinity, duration: 3.8, ease: "easeInOut" } }}
      aria-label="Open Nova Pet"
    >
      <span className="particle-field" />
      <span className="orbit orbit-a" />
      <span className="orbit orbit-b" />
      <span className="orbit orbit-c" />
      <span className="core-shell">
        <span className="scanline" />
        <span className="brow brow-left" />
        <span className="brow brow-right" />
        <span className="eye eye-left">
          <span className="iris" style={{ transform: `translate(${eyeX}px, ${eyeY}px)` }}>
            <span className="pupil" />
          </span>
        </span>
        <span className="eye eye-right">
          <span className="iris" style={{ transform: `translate(${eyeX}px, ${eyeY}px)` }}>
            <span className="pupil" />
          </span>
        </span>
        <span className="mouth"><span /></span>
        <span className="core-light" />
      </span>
      <svg className="progress-ring" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r="84" />
        <circle
          className="progress-value"
          cx="90"
          cy="90"
          r="84"
          pathLength="100"
          strokeDasharray={`${progress} 100`}
        />
      </svg>
      {mood === "error" && <span className="sparks">+ * +</span>}
    </motion.button>
  );
}
