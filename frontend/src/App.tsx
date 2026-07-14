/* Hallmark · genre: atmospheric · macrostructure: 03-marquee-hero · theme: lumen · nav: N5 · footer: Ft5 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

// The shared background for the splash screen (Spotlight Flashlight + Grain + Grid)
const SplashBackground = ({ mousePos }: { mousePos: { x: string, y: string } }) => (
  <div className="absolute inset-0 z-0 overflow-hidden bg-paper">
    {/* SVG Grain Definition (E7) */}
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
      </filter>
    </svg>
    {/* Base Grain Overlay */}
    <div 
      className="absolute inset-0 pointer-events-none opacity-[0.25] mix-blend-overlay"
      style={{ filter: "url(#grain)" }}
    />

    {/* The Hidden Technical Grid (Revealed by Cursor Mask) */}
    <div 
      className="absolute inset-0 pointer-events-none transition-[mask-image,-webkit-mask-image] duration-300 ease-out"
      style={{
        backgroundImage: `
          linear-gradient(to right, color-mix(in oklch, var(--color-ink) 10%, transparent) 1px, transparent 1px),
          linear-gradient(to bottom, color-mix(in oklch, var(--color-ink) 10%, transparent) 1px, transparent 1px),
          linear-gradient(to right, color-mix(in oklch, var(--color-ink) 3%, transparent) 1px, transparent 1px),
          linear-gradient(to bottom, color-mix(in oklch, var(--color-ink) 3%, transparent) 1px, transparent 1px)
        `,
        backgroundSize: "4rem 4rem, 4rem 4rem, 1rem 1rem, 1rem 1rem",
        backgroundPosition: "center center",
        WebkitMaskImage: `radial-gradient(500px circle at ${mousePos.x} ${mousePos.y}, black 15%, transparent 70%)`,
        maskImage: `radial-gradient(500px circle at ${mousePos.x} ${mousePos.y}, black 15%, transparent 70%)`
      }}
    />

    {/* Amber Torchlight Tint */}
    <div 
      className="absolute inset-0 pointer-events-none transition-[background] duration-300 ease-out mix-blend-color"
      style={{
        background: `radial-gradient(500px circle at ${mousePos.x} ${mousePos.y}, color-mix(in oklch, var(--color-accent) 40%, transparent), transparent 70%)`
      }}
    />
  </div>
);

const SplashContent = ({ onEnter, onPointerMove }: { onEnter: () => void, onPointerMove: (e: React.PointerEvent) => void }) => (
  <div 
    className="relative z-10 grid grid-cols-[auto_1fr] items-center min-h-[100svh] px-8 md:px-16"
    onPointerMove={onPointerMove}
  >
    {/* HP1 Vertical Rail */}
    <p className="hidden md:block text-ink-2 font-mono text-xs tracking-[0.2em] [writing-mode:vertical-rl] rotate-180 opacity-60 self-stretch flex-shrink-0">
      LORE FORGE · STUDIO · V1
    </p>

    <div className="max-w-5xl mx-auto text-center w-full">
      <h1 className="font-sans text-[clamp(3rem,8vw,8rem)] leading-[0.9] tracking-tighter text-ink mb-6 drop-shadow-2xl">
        Worlds built in the <span className="text-accent">dark.</span>
      </h1>
      <p className="font-sans text-ink-2 text-[clamp(1.125rem,2vw,1.5rem)] max-w-2xl mx-auto mb-12 font-light drop-shadow-lg">
        Generate, refine, and evolve game concepts in real time. 
        The forge is lit. The output is yours.
      </p>
      <button 
        onClick={onEnter}
        className="btn group relative inline-flex items-center justify-center rounded-xl bg-white/5 border border-white/10 backdrop-blur-md px-10 py-5 text-sm font-medium text-ink shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] hover:bg-white/10 hover:border-accent/50 hover:text-accent hover:shadow-[0_0_40px_rgba(var(--color-accent),0.3)] hover:scale-[1.02] transition-all duration-500 overflow-hidden"
      >
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-accent/20 to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:translate-x-[150%] transition-transform duration-[1.5s] ease-in-out" />
        <span className="relative z-10 flex items-center tracking-wide transform transition-transform duration-300 group-hover:-translate-x-2 pointer-events-none">
          Enter the Forge
          <ArrowRight className="w-4 h-4 ml-3 opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
        </span>
      </button>
    </div>
  </div>
);

