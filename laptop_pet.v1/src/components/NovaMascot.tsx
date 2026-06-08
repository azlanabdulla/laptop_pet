import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState, memo } from "react";

const PALETTE: Record<string, string> = {
  O: "var(--fox-color, #ff8800)", // Bright Orange
  D: "var(--fox-shade, #e66a00)", // Dark Orange (Shading)
  W: "#ffffff", // White
  B: "#1a1a1a", // Deep Black (Outline)
  E: "#0f0f0f", // Eye Black
  P: "#ff99aa", // Pink (Inner ear)
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



const ASC_BODY = [
  "   BBBBBBBB   ",
  "  BDOOOOOODB  ",
  " BDOOOWWOOODB ",
  " BOOOWWWWOOOB ",
  " BOOOWWWWOOOB ",
  " BOOOWWWWOOOB ",
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

// Reusable SVG Pixel Renderer
const PixelSprite = ({ ascii, className }: { ascii: string[]; className?: string }) => {
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
    <svg className={className} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      {rects}
    </svg>
  );
};

// --- Main Mascot Component ---

interface NovaMascotProps {
  mood: string;
  weather?: string | null;
  pointer: { x: number; y: number };
  progress: number;
  typingRate?: number;
  onHover: () => void;
  onActivate: () => void;
}

export const NovaMascot = memo(function NovaMascot({ mood, weather, pointer, progress, typingRate = 0, onHover, onActivate }: NovaMascotProps) {
  const [dragging, setDragging] = useState(false);
  const [pettingScore, setPettingScore] = useState(0);
  const [totalPets, setTotalPets] = useState(0);
  const [earRotate, setEarRotate] = useState(0);
  const lastPoint = useRef({ x: 0, y: 0, at: 0 });
  const [isPoked, setIsPoked] = useState(false);
  const pokeTimer = useRef<number | null>(null);
  const petTimer = useRef<number | null>(null);

  const [timeOfDay, setTimeOfDay] = useState("day");
  const [isStretched, setIsStretched] = useState(false);
  
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
  else if (mood === "happy" && typingRate === 0 && Math.abs(pointer.x - window.innerWidth/2) < 50) currentMood = "thinking";

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

  // Bounce animations
  let yBounce: number | number[] = 0;
  if (currentMood === "excited") yBounce = [0, 8, -15, 0];
  else if (currentMood === "celebration") yBounce = [0, -25, 0];
  else if (currentMood === "sleeping") yBounce = [0, -2, 0];
  else if (currentMood === "listening") yBounce = [0, 5, 0];
  else if (currentMood === "stretching") yBounce = 0; // Handled by CSS

  const bounceDuration = currentMood === "excited" ? 1.2 : (currentMood === "celebration" ? 0.8 : (currentMood === "listening" ? 0.6 : (currentMood === "stretching" ? 2.0 : (timeOfDay === "night" ? 5 : 3.8))));
  
  // Look tracking limits
  const eyeOffsetX = Math.max(-0.75, Math.min(0.75, (pointer.x - window.innerWidth / 2) / 150));
  const eyeOffsetY = Math.max(-0.75, Math.min(0.75, (pointer.y - window.innerHeight / 2) / 150));
  let eyeHeight = 1.5;
  if (currentMood === "sleeping" || currentMood === "petting") eyeHeight = 0.5;
  if (currentMood === "happy") eyeHeight = 1;
  if (currentMood === "poked") eyeHeight = 2.0;

  let heatTarget = Math.min(100, Math.max(0, ((typingRate - 5) / 10) * 100));
  if (currentMood === "furious" || currentMood === "overload") heatTarget = 100;
  return (
    <motion.div 
      className={`nova-pixel-coded mood-${currentMood} time-${timeOfDay} ${typingRate > 20 ? 'data-stream holo-symbols' : ''}`}
      drag
      dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
      dragElastic={0}
      dragMomentum={false}
      onDragStart={(e: any) => {
        setDragging(true);
        window.nova?.dragWindow.start(e.screenX, e.screenY);
      }}
      onDrag={(e: any) => {
        window.nova?.dragWindow.move(e.screenX, e.screenY);
      }}
      onDragEnd={() => {
        setDragging(false);
        window.nova?.dragWindow.end();
      }}
      onHoverStart={onHover}
      onDoubleClick={onActivate}
      whileTap={{ scaleX: 1.05, scaleY: 0.95 }}
      animate={{
        "--fox-color": `color-mix(in srgb, #ff0000 ${heatTarget}%, #ff8800)`,
        "--fox-shade": `color-mix(in srgb, #cc0000 ${heatTarget}%, #e66a00)`
      } as any}
      transition={{ duration: 0.5 }}
    >
      <div className="pixel-fox-wrapper">
        <div className="pixel-lower-body">
          <PixelSprite ascii={ASC_TAIL} className="pixel-tail" />
          <PixelSprite ascii={ASC_BODY} className="pixel-body" />
          <PixelSprite ascii={ASC_PAW} className="pixel-paw-left" />
          <PixelSprite ascii={ASC_PAW} className="pixel-paw-right" />
          <PixelSprite ascii={ASC_KEYBOARD} className="pixel-keyboard" />
        </div>
        
        <motion.div 
          className="pixel-head-container"
          onMouseEnter={handleHeadEnter}
          onMouseLeave={handleHeadLeave}
          onClick={handlePoke}
          animate={{ y: yBounce }}
          transition={{ duration: bounceDuration, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="pixel-head-inner">
            <motion.div 
              className="pixel-ear-left-wrapper"
              animate={{ rotate: currentMood === "petting" ? [0, -5, 0] : 0 }}
              transition={currentMood === "petting" ? { repeat: Infinity, duration: 0.8, ease: "easeInOut" } : { type: "spring", stiffness: 200, damping: 15 }}
            >
              <PixelSprite ascii={ASC_EAR_L} className="pixel-ear" />
            </motion.div>

            <motion.div 
              className="pixel-ear-right-wrapper"
              animate={{ rotate: currentMood === "petting" ? [0, 5, 0] : 0 }}
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
        
        {currentMood === "thinking" && <div className="thinking-mark">?</div>}
      </div>

      {/* Extra Effects Elements */}
      {currentMood === "thinking" && <div className="holo-symbols" />}
      {currentMood === "typing" && <div className="data-stream" />}
      {currentMood === "sleeping" && <div className="dream-bubbles" />}
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
          <div className="love-hearts" />
        </div>
      )}
      
    </motion.div>
  );
});
