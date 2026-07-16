import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LightboxState {
  isOpen: boolean;
  imageUrl: string | null;
  prompt: string | null;
}

interface LightboxContextType {
  openLightbox: (url: string, prompt: string) => void;
  closeLightbox: () => void;
}

const LightboxContext = createContext<LightboxContextType | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useLightbox() {
  const context = useContext(LightboxContext);
  if (!context) {
    throw new Error("useLightbox must be used within a LightboxProvider");
  }
  return context;
}

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

  return (
    <LightboxContext.Provider value={{ openLightbox, closeLightbox }}>
      {children}

      {/* Lightbox Overlay */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center p-5 md:p-10",
          "bg-paper/95 backdrop-blur-sm transition-opacity duration-300",
          state.isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={closeLightbox} // Click outside to close
      >
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div
          className={cn(
            "relative flex max-h-full max-w-5xl flex-col border-2 border-graphite bg-paper p-3",
            "shadow-[8px_8px_0px_rgba(28,28,26,0.1)] transition-transform duration-300",
            state.isOpen ? "translate-y-0 scale-100" : "translate-y-4 scale-95",
          )}
          onClick={(e) => e.stopPropagation()} // Prevent click inside from closing
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute -top-4 -right-4 z-10 flex h-8 w-8 items-center justify-center border-2 border-graphite bg-paper font-mono text-sm font-bold shadow-[2px_2px_0px_var(--graphite)] transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_var(--graphite)] active:translate-y-0 active:shadow-[0px_0px_0px_var(--graphite)]"
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