export function App() {
  const [isEntered, setIsEntered] = useState(false);
  const [isSlashing, setIsSlashing] = useState(false);
  const [mousePos, setMousePos] = useState({ x: "50%", y: "30%" });

  const handlePointerMove = (e: React.PointerEvent) => {
    setMousePos({ x: `${e.clientX}px`, y: `${e.clientY}px` });
  };

  const handleEnter = () => {
    setIsSlashing(true);
    // Switch to studio after slash finishes
    setTimeout(() => {
      setIsEntered(true);
    }, 1200);
  };

  return (
    <div className="relative min-h-screen bg-paper text-ink selection:bg-accent/20 overflow-hidden">
      
      {/* THE STUDIO (always rendered under the splash, visible when splash leaves) */}
      <motion.main 
        key="studio"
        className="fixed inset-0 z-0 overflow-y-auto pt-32 pb-24 px-6 lg:px-12 flex flex-col"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: isSlashing || isEntered ? 1 : 0, scale: isSlashing || isEntered ? 1 : 0.95 }}
        transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1], delay: 0.15 }}
        style={{ pointerEvents: isEntered ? "auto" : "none" }}
      >
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 flex-grow">
          {/* Generator Form Column */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-paper-2/80 backdrop-blur-xl rounded-2xl p-6 border border-ink-3/20 shadow-2xl">
              <h2 className="font-serif text-2xl mb-2 text-ink">Generator</h2>
              <p className="text-ink-2 text-sm mb-8">Set your parameters and forge a new concept.</p>
              
              <div className="space-y-4">
                <div className="h-12 bg-paper rounded-lg animate-pulse opacity-50" />
                <div className="h-12 bg-paper rounded-lg animate-pulse opacity-50" />
                <div className="h-32 bg-paper rounded-lg animate-pulse opacity-50" />
                <div className="h-12 bg-accent/20 border border-accent/30 rounded-lg animate-pulse mt-4" />
              </div>
            </div>
          </div>

          {/* Gallery Column */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl text-ink">The Vault</h2>
              <span className="text-sm font-mono text-ink-3">Persisted locally</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="aspect-square bg-paper-2/60 backdrop-blur-md rounded-2xl border border-ink-3/10 shadow-lg animate-pulse" />
               <div className="aspect-square bg-paper-2/60 backdrop-blur-md rounded-2xl border border-ink-3/10 shadow-lg animate-pulse" />
            </div>
          </div>
        </div>
        
        <footer className="mt-auto pt-16 text-center">
          <p className="font-serif text-xl italic text-ink-3">
            Creation ends when the screen turns off.
          </p>
        </footer>
      </motion.main>

      {/* THE SPLASH SCREEN (z-10, blocks the Studio until slashed) */}
      {!isEntered && (
        <div className="absolute inset-0 z-10 overflow-hidden">
          {!isSlashing ? (
            /* Normal Interactive Splash */
            <div className="absolute inset-0">
              <SplashBackground mousePos={mousePos} />
              <SplashContent onEnter={handleEnter} onPointerMove={handlePointerMove} />
            </div>
          ) : (
            /* Blast Doors Splash (Top & Bottom Halves) */
            <div className="absolute inset-0 pointer-events-none">
              
              {/* TOP HALF */}
              <motion.div 
                className="absolute inset-0 bg-paper"
                style={{ clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)" }}
                initial={{ y: 0, filter: "blur(0px)", opacity: 1 }}
                animate={{ y: "-10vh", filter: "blur(8px)", opacity: 0 }}
                transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1], delay: 0.15 }}
              >
                <SplashBackground mousePos={mousePos} />
                <SplashContent onEnter={() => {}} onPointerMove={() => {}} />
              </motion.div>

              {/* BOTTOM HALF */}
              <motion.div 
                className="absolute inset-0 bg-paper"
                style={{ clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)" }}
                initial={{ y: 0, filter: "blur(0px)", opacity: 1 }}
                animate={{ y: "10vh", filter: "blur(8px)", opacity: 0 }}
                transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1], delay: 0.15 }}
              >
                <SplashBackground mousePos={mousePos} />
                <SplashContent onEnter={() => {}} onPointerMove={() => {}} />
              </motion.div>

              {/* THE HORIZONTAL LASER / SEAM */}
              <div className="absolute inset-0 w-full h-full z-50 flex items-center justify-center overflow-visible">
                <motion.div 
                  className="w-full h-[2px] bg-white origin-center"
                  initial={{ scaleX: 0, opacity: 1, filter: "drop-shadow(0 0 10px #ffbb00) drop-shadow(0 0 30px #ff7700)" }}
                  animate={{ scaleX: [0, 1, 1], opacity: [1, 1, 0], scaleY: [1, 1, 8] }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Global Nav (Appears as doors open) */}
      <AnimatePresence>
        {(isSlashing || isEntered) && (
          <motion.nav 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 rounded-full bg-paper/60 backdrop-blur-md px-6 py-3 border border-ink-3/20 shadow-lg"
          >
            <span className="font-serif italic text-lg tracking-wide text-accent">LoreForge</span>
            <div className="h-4 w-px bg-ink-3/30" />
            <span className="text-sm font-sans text-ink-2">Studio</span>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
