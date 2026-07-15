import { useState } from "react";
import { GeneratorForm } from "./GeneratorForm";
import { useCreateAsset } from "../api/useCreateAsset";
import { useAssetStatus } from "../api/useAssetStatus";

export function GeneratorPanel() {
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createAsset = useCreateAsset();
  const { data: asset } = useAssetStatus(activeAssetId);

  const handleSubmit = (formData: FormData) => {
    setSubmitError(null);
    setActiveAssetId(null);
    createAsset.mutate(formData, {
      onSuccess: (data) => {
        setActiveAssetId(data.id);
      },
      onError: (error) => {
        console.error("Failed to submit generation request", error);
        setSubmitError(error.message || "Failed to initialize render.");
      },
    });
  };

  const isPending = createAsset.isPending || asset?.status === "pending";

  return (
    <div className="relative h-full flex flex-col">
      <h1 className="font-['Playfair_Display',_serif] text-[2.2rem] font-semibold italic m-0 mb-1 text-[var(--graphite)]">
        LoreForge
      </h1>
      <p className="text-[0.8rem] text-[var(--pencil-gray)] uppercase tracking-[2px] mb-6 border-b border-[var(--graphite)] pb-[15px]">
        Art Dept. Station
      </p>

      {submitError && (
        <div className="mb-6 p-3 border border-[var(--red-pencil)] text-[var(--red-pencil)] font-mono text-sm bg-red-500/5">
          [Error] {submitError}
        </div>
      )}

      <GeneratorForm onSubmit={handleSubmit} isPending={isPending} />

      <div className="font-['Caveat',_cursive] text-[var(--red-pencil)] text-[1.2rem] -rotate-3 absolute bottom-10 left-5 opacity-80 pointer-events-none hidden md:block">
        Use #graphite for shadows...
      </div>
    </div>
  );
}
