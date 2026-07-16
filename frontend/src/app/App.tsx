import { GeneratorPanel } from "@/features/generator/components/GeneratorPanel";
import { GalleryBoard } from "@/features/gallery/components/GalleryBoard";
import { LightboxProvider } from "@/features/gallery/components/LightboxProvider";
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
      fileInputResetKey: 0,
      isLockedMode: false,
    },
  });

  const [hasEntered, setHasEntered] = useState(false);

  return (
    <>
      {/* LANDING HERO OVERLAY (Concept 6: Drafting Table) */}
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-paper/90 backdrop-blur-sm transition-opacity duration-1000",
          hasEntered ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        <div
          className={cn(
            "relative max-w-[600px] border border-graphite bg-paper p-16 text-center shadow-[12px_12px_0px_rgba(28,28,26,0.08)] transition-all duration-700",
            hasEntered ? "scale-95 -rotate-3" : "-rotate-1",
          )}
        >
          {/* Red pencil mark accent */}
          <div className="absolute top-2.5 -right-5 h-0.5 w-10 rotate-[15deg] bg-red-pencil"></div>

          <Logo className="mx-auto mb-6 h-24 w-24 text-blueprint drop-shadow-[4px_4px_0px_rgba(28,28,26,0.1)]" />

          <h1 className="mb-4 font-serif text-6xl font-semibold text-graphite">
            LoreForge
          </h1>
          <p className="mb-10 text-base leading-relaxed text-pencil-gray">
            Turn imagination into visual assets.<br />
            Iterative drafting for game creators.
          </p>
          <button
            onClick={() => setHasEntered(true)}
            className="border border-dashed border-graphite bg-transparent px-12 py-4 font-mono text-sm tracking-wider text-graphite uppercase transition-all duration-200 hover:border-solid hover:bg-graphite hover:text-paper hover:shadow-[4px_4px_0px_var(--red-pencil)]"
          >
            Begin Drafting
          </button>
        </div>
      </div>

      <FormProvider {...methods}>
        {/* 2. Wrap the entire app in FormProvider.
          This allows components like CanvasCard to call `useFormContext` 
          and directly mutate the form when user clicks 'Regen' or 'Evolve'. */}
        <LightboxProvider>
          <ConfirmProvider>
            <div className="app-container min-h-screen w-full max-w-[100vw]">
              {/* LEFT PANEL: DRAFTING STATION SIDEBAR */}
              <div
                className={cn(
                  "custom-scrollbar z-20 w-full border-r border-graphite bg-paper/95 p-6 backdrop-blur-sm",
                  "md:sticky md:top-0 md:h-screen md:w-[320px] md:min-w-[320px] md:overflow-y-auto md:px-6 md:py-8",
                )}
              >
                <GeneratorPanel />
              </div>

              {/* RIGHT PANEL: THE CANVAS / GALLERY (SWIMLANES) */}
              <div
                className={cn(
                  "box-border flex w-full min-w-0 flex-1 flex-col gap-17.5 p-5",
                  "md:w-[calc(100%-320px)] md:px-10 md:py-12",
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
