import { GeneratorPanel } from "@/features/generator/components/GeneratorPanel";
import { GalleryBoard } from "@/features/gallery/components/GalleryBoard";
import { LightboxProvider } from "@/features/gallery/components/LightboxProvider";
import { cn } from "@/lib/utils";
import { useForm, FormProvider } from "react-hook-form";
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
    },
  });

  return (
    <FormProvider {...methods}>
      {/* 2. Wrap the entire app in FormProvider.
          This allows components like CanvasCard to call `useFormContext` 
          and directly mutate the form when user clicks 'Regen' or 'Evolve'. */}
      <LightboxProvider>
        <div className="app-container min-h-screen w-full max-w-[100vw]">
          {/* LEFT PANEL: DRAFTING STATION SIDEBAR */}
          <div
            className={cn(
              "custom-scrollbar z-20 w-full border-r border-graphite bg-paper/95 p-6 backdrop-blur-sm",
              "md:sticky md:top-0 md:h-screen md:w-[320px] md:min-w-[320px] md:overflow-y-auto md:px-6 md:py-8",
            )}
            style={{ borderRight: "1px solid var(--graphite)" }}
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
      </LightboxProvider>
    </FormProvider>
  );
}
