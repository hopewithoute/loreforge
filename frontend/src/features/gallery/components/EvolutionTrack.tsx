import { useRef, useEffect, useState, useCallback } from "react";
import { SiblingDeck } from "./SiblingDeck";
import type { Asset } from "@/features/generator/types";
import { cn } from "@/lib/utils";

interface EvolutionTrackProps {
  lineage: Asset[][];
}

export function EvolutionTrack({ lineage }: EvolutionTrackProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftRef = useRef(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showSlider, setShowSlider] = useState(false);

  // We use a custom scrollbar slider because horizontal scrolling on desktop
  // can be clunky. This function syncs the slider's percentage with the actual scroll position.
  const updateScrollState = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const isOverflowing = scrollWidth > clientWidth + 1;
    setShowSlider(isOverflowing);
    if (isOverflowing) {
      const maxScroll = scrollWidth - clientWidth;
      setScrollProgress(maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollWidth,
        behavior: "smooth",
      });
    }
    // Delay checks to let images load and layout settle
    const t1 = setTimeout(updateScrollState, 200);
    const t2 = setTimeout(updateScrollState, 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [lineage.length, updateScrollState]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);

    window.addEventListener("resize", updateScrollState);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!scrollRef.current) return;
    const pct = parseFloat(e.target.value);
    const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
    scrollRef.current.scrollLeft = (pct / 100) * maxScroll;
    setScrollProgress(pct);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDown.current = true;
    scrollRef.current.style.cursor = "grabbing";
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDown.current = false;
    if (scrollRef.current) scrollRef.current.style.cursor = "grab";
  };

  const handleMouseUp = () => {
    isDown.current = false;
    if (scrollRef.current) scrollRef.current.style.cursor = "grab";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  if (lineage.length === 0 || lineage[0].length === 0) return null;
  const rootAsset = lineage[0][0];

  return (
    <div className="relative flex w-full min-w-0 flex-col gap-5">
      {/* The thin dashed connecting line */}
      <div className="absolute top-42.5 left-0 z-0 hidden h-px w-full border-t border-dashed border-(--pencil-gray) md:block" />

      <div className="flex items-baseline justify-between border-b border-[rgba(28,28,26,0.1)] pb-2 text-[0.85rem] text-(--pencil-gray)">
        <span>Lineage // {rootAsset.prompt.substring(0, 30)}...</span>
        <span className="font-['Caveat',cursive] text-[1.4rem] text-(--red-pencil)">
          Gen {lineage.length}
        </span>
      </div>

      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        role="presentation"
        className={cn(
          "horizontal-scrollbar relative z-10 box-border flex cursor-grab snap-x snap-mandatory",
          "flex-row items-start gap-7.5 overflow-x-auto px-2.5 pt-2.5 pb-10 select-none md:pr-5 md:pl-2.5",
        )}
        style={{ maxWidth: "calc(100vw - 320px - 80px)" }}
      >
        {/* Render each step of the evolution horizontally.
            SiblingGroup is an array of variants (retries/regens) at that specific evolution step. */}
        {lineage.map((siblingGroup, i) => (
          <div
            key={siblingGroup[0].id}
            className="flex shrink-0 flex-row items-start gap-7.5"
          >
            {/* Sibling Deck (Solitaire style) */}
            <SiblingDeck siblings={siblingGroup} />

            {/* Evolution Arrow (between columns) */}
            {i < lineage.length - 1 && (
              <div className="mt-33.75 hidden shrink-0 bg-(--paper) px-1.25 text-[1.5rem] font-light text-(--pencil-gray) md:block">
                →
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Custom Slider — only visible when track overflows */}
      {showSlider && (
        <div className="-mt-6 flex w-full items-center justify-center px-10">
          <input
            type="range"
            aria-label="Scroll evolution track"
            min="0"
            max="100"
            value={scrollProgress}
            onChange={handleSliderChange}
            className={cn(
              "h-1.5 w-1/2 cursor-pointer appearance-none rounded-lg",
              "opacity-30 transition-opacity outline-none hover:opacity-60",
            )}
            style={{
              background: `linear-gradient(to right, var(--red-pencil) 0%, var(--red-pencil) ${scrollProgress}%, var(--pencil-gray) ${scrollProgress}%, var(--pencil-gray) 100%)`,
            }}
          />
        </div>
      )}
    </div>
  );
}
