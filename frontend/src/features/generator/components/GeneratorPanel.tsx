import { useState } from "react";
import { GeneratorForm } from "./GeneratorForm";
import { GeneratorResult } from "./GeneratorResult";
import { useCreateAsset } from "../api/useCreateAsset";
import { useAssetStatus } from "../api/useAssetStatus";

export function GeneratorPanel() {
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);

  const createAsset = useCreateAsset();
  const { data: asset } = useAssetStatus(activeAssetId);

  const handleSubmit = (formData: FormData) => {
    // Optimistically reset active asset so the loading state begins immediately
    setActiveAssetId(null);

    createAsset.mutate(formData, {
      onSuccess: (data) => {
        setActiveAssetId(data.id);
      },
      onError: (error) => {
        console.error("Failed to submit generation request", error);
        // We could handle form-level errors here (e.g. 422) if needed
      },
    });
  };

  // The process is pending if the mutation is running, OR if we have an asset that is still 'pending'
  const isPending = createAsset.isPending || asset?.status === "pending";

  return (
    <div className="flex flex-col h-full">
      <div className="bg-paper-2/80 backdrop-blur-xl rounded-2xl p-6 border border-ink-3/20 shadow-2xl mb-6">
        <h2 className="font-serif text-2xl mb-2 text-ink">Generator</h2>
        <p className="text-ink-2 text-sm mb-6">
          Set your parameters and forge a new concept.
        </p>

        <GeneratorForm onSubmit={handleSubmit} isPending={isPending} />
      </div>

      <div className="grow">
        <GeneratorResult asset={asset} isPending={isPending} />
      </div>
    </div>
  );
}
