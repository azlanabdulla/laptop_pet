import { motion, useSpring, useTransform, useMotionValue } from "framer-motion";
import { useEffect, useRef, useState, memo } from "react";

const PALETTE: Record<string, string> = {
  O: "var(--fox-color, #ff8800)", // Bright Orange
  D: "var(--fox-shade, #e66a00)", // Dark Orange (Shading)
  W: "#ffffff", // White
  B: "#1a1a1a", // Deep Black (Outline)
  E: "#0f0f0f", // Eye Black
  P: "#ff99cc", // Pink (Paws/Ears)
  R: "#ff0000", // Red (Heart)
};

// --- ASCII Pixel Art Data ---

const ASC_HEAD = [
  "   BBBBBBBBBB   ",
  "  BDOOOOOOOODB  ",
  " BOOOOOOOOOOOOB ",
  " BOOOOOOOOOOOOB ",
  " BOWWWOOOOWWWOB ",
  " BOWWWOOOOWWWOB ",
  " BWWWWWBBWWWWWB ",
  "  BWWWBBBBWWWB  ",
  "   BWWWWWWWWB   ",
  "    BBBBBBBB    "
];

const ASC_EAR_L = [
  "   BBB ",
  "  BPOB ",
  " BPPOB ",
  " BPPDB ",
  " BDDDB ",
  " BOOOB ",
  " BBBBB "
];

const ASC_EAR_R = [
  " BBB   ",
  " BOPB  ",
  " BOPPB ",
  " BDPPB ",
  " BDDDB ",
  " BOOOB ",
  " BBBBB "
];



const ASC_BODY_TOP = [
  "   BBBBBBBB   ",
  "  BDOOOOOODB  ",
  " BDOOOWWOOODB "
];

const ASC_BODY_MID = [
  " BOOOWWWWOOOB ",
  " BOOOWWWWOOOB ",
  " BOOOWWWWOOOB "
];

const ASC_BODY_BOT = [
  " BWOBWWWWBOWB ",
  " BWOBWWWWBOWB ",
  " BWOBBBBBBOWB "
];

const ASC_PAW = [
  "BBWBB",
  "BWWWB",
  "BBBBB"
];

const ASC_KEYBOARD = [
  "  BBBBBBBBBBBBBBB  ",
  " BWWWWWWWWWWWWWWWB ",
  " BDDDDDDDDDDDDDDDB ",
  " BBBBBBBBBBBBBBBBB "
];

const ASC_TAIL = [
  "    BBB  ",
  "   BDDB  ",
  "  BDOODB ",
  " BDOOOODB",
  " BDOOOODB",
  " BDWOOWDB",
  " BWWWWWWB",
  " BWWWWWB ",
  "  BWWWB  ",
  "   BWB   ",
  "    B    "
];

const ASC_BUBBLE = [
  "   BBBBBBBBBBBBBB   ",
  "  BWWWWWWWWWWWWWWB  ",
  " BWWWWWWWWWWWWWWWWB ",
  " BWWWWWWWWWWWWWWWWB ",
  " BWWWWWWWWWWWWWWWWB ",
  " BWWWWWWWWWWWWWWWWB ",
  " BWWWWWWWWWWWWWWWWB ",
  "  BWWWWWWWWWWWWWWB  ",
  "   BBBBBBBBBBBBBB   ",
  "       BWWWB        ",
  "        BBB         ",
  "         B          "
];

// Reusable SVG Pixel Renderer
const PixelSprite = ({ ascii, className, style }: { ascii: string[]; className?: string; style?: any }) => {
  const height = ascii.length;
  const width = Math.max(...ascii.map(r => r.length));
  
  const rects = [];
  for (let y = 0; y < height; y++) {
    const row = ascii[y] || "";
    for (let x = 0; x < width; x++) {
      const char = row[x];
      if (char && char !== " " && PALETTE[char]) {
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width="1.1" height="1.1" fill={PALETTE[char]} />);
      }
    }
  }

  return (
    <motion.svg className={className} style={style} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      {rects}
    </motion.svg>
  );
};

