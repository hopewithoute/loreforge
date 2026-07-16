import { useState } from "react";
import { CanvasCard } from "./CanvasCard";
import { cn } from "@/lib/utils";
import type { Asset } from "@/features/generator/types";

interface SiblingDeckProps {
  siblings: Asset[];
}

export function SiblingDeck({ siblings }: SiblingDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (siblings.length === 0) return null;

  // A SiblingDeck receives an array of assets that share the same "parent".
  // This usually happens when a user clicks "Regenerate" on an existing asset.
  // We stack them like a deck of cards and allow the user to paginate through them.

  // Ensure index is valid in case siblings array shrinks (shouldn't happen, but safe)
  const safeIndex = Math.min(currentIndex, siblings.length - 1);
  const currentAsset = siblings[safeIndex];
  const hasMultiple = siblings.length > 1;

  const goNext = () => setCurrentIndex((i) => (i + 1) % siblings.length);
  const goPrev = () =>
    setCurrentIndex((i) => (i - 1 + siblings.length) % siblings.length);

  return (
    <div className="relative flex flex-col gap-3">
      {/* Visual Deck Stack Effect (background papers) */}
      {hasMultiple && (
        <>
          <div
            className={cn(
              "pointer-events-none absolute top-2 left-2 z-0 h-[calc(100%-2.5rem)] w-full",
              "border border-(--graphite) bg-(--paper) opacity-60 transition-transform",
            )}
            style={{ transform: "rotate(3deg)" }}
          />
          <div
            className={cn(
              "pointer-events-none absolute top-1 left-1 z-0 h-[calc(100%-2.5rem)] w-full",
              "border border-(--graphite) bg-[#f0eee9] opacity-80 transition-transform",
            )}
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
        <div
          className={cn(
            "z-10 mt-1 flex flex-row items-center justify-between border border-(--graphite) bg-(--paper) px-2 py-1",
            "font-mono text-xs text-(--pencil-gray) drop-shadow-[2px_2px_0_rgba(28,28,26,0.1)]",
          )}
        >
          <button
            type="button"
            onClick={goNext}
            className="cursor-pointer px-2 py-1 font-bold transition-colors hover:text-(--red-pencil)"
          >
            &larr; OLDER
          </button>

          <span className="tracking-widest">
            {safeIndex + 1} / {siblings.length}
          </span>

          <button
            type="button"
            onClick={goPrev}
            className="cursor-pointer px-2 py-1 font-bold transition-colors hover:text-(--red-pencil)"
          >
            NEWER &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
