import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MESSAGES = [
  "Forging ancient silhouettes...",
  "Rendering atmospheric lighting...",
  "Synthesizing arcane structures...",
  "Sharpening edges in the dark...",
  "Extracting details from the void...",
  "Finalizing concept art..."
];

export function LoadingRotator() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((current) => (current + 1) % MESSAGES.length);
    }, 3000); // Rotate every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full py-12 px-6">
      {/* Cool technical spinner */}
      <div className="relative w-16 h-16 mb-8">
        <div className="absolute inset-0 rounded-full border-t-2 border-accent animate-spin" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-2 rounded-full border-r-2 border-accent/50 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
        <div className="absolute inset-4 rounded-full border-b-2 border-accent/20 animate-spin" style={{ animationDuration: '1.5s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1 h-1 bg-accent rounded-full animate-pulse" />
        </div>
      </div>

      <div className="h-8 relative w-full overflow-hidden flex justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: -20, opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="text-ink-2 font-mono text-sm tracking-wider absolute text-center"
          >
            {MESSAGES[index]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
