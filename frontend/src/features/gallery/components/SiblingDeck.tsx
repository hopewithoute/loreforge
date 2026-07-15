import { useState } from "react";
import { CanvasCard } from "./CanvasCard";
import type { Asset } from "../../generator/types";

interface SiblingDeckProps {
  siblings: Asset[];
}

export function SiblingDeck({ siblings }: SiblingDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (siblings.length === 0) return null;

  // Ensure index is valid in case siblings array shrinks (shouldn't happen, but safe)
  const safeIndex = Math.min(currentIndex, siblings.length - 1);
  const currentAsset = siblings[safeIndex];
  const hasMultiple = siblings.length > 1;

  const goNext = () => setCurrentIndex((i) => (i + 1) % siblings.length);
  const goPrev = () => setCurrentIndex((i) => (i - 1 + siblings.length) % siblings.length);

  return (
    <div className="relative flex flex-col gap-3">
      {/* Visual Deck Stack Effect (background papers) */}
      {hasMultiple && (
        <>
          <div 
            className="absolute top-2 left-2 w-full h-[calc(100%-2.5rem)] bg-[var(--paper)] border border-[var(--graphite)] opacity-60 z-0 pointer-events-none transition-transform" 
            style={{ transform: "rotate(3deg)" }} 
          />
          <div 
            className="absolute top-1 left-1 w-full h-[calc(100%-2.5rem)] bg-[#f0eee9] border border-[var(--graphite)] opacity-80 z-0 pointer-events-none transition-transform" 
            style={{ transform: "rotate(-1.5deg)" }} 
          />
        </>
      )}

      {/* Main Card */}
      <div className="relative z-10 transition-transform duration-300">
        <CanvasCard asset={currentAsset} />
      </div>

      {/* Pagination Controls */}
      {hasMultiple && (
        <div className="flex flex-row items-center justify-between px-2 text-[var(--pencil-gray)] font-mono text-xs z-10 bg-[var(--paper)] border border-[var(--graphite)] py-1 mt-1 drop-shadow-[2px_2px_0_rgba(28,28,26,0.1)]">
          <button 
            type="button"
            onClick={goNext} 
            className="hover:text-[var(--red-pencil)] px-2 py-1 cursor-pointer font-bold transition-colors"
          >
            &larr; OLDER
          </button>
          
          <span className="tracking-widest">
            {safeIndex + 1} / {siblings.length}
          </span>
          
          <button 
            type="button"
            onClick={goPrev} 
            className="hover:text-[var(--red-pencil)] px-2 py-1 cursor-pointer font-bold transition-colors"
          >
            NEWER &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
