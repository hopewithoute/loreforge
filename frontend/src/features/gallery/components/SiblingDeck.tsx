import { useState } from "react";
import { CanvasCard } from "./CanvasCard";
import { cn } from "@/lib/utils";
import type { Asset } from "@/features/generator/types";

interface SiblingDeckProps {
  siblings: Asset[];
  isTrackPending?: boolean;
}

export function SiblingDeck({ siblings, isTrackPending }: SiblingDeckProps) {
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
              "pointer-events-none absolute top-0 left-0 z-0 h-[calc(100%-2.5rem)] w-full",
              "rounded-xl border border-[rgba(15,23,42,0.1)] bg-(--paper) opacity-60 transition-transform",
            )}
            style={{ transform: "translate(8px, 8px)" }}
          />
          <div
            className={cn(
              "pointer-events-none absolute top-0 left-0 z-0 h-[calc(100%-2.5rem)] w-full",
              "rounded-xl border border-[rgba(15,23,42,0.1)] bg-[#f8fafc] opacity-80 transition-transform",
            )}
            style={{ transform: "translate(4px, 4px)" }}
          />
        </>
      )}

      {/* Main Card */}
      <div className="relative z-10 transition-transform duration-300">
        <CanvasCard asset={currentAsset} isTrackPending={isTrackPending} />
      </div>

      {/* Pagination Controls */}
      {hasMultiple && (
        <div
          className={cn(
            "z-10 mt-1 flex flex-row items-center justify-between rounded-md border border-[rgba(15,23,42,0.1)] bg-(--paper) px-2 py-1",
            "font-mono text-xs font-bold text-(--pencil-gray) shadow-sm",
          )}
        >
          <button
            type="button"
            onClick={goNext}
            className="cursor-pointer px-2 py-1 transition-colors hover:text-(--blueprint)"
          >
            &larr; OLDER
          </button>

          <span className="tracking-widest">
            {safeIndex + 1} / {siblings.length}
          </span>

          <button
            type="button"
            onClick={goPrev}
            className="cursor-pointer px-2 py-1 transition-colors hover:text-(--blueprint)"
          >
            NEWER &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
