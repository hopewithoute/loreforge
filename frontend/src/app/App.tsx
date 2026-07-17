import { GeneratorPanel } from "@/features/generator/components/GeneratorPanel";
import { GalleryBoard } from "@/features/gallery/components/GalleryBoard";
import { LightboxProvider } from "@/app/LightboxProvider";
import { ConfirmProvider } from "@/app/ConfirmProvider";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Logo } from "@/components/Logo";
import {
  CATEGORY_OPTIONS,
  STYLE_OPTIONS,
  type GeneratorFormValues,
} from "@/features/generator/types";

export function App() {
  // 1. Initialize global form state.
  // We use useForm at the root so that both the Left Panel (Generator)
  // and Right Panel (Gallery) can share form data without deep prop drilling.
  const methods = useForm<GeneratorFormValues>({
    defaultValues: {
      prompt: "",
      category: CATEGORY_OPTIONS[0].value,
      style: STYLE_OPTIONS[0].value,
      existing_reference_id: "",
      sibling_id: "",
      previewUrl: null,
      fileName: null,
      evolveTarget: null,
      isLockedMode: false,
    },
  });

  const [hasEntered, setHasEntered] = useState(false);

  return (
    <>
      {/* LANDING HERO OVERLAY (Full Screen Hexagon Dive) */}
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center transition-all duration-1000 ease-[cubic-bezier(0.25,0.8,0.25,1)]",
          hasEntered ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        <div
          className={cn(
            "relative flex max-w-150 flex-col items-center justify-center text-center transition-transform duration-1000 ease-[cubic-bezier(0.25,0.8,0.25,1)]",
            hasEntered ? "scale-[3]" : "scale-100",
          )}
        >
          <Logo className="mb-8 h-32 w-32 text-blueprint drop-shadow-[0_0_15px_rgba(94,129,172,0.4)]" />

          <h1 className="mb-4 font-serif text-7xl font-semibold text-graphite drop-shadow-md">
            LoreForge
          </h1>
          <p className="mb-12 font-mono text-sm leading-relaxed text-pencil-gray">
            PRECISION ASSET GENERATION FORGE.
            <br />[ SYSTEM STATUS: READY ]
          </p>
          <button
            onClick={() => setHasEntered(true)}
            className="cursor-pointer rounded-lg border border-transparent bg-blueprint px-14 py-4 font-mono font-bold tracking-widest text-paper uppercase shadow-lg transition-all duration-300 hover:bg-[#81a1c1] hover:shadow-xl active:translate-y-0.5 active:shadow-sm"
          >
            INITIALIZE SYSTEM
          </button>
        </div>
      </div>

      <FormProvider {...methods}>
        {/* 2. Wrap the entire app in FormProvider.
          This allows components like CanvasCard to call `useFormContext` 
          and directly mutate the form when user clicks 'Regen' or 'Evolve'. */}
        <LightboxProvider>
          <ConfirmProvider>
            <div
              className={cn(
                "app-container flex min-h-screen w-full max-w-[100vw] flex-col transition-all duration-1000 ease-[cubic-bezier(0.25,0.8,0.25,1)] md:flex-row",
                hasEntered
                  ? "blur-0 scale-100 opacity-100"
                  : "pointer-events-none scale-95 opacity-0 blur-md",
              )}
            >
              {/* LEFT PANEL: DRAFTING STATION SIDEBAR */}
              <div
                className={cn(
                  "custom-scrollbar z-20 w-full border-r border-silver bg-paper/95 p-6 backdrop-blur-sm",
                  "md:sticky md:top-0 md:h-screen md:w-[320px] md:min-w-[320px] md:overflow-y-auto md:p-8",
                )}
              >
                <GeneratorPanel />
              </div>

              {/* RIGHT PANEL: THE CANVAS / GALLERY (SWIMLANES) */}
              <div
                className={cn(
                  "box-border flex w-full min-w-0 flex-1 flex-col gap-12 p-6",
                  "md:w-[calc(100%-320px)] md:px-12 md:py-8",
                )}
              >
                <GalleryBoard />
              </div>
            </div>
          </ConfirmProvider>
        </LightboxProvider>
      </FormProvider>
    </>
  );
}
