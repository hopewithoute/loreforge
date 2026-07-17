import { createContext, useContext } from "react";

export interface LightboxState {
  isOpen: boolean;
  imageUrl: string | null;
  prompt: string | null;
}

export interface LightboxContextType {
  openLightbox: (url: string, prompt: string) => void;
  closeLightbox: () => void;
}

export const LightboxContext = createContext<LightboxContextType | null>(null);

export function useLightbox() {
  const context = useContext(LightboxContext);
  if (!context) {
    throw new Error("useLightbox must be used within a LightboxProvider");
  }
  return context;
}
