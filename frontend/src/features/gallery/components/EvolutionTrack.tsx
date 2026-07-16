import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { SiblingDeck } from "./SiblingDeck";
import type { EvolutionNode } from "./GalleryBoard";
import { cn } from "@/lib/utils";

/**
 * Recursively checks if any asset in this entire lineage track is currently generating.
 * If true, we trigger a "lockdown" (disabling delete buttons) across the whole track
 * to prevent breaking the tree while an evolution is processing.
 */
function isNodePending(node: EvolutionNode): boolean {
  return (
    node.siblings.some((s) => s.status === "pending") || node.children.some(isNodePending)
  );
}

/**
 * Renders a single branch of the evolution tree.
 * Uses a recursive layout approach:
 * 1. Renders the current group of siblings (a stack of cards).
 * 2. Draws SVG-like connecting dashed lines to its children.
 * 3. Recursively calls itself to render the children.
 */
function TreeNodeUI({
  node,
  isTrackPending,
}: {
  node: EvolutionNode;
  isTrackPending: boolean;
}) {
  return (
    <div className="flex w-max shrink-0 flex-row items-start gap-12">
      <div className="relative shrink-0">
        <SiblingDeck siblings={node.siblings} isTrackPending={isTrackPending} />
        {/* Horizontal line extending right from parent */}
        {node.children.length > 0 && (
          <div className="absolute top-35 -right-6 -z-10 w-6 border-t-2 border-dashed border-(--pencil-gray) opacity-60" />
        )}
      </div>

      {node.children.length > 0 && (
        <div className="relative flex flex-col">
          {node.children.map((child, index) => (
            <div key={child.groupId} className="relative flex items-start pb-10">
              {/* Horizontal line connecting to this child */}
              <div className="absolute top-35 -left-6 -z-10 w-6 border-t-2 border-dashed border-(--pencil-gray) opacity-60" />

              {/* Vertical line connecting to siblings */}
              {node.children.length > 1 && (
                <div
                  className="absolute -left-6 -z-10 w-px border-l-2 border-dashed border-(--pencil-gray) opacity-60"
                  style={{
                    top: index === 0 ? "140px" : 0,
                    bottom: index === node.children.length - 1 ? "calc(100% - 140px)" : 0,
                  }}
                />
              )}

              <TreeNodeUI node={child} isTrackPending={isTrackPending} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface EvolutionTrackProps {
  tree: EvolutionNode;
}

export function EvolutionTrack({ tree }: EvolutionTrackProps) {
  // References for drag-to-scroll functionality
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftRef = useRef(0);

  // Custom slider state
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

  const nodeCount = useMemo(() => {
    function count(node: EvolutionNode): number {
      return (
        node.siblings.length + node.children.reduce((sum, child) => sum + count(child), 0)
      );
    }
    return count(tree);
  }, [tree]);

  const prevNodeCount = useRef(nodeCount);
  const isTrackPending = useMemo(() => isNodePending(tree), [tree]);

  // Automatically scroll to the far right whenever a new asset is added
  // so the user immediately sees their newly generated/evolved image.
  useEffect(() => {
    if (scrollRef.current && nodeCount > prevNodeCount.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollWidth,
        behavior: "smooth",
      });
    }
    prevNodeCount.current = nodeCount;

    // Delay checks to let images load and layout settle
    const t1 = setTimeout(updateScrollState, 200);
    const t2 = setTimeout(updateScrollState, 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [tree, nodeCount, updateScrollState]);

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

  if (!tree || tree.siblings.length === 0) return null;
  const rootAsset = tree.siblings[0];

  return (
    <div className="relative flex w-full min-w-0 flex-col gap-5">
      <div className="flex items-baseline justify-between border-b border-[rgba(28,28,26,0.1)] pb-2 text-[0.85rem] text-(--pencil-gray)">
        <span>Lineage // {rootAsset.prompt.substring(0, 30)}...</span>
        <span className="font-['Caveat',cursive] text-[1.4rem] text-(--blueprint) capitalize">
          {rootAsset.category} • {rootAsset.style.replace(/_/g, " ")}
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
          "horizontal-scrollbar relative z-10 box-border flex w-full cursor-grab",
          "flex-row items-start overflow-x-auto px-4 pt-5 pb-10 select-none",
        )}
      >
        <TreeNodeUI node={tree} isTrackPending={isTrackPending} />
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
