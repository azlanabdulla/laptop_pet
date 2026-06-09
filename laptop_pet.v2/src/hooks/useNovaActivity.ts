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
      
      idleTimer.current = window.setTimeout(() => {
        setMood("sleeping");
      }, 60_000);
      
      // @ts-ignore
      setMood((prev) => (prev === "sleeping" ? "happy" : prev));
    };
    const onPointer = (event: PointerEvent) => {
      const now = performance.now();
      const distance = Math.hypot(
        event.clientX - lastPointer.current.x,
        event.clientY - lastPointer.current.y
      );
      const elapsed = Math.max(now - lastPointer.current.at, 16);
      
      // Track directional changes for "hunting" pattern
      const dirX = Math.sign(event.clientX - lastPointer.current.x);
      // @ts-ignore
      window.dirChanges = window.dirChanges || [];
      // @ts-ignore
      const lastDir = window.dirChanges[window.dirChanges.length - 1];
      if (dirX !== 0 && dirX !== lastDir) {
        // @ts-ignore
        window.dirChanges.push(dirX);
        // @ts-ignore
        if (window.dirChanges.length > 5) window.dirChanges.shift();
      }

      if (now - lastPointerUpdate.current > 100) {
        setPointer({ x: event.clientX, y: event.clientY });
        lastPointerUpdate.current = now;
      }

      const velocity = (distance / elapsed) * 1000;
      
      // @ts-ignore
      if (!window.scrollMoodTimer) {
        // @ts-ignore
        if (window.dirChanges && window.dirChanges.length >= 4 && velocity > 800) {
          setMood("hunting");
          // @ts-ignore
          if (window.huntingTimer) window.clearTimeout(window.huntingTimer);
          // @ts-ignore
          window.huntingTimer = window.setTimeout(() => setMood("happy"), 1500);
        } else if (velocity > 1800) {
          setMood("excited");
        }
      }
      
      lastPointer.current = { x: event.clientX, y: event.clientY, at: now };
      wake();
    };
    const onKey = (e?: KeyboardEvent) => {
      // Filter out modifier keys if event is provided
      if (e) {
        const ignoredKeys = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape', 'AudioVolumeUp', 'AudioVolumeDown', 'AudioVolumeMute', 'MediaPlayPause'];
        if (ignoredKeys.includes(e.key)) return;
      }
      
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

    const onWheel = () => {
      setMood("scrolling");
      // @ts-ignore
      if (window.scrollMoodTimer) window.clearTimeout(window.scrollMoodTimer);
      // @ts-ignore
      window.scrollMoodTimer = window.setTimeout(() => setMood("happy"), 800);
      wake();
    };

    window.addEventListener("pointermove", onPointer);
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel);
    const cleanupGlobalTyping = window.nova?.onGlobalTyping?.(() => {
      onKey();
    });
    wake();
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
      cleanupGlobalTyping?.();
      window.clearTimeout(idleTimer.current);
    };
  }, [setMood]);

  return { pointer, typingRate };
}