// --- Main Mascot Component ---

interface NovaMascotProps {
  mood: string;
  weather?: string | null;
  pointer: { x: number; y: number };
  progress: number;
  typingRate?: number;
  petColor?: string;
  accentColor?: string;
  onHover: () => void;
  onActivate: () => void;
}



const ASC_HEART = [
  " R R ",
  "RRRRR",
  " RRR ",
  "  R  "
];

export const NovaMascot = memo(function NovaMascot({ mood, weather, pointer, progress, typingRate = 0, petColor, accentColor, onHover, onActivate }: NovaMascotProps) {
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [pettingScore, setPettingScore] = useState(0);
  const [totalPets, setTotalPets] = useState(0);
  const [earRotate, setEarRotate] = useState(0);
  const lastPoint = useRef({ x: 0, y: 0, at: 0 });
  const [isPoked, setIsPoked] = useState(false);
  const pokeTimer = useRef<number | null>(null);
  const petTimer = useRef<number | null>(null);

  const [timeOfDay, setTimeOfDay] = useState("day");
  const [isStretched, setIsStretched] = useState(false);
  
  // Physics Springs for Drag Lag
  const lagX = useSpring(0, { stiffness: 150, damping: 15, mass: 1 });
  const lagY = useSpring(0, { stiffness: 150, damping: 15, mass: 1 });
  
  const secondaryLagX = useSpring(0, { stiffness: 100, damping: 12, mass: 0.8 });
  const secondaryLagY = useSpring(0, { stiffness: 100, damping: 12, mass: 0.8 });

  const bodyRotate = useTransform(() => {
    let angle = Math.atan2(lagX.get(), 54 + Math.max(0, lagY.get())) * (-180 / Math.PI);
    return Math.max(-15, Math.min(15, angle));
  });


  
  const tailRotate = useTransform(() => secondaryLagX.get() * 0.5);
  const earLag = useTransform(() => secondaryLagX.get() * 0.15);

  useEffect(() => {
    const handleResize = () => setIsStretched(window.innerHeight > 280);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  useEffect(() => {
    const updateTime = () => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 17) setTimeOfDay("day");
      else if (hour >= 17 && hour < 21) setTimeOfDay("evening");
      else setTimeOfDay("night");
    };
    updateTime();
    const interval = window.setInterval(updateTime, 60000);
    return () => window.clearInterval(interval);
  }, []);

  // Update ear rotation based on mouse
  useEffect(() => {
    if (pointer.x === 0 && pointer.y === 0) return;
    const dx = pointer.x - window.innerWidth / 2;
    const dy = pointer.y - window.innerHeight / 2;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    setEarRotate(Math.max(-25, Math.min(25, angle / 3)));
  }, [pointer]);

  // Overload / Mood Logic
  const isFurious = typingRate > 25;
  const isOverload = typingRate > 14 && !isFurious;
  let currentMood = mood;
  if (isFurious) currentMood = "furious";
  else if (isOverload) currentMood = "overload";
  else if (isPoked) currentMood = "poked";
  else if (pettingScore > 10) currentMood = "petting";
  else if (mood === "working" && typingRate > 0) currentMood = "typing";
  else if (mood === "happy" && typingRate === 0 && Math.abs(pointer.x - window.innerWidth/2) < 300) currentMood = "thinking";

  // Poke Handler
  const handlePoke = () => {
    setIsPoked(true);
    if (pokeTimer.current) window.clearTimeout(pokeTimer.current);
    pokeTimer.current = window.setTimeout(() => setIsPoked(false), 1000);
  };

  // Petting Handler
  // Petting Handler
  const handleHeadEnter = () => {
    setPettingScore(15);
    if (petTimer.current) window.clearTimeout(petTimer.current);
  };

  const handleHeadLeave = () => {
    setPettingScore(0);
  };

  let headY = 0;
  if (currentMood === "thinking" || currentMood === "working" || currentMood === "typing") headY = 2;
  else if (currentMood === "hunting") headY = 6;
  else if (currentMood === "poked" || currentMood === "levelup") headY = -5;
  else if (currentMood === "happy") headY = -3;
  else if (currentMood === "sleeping") headY = 15;

  let headRotate = 0;
  if (currentMood === "typing") headRotate = 5;
  else if (currentMood === "sleeping") headRotate = -15;

  let yBounceFull: number | number[] = 0;
  let scaleYFull: number | number[] = 1;
  if (currentMood === "scrolling") yBounceFull = [0, -10, 0];
  if (currentMood === "hunting") {
    yBounceFull = 10;
    scaleYFull = 0.85;
  }
  if (currentMood === "poked") yBounceFull = [0, -2, 4, -4, 2, 0];
  
  let yBounce: number | number[] = headY;
  if (currentMood === "excited") yBounce = [headY, headY + 8, headY - 15, headY];
  else if (currentMood === "celebration") yBounce = [headY, headY - 25, headY];
  else if (currentMood === "sleeping") yBounce = [headY, headY - 2, headY];
  else if (currentMood === "listening") yBounce = [headY, headY + 5, headY];
  else if (currentMood === "poked") yBounce = headY - 5;

  const bounceDuration = currentMood === "scrolling" ? 0.2 : (currentMood === "poked" ? 0.3 : (currentMood === "excited" ? 1.2 : (currentMood === "celebration" ? 0.8 : (currentMood === "listening" ? 0.6 : (timeOfDay === "night" ? 5 : 3.8)))));

  let earLeftRotate: number | number[] = 0;
  let earRightRotate: number | number[] = 0;
  if (currentMood === "listening") {
    earLeftRotate = -5;
    earRightRotate = 5;
  } else if (currentMood === "hunting") {
    earLeftRotate = -60;
    earRightRotate = 60;
  } else if (currentMood === "poked") {
    earLeftRotate = -45;
    earRightRotate = 45;
  } else if (currentMood === "petting") {
    earLeftRotate = [0, -5, 0];
    earRightRotate = [0, 5, 0];
  }

  let pawLeftY: number | number[] = 0;
  let pawRightY: number | number[] = 0;
  if (currentMood === "typing" || currentMood === "overload") {
    pawLeftY = [0, -4, 0];
    pawRightY = [0, -4, 0];
  } else if (currentMood === "levelup") {
    pawLeftY = -3;
    pawRightY = -3;
  }

  const pawTransitionLeft = (currentMood === "typing" || currentMood === "overload") 
    ? { duration: 0.15, repeat: Infinity } 
    : { type: "spring" as const };
    
  const pawTransitionRight = (currentMood === "typing" || currentMood === "overload") 
    ? { duration: 0.15, repeat: Infinity, delay: 0.075 } 
    : { type: "spring" as const };
  
  // Look tracking limits
  const eyeMult = currentMood === "hunting" ? 2.5 : 1;
  const eyeOffsetX = Math.max(-0.75, Math.min(0.75, ((pointer.x - window.innerWidth / 2) / 150) * eyeMult));
  const eyeOffsetY = Math.max(-0.5, Math.min(0.5, ((pointer.y - window.innerHeight / 2) / 150) * eyeMult));
  let eyeHeight = 1.5;
  if (currentMood === "sleeping" || currentMood === "petting") eyeHeight = 0.5;
  if (currentMood === "happy") eyeHeight = 1;
  if (currentMood === "poked") eyeHeight = 2.0;

  let heatTarget = Math.min(100, Math.max(0, ((typingRate - 5) / 10) * 100));
  if (currentMood === "furious" || currentMood === "overload") heatTarget = 100;

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      console.log(`[PET DEBUG] Rendered at x: ${rect.x}, y: ${rect.y}, w: ${rect.width}, h: ${rect.height}`);
    }
  });

  return (
    <div 
      ref={containerRef}
      style={{
        "--fox-color": heatTarget > 0 ? `color-mix(in srgb, #ff0000 ${heatTarget}%, ${petColor || "#ff8800"})` : (petColor || "#ff8800"),
        "--fox-shade": heatTarget > 0 ? `color-mix(in srgb, #cc0000 ${heatTarget}%, ${petColor || "#e66a00"})` : (petColor || "#e66a00"),
        "--accent-color": accentColor || "#00f3ff",
      } as React.CSSProperties}
    >
      <motion.div 
        className={`nova-pixel-coded mood-${currentMood} time-${timeOfDay} ${typingRate > 20 ? 'data-stream holo-symbols' : ''}`}
        style={{
          width: 180,
          height: 180,
          pointerEvents: "auto",
          cursor: dragging ? "grabbing" : "grab",
          touchAction: "none"
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(true);
          window.nova?.dragWindow.start(e.screenX, e.screenY);
          lastPoint.current = { x: e.screenX, y: e.screenY, at: performance.now() };
        }}
        onPointerMove={(e) => {
          if (dragging) {
            window.nova?.dragWindow.move(e.screenX, e.screenY);
            
            const dx = e.screenX - lastPoint.current.x;
            const dy = e.screenY - lastPoint.current.y;
            lagX.set(lagX.get() - dx * 0.8);
            lagY.set(lagY.get() - dy * 0.8);
            secondaryLagX.set(secondaryLagX.get() - dx * 0.6);
            secondaryLagY.set(secondaryLagY.get() - dy * 0.6);
            lastPoint.current = { x: e.screenX, y: e.screenY, at: performance.now() };
          }
        }}
        onPointerUp={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId);
          setDragging(false);
          window.nova?.dragWindow.end();
          lagX.set(0);
          lagY.set(0);
          secondaryLagX.set(0);
          secondaryLagY.set(0);
        }}
        onPointerCancel={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId);
          setDragging(false);
          window.nova?.dragWindow.end();
          lagX.set(0);
          lagY.set(0);
          secondaryLagX.set(0);
          secondaryLagY.set(0);
        }}
        onHoverStart={onHover}
        onDoubleClick={onActivate}
        whileTap={{ scaleX: 1.05, scaleY: 0.95 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="pixel-fox-wrapper"
          animate={{ y: yBounceFull, scaleY: scaleYFull }}
          transition={{ duration: bounceDuration, repeat: Array.isArray(yBounceFull) ? Infinity : 0, ease: "easeInOut" }}
        >
          <motion.div 
            className="pixel-body-chest" 
            style={{ rotate: bodyRotate, transformOrigin: 'top center' }}
          >
            <PixelSprite ascii={ASC_BODY_TOP} style={{ position: 'relative', zIndex: 10 }} />
            
            <motion.div className="pixel-body-mid">
              <PixelSprite ascii={ASC_BODY_MID} style={{ position: 'absolute', inset: 0, zIndex: 10 }} />
              
              <motion.div className="pixel-body-pelvis">
                <motion.div style={{ rotate: tailRotate, position: 'absolute', inset: 0, zIndex: -10 }}>
                  <PixelSprite ascii={ASC_TAIL} className="pixel-tail" />
                </motion.div>
                <motion.div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                  <PixelSprite ascii={ASC_BODY_BOT} className="pixel-body-bot-inner" />
                  <motion.div animate={{ y: pawLeftY }} transition={pawTransitionLeft} style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
                    <PixelSprite ascii={ASC_PAW} className="pixel-paw-left" />
                  </motion.div>
                  <motion.div animate={{ y: pawRightY }} transition={pawTransitionRight} style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
                    <PixelSprite ascii={ASC_PAW} className="pixel-paw-right" />
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
        
        <PixelSprite ascii={ASC_KEYBOARD} className="pixel-keyboard" />
          <motion.div 
            className="pixel-head-container"
            onMouseEnter={handleHeadEnter}
            onMouseLeave={handleHeadLeave}
            onClick={handlePoke}
            animate={{ y: yBounce, rotate: headRotate }}
            transition={{ duration: bounceDuration, repeat: Array.isArray(yBounce) ? Infinity : 0, ease: "easeInOut" }}
          >
          <div className="pixel-head-inner">
            <motion.div 
              className="pixel-ear-left-wrapper"
              animate={{ rotate: earLeftRotate }}
              style={{ x: earLag }}
              transition={currentMood === "petting" ? { repeat: Infinity, duration: 0.8, ease: "easeInOut" } : { type: "spring", stiffness: 200, damping: 15 }}
            >
              <PixelSprite ascii={ASC_EAR_L} className="pixel-ear" />
            </motion.div>

            <motion.div 
              className="pixel-ear-right-wrapper"
              animate={{ rotate: earRightRotate }}
              style={{ x: earLag }}
              transition={currentMood === "petting" ? { repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0.2 } : { type: "spring", stiffness: 200, damping: 15 }}
            >
            <PixelSprite ascii={ASC_EAR_R} className="pixel-ear" />
          </motion.div>

          <PixelSprite ascii={ASC_HEAD} className="pixel-head" />

          {/* Independent Floating Pupils */}
          <motion.svg className="pixel-eyes-overlay" viewBox="0 0 16 10" preserveAspectRatio="xMidYMid meet">
            <motion.rect 
              width="1.5" height={eyeHeight} fill="#1a1a1a" 
              animate={{ x: 3.75 + eyeOffsetX, y: 4.25 + eyeOffsetY + (1.5 - eyeHeight)/2 }} 
              transition={{ type: "tween", duration: 0.05 }}
            />
            <motion.rect 
              width="1.5" height={eyeHeight} fill="#1a1a1a" 
              animate={{ x: 10.75 + eyeOffsetX, y: 4.25 + eyeOffsetY + (1.5 - eyeHeight)/2 }} 
              transition={{ type: "tween", duration: 0.05 }}
            />
            </motion.svg>
            </div>
          </motion.div>

      {/* Extra Effects Elements */}
      {currentMood === "thinking" && (
        <div className="thinking-bubble-wrapper">
          <PixelSprite ascii={ASC_BUBBLE} className="thinking-bubble-sprite" />
          <div className="thinking-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        </div>
      )}
      {currentMood === "typing" && <div className="data-stream" />}
      {currentMood === "sleeping" && <div className="dream-bubbles" />}
      {currentMood === "poked" && <div className="sweat-drop" />}
      {currentMood === "celebration" && <div className="energy-burst" />}
      {currentMood === "listening" && (
        <div className="music-notes">
          <div className="note note-1">♫</div>
          <div className="note note-2">♪</div>
          <div className="note note-3">♬</div>
          <div className="note note-4">♩</div>
          <div className="note note-5">♪</div>
        </div>
      )}
        {currentMood === "petting" && (
          <div className="pet-love-container">
            <motion.div 
              animate={{ y: [0, -20], opacity: [0, 1, 0] }} 
              transition={{ duration: 2, repeat: Infinity }}
              style={{ position: 'absolute', top: -10, left: -15, width: 30, height: 24, filter: 'drop-shadow(0 0 5px #ff3366)' }}
            >
              <PixelSprite ascii={ASC_HEART} style={{ width: '100%', height: '100%' }} />
            </motion.div>
            <motion.div 
              animate={{ y: [0, -30], opacity: [0, 1, 0] }} 
              transition={{ duration: 2, delay: 1, repeat: Infinity }}
              style={{ position: 'absolute', top: -5, left: 20, width: 30, height: 24, transform: 'scale(0.8)', filter: 'drop-shadow(0 0 5px #ff3366)' }}
            >
              <PixelSprite ascii={ASC_HEART} style={{ width: '100%', height: '100%' }} />
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
});
