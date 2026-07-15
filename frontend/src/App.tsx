import { GeneratorPanel } from "./features/generator/components/GeneratorPanel";
import { GalleryBoard } from "./features/gallery/components/GalleryBoard";

export function App() {
  return (
    <div className="app-container w-full min-h-screen">
      {/* LEFT PANEL: DRAFTING STATION SIDEBAR */}
      <div 
        className="w-full md:w-[320px] md:min-w-[320px] md:h-screen md:sticky md:top-0 bg-paper/95 backdrop-blur-sm border-r border-graphite p-6 md:py-8 md:px-6 z-20 custom-scrollbar md:overflow-y-auto"
        style={{ borderRight: "1px solid var(--graphite)" }}
      >
        <GeneratorPanel />
      </div>

      {/* RIGHT PANEL: THE CANVAS / GALLERY (SWIMLANES) */}
      <div className="flex-1 p-5 md:py-12 md:px-10 flex flex-col gap-[70px] box-border overflow-hidden w-full md:w-[calc(100%-320px)]">
        <GalleryBoard />
      </div>
    </div>
  );
}
