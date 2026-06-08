import { useEffect, useRef, useState } from "react";

export function useNovaActivity(setMood: (mood: NovaMood) => void) {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [typingRate, setTypingRate] = useState(0);
  const lastPointer = useRef({ x: 0, y: 0, at: performance.now() });
  const lastPointerUpdate = useRef(0);
  const keyTimes = useRef<number[]>([]);
  const lastKeyUpdate = useRef(0);
  const idleTimer = useRef<number>(0);

  useEffect(() => {
    const wake = () => {
      window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => setMood("sleeping"), 60_000);
      // @ts-ignore
      setMood((prev) => (prev === "sleeping" ? "happy" : prev));
    };
    const onPointer = (event: PointerEvent) => {
      const now = performance.now();
      const elapsed = Math.max(now - lastPointer.current.at, 16);
      const distance = Math.hypot(
        event.clientX - lastPointer.current.x,
        event.clientY - lastPointer.current.y,
      );
      
      if (now - lastPointerUpdate.current > 100) {
        setPointer({ x: event.clientX, y: event.clientY });
        lastPointerUpdate.current = now;
      }
      
      if ((distance / elapsed) * 1000 > 1800) setMood("excited");
      lastPointer.current = { x: event.clientX, y: event.clientY, at: now };
      wake();
    };
    const onKey = () => {
      const now = performance.now();
      keyTimes.current = [...keyTimes.current.filter((time) => now - time < 1500), now];
      const rate = keyTimes.current.length;
      
      if (now - lastKeyUpdate.current > 200) {
        setTypingRate(rate);
        setMood(rate > 50 ? "error" : "working");
        lastKeyUpdate.current = now;
      }
      
      if (keyTimes.current.length > 0) {
        // @ts-ignore
        if (window.decayTimer) window.clearTimeout(window.decayTimer);
        // @ts-ignore
        window.decayTimer = window.setTimeout(() => {
          setTypingRate(0);
          setMood("happy");
        }, 1000);
      }
      wake();
    };
    window.addEventListener("pointermove", onPointer);
    window.addEventListener("keydown", onKey);
    const cleanupGlobalTyping = window.nova?.onGlobalTyping?.(() => {
      onKey();
    });
    wake();
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("keydown", onKey);
      cleanupGlobalTyping?.();
      window.clearTimeout(idleTimer.current);
    };
  }, [setMood]);

  return { pointer, typingRate };
}
