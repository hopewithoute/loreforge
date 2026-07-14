/* Hallmark · genre: atmospheric · macrostructure: 03-marquee-hero · theme: lumen · nav: N5 · footer: Ft5 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

const SplashContent = ({ onEnter }: { onEnter: () => void }) => (
  <div className="relative z-10 grid grid-cols-[auto_1fr] items-center min-h-[100svh] px-8 md:px-16">
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
        className="btn group relative inline-flex items-center justify-center rounded-full bg-accent px-8 py-4 text-sm font-medium text-paper shadow-[0_0_40px_rgba(var(--color-accent),0.4)] hover:shadow-[0_0_60px_rgba(var(--color-accent),0.6)] hover:scale-105 transition-all duration-300 overflow-hidden"
      >
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:translate-x-[150%] transition-transform duration-[1.2s] ease-in-out" />
        <span className="relative z-10 flex items-center transform transition-transform duration-300 group-hover:-translate-x-2 pointer-events-none">
          Enter the Forge
          <ArrowRight className="w-4 h-4 ml-2 opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
        </span>
      </button>
    </div>
  </div>
);

export function App() {
  const [isEntered, setIsEntered] = useState(false);
  const [isSlashing, setIsSlashing] = useState(false);

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
        animate={{ opacity: isEntered ? 1 : (isSlashing ? 0.4 : 0), scale: isEntered ? 1 : 0.95 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
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
            <div className="absolute inset-0 bg-paper">
              <div className="absolute inset-0 bg-cover bg-center opacity-40 animate-[drift_20s_linear_infinite_alternate]" style={{ backgroundImage: "url('/bg.jpg')" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/80 to-transparent pointer-events-none" />
              <SplashContent onEnter={handleEnter} />
            </div>
          ) : (
            /* Slashed Splash (Two Halves) */
            <div className="absolute inset-0 pointer-events-none">
              
              {/* TOP RIGHT HALF */}
              <motion.div 
                className="absolute inset-0 bg-paper"
                style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}
                initial={{ x: 0, y: 0, filter: "blur(0px)", opacity: 1 }}
                animate={{ x: "5vw", y: "-5vh", filter: "blur(12px)", opacity: 0 }}
                transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1], delay: 0.1 }}
              >
                <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "url('/bg.jpg')" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/80 to-transparent" />
                <SplashContent onEnter={() => {}} />
              </motion.div>

              {/* BOTTOM LEFT HALF */}
              <motion.div 
                className="absolute inset-0 bg-paper"
                style={{ clipPath: "polygon(0 0, 100% 100%, 0 100%)" }}
                initial={{ x: 0, y: 0, filter: "blur(0px)", opacity: 1 }}
                animate={{ x: "-5vw", y: "5vh", filter: "blur(12px)", opacity: 0 }}
                transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1], delay: 0.1 }}
              >
                <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "url('/bg.jpg')" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/80 to-transparent" />
                <SplashContent onEnter={() => {}} />
              </motion.div>

              {/* THE BLADE SVG */}
              <svg className="absolute inset-0 w-full h-full z-50 overflow-visible">
                <motion.line 
                  x1="0" y1="0" x2="100%" y2="100%"
                  stroke="#ffffff"
                  strokeWidth="6"
                  initial={{ pathLength: 0, opacity: 1, filter: "drop-shadow(0 0 10px #ffbb00) drop-shadow(0 0 30px #ff7700)" }}
                  animate={{ pathLength: [0, 1, 1], opacity: [1, 1, 0] }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Global Nav (Appears after entering) */}
      <AnimatePresence>
        {isEntered && (
          <motion.nav 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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
