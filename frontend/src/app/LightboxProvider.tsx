import { useState, useEffect, useMemo } from "react";
import type { ReactNode, KeyboardEvent as ReactKeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { LightboxContext, type LightboxState } from "./LightboxContext";

export function LightboxProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LightboxState>({
    isOpen: false,
    imageUrl: null,
    prompt: null,
  });

  const openLightbox = (url: string, prompt: string) => {
    setState({ isOpen: true, imageUrl: url, prompt });
  };

  const closeLightbox = () => {
    setState((prev) => ({ ...prev, isOpen: false }));
    // Wait for fade out animation before clearing image to prevent flickering
    setTimeout(() => {
      setState({ isOpen: false, imageUrl: null, prompt: null });
    }, 300);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state.isOpen) {
        closeLightbox();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isOpen]);

  // Prevent background scrolling when open
  useEffect(() => {
    if (state.isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [state.isOpen]);

  const contextValue = useMemo(() => ({ openLightbox, closeLightbox }), []);

  return (
    <LightboxContext.Provider value={contextValue}>
      {children}

      {/* Lightbox Overlay */}
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e: ReactKeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            closeLightbox();
          }
        }}
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center p-5 md:p-10",
          "bg-paper/95 backdrop-blur-sm transition-opacity duration-300",
          state.isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={closeLightbox} // Click outside to close
      >
        <div
          role="presentation"
          className={cn(
            "relative flex max-h-full max-w-5xl flex-col rounded-xl border border-[rgba(15,23,42,0.1)] bg-paper p-3 shadow-2xl",
            "transition-transform duration-300",
            state.isOpen ? "translate-y-0 scale-100" : "translate-y-4 scale-95",
          )}
          onClick={(e) => e.stopPropagation()} // Prevent click inside from closing
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute -top-4 -right-4 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[rgba(15,23,42,0.1)] bg-paper font-mono text-sm font-bold shadow-md transition-transform hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-sm"
            title="Close (Esc)"
          >
            X
          </button>

          {/* Image */}
          {state.imageUrl && (
            <div className="relative min-h-75 w-full flex-1 overflow-hidden border border-[rgba(28,28,26,0.1)] bg-[rgba(28,28,26,0.03)]">
              <img
                src={state.imageUrl}
                alt={state.prompt || "Enlarged view"}
                className="h-full max-h-[75vh] w-full object-contain"
              />
            </div>
          )}

          {/* Metadata / Prompt */}
          {state.prompt && (
            <div className="mt-4 border-t border-[rgba(28,28,26,0.1)] pt-3">
              <p className="font-mono text-xs leading-relaxed text-pencil-gray md:text-sm">
                <span className="font-bold text-graphite">PROMPT //</span> {state.prompt}
              </p>
            </div>
          )}
        </div>
      </div>
    </LightboxContext.Provider>
  );
}
