import { useState } from "react";
import { GeneratorForm } from "./GeneratorForm";
import { cn, extractError } from "@/lib/utils";
import { useCreateAsset } from "@/features/generator/api/useCreateAsset";
import { useEvolveAsset } from "@/features/generator/api/useEvolveAsset";
import { useAssetStatus } from "@/features/generator/api/useAssetStatus";
import type { AssetCreateForm } from "@/api/model";

export function GeneratorPanel() {
  // activeAssetId tracks the most recently requested generation.
  // We use it to poll the specific asset status via useAssetStatus hook.
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createAsset = useCreateAsset();
  const evolveAsset = useEvolveAsset();

  // Triggers background polling automatically when activeAssetId is not null
  const { data: asset } = useAssetStatus(activeAssetId);

  // Primary submission handler. Called by GeneratorForm when the user clicks submit.
  // It routes the payload either to the Evolve API (if parentId exists) or Create API.
  const handleSubmit = (payload: AssetCreateForm, evolveParentId?: string) => {
    setSubmitError(null);
    setActiveAssetId(null);

    // Orval wraps responses in { data: ... }, but its types are unions (Success | Error).
    const handleSuccess = (response: unknown) => {
      const data = (response as { data?: { id?: string } })?.data;
      if (data?.id) setActiveAssetId(data.id);
    };

    if (evolveParentId) {
      const evolvePayload = {
        prompt: payload.prompt || "",
        category: payload.category,
        style: payload.style,
      };

      evolveAsset.mutate(
        { parentId: evolveParentId, payload: evolvePayload },
        {
          onSuccess: handleSuccess,
          onError: (error) =>
            setSubmitError(extractError(error, "Failed to initialize evolution.")),
        },
      );
    } else {
      createAsset.mutate(payload, {
        onSuccess: handleSuccess,
        onError: (error) =>
          setSubmitError(extractError(error, "Failed to initialize render.")),
      });
    }
  };

  const isPending =
    createAsset.isPending || evolveAsset.isPending || asset?.status === "pending";

  return (
    <div className="relative flex h-full flex-col">
      <h1
        className={cn(
          "m-0 mb-1 font-['Playfair_Display',serif] text-[2.2rem]",
          "font-semibold text-(--graphite) italic",
        )}
      >
        LoreForge
      </h1>
      <p
        className={cn(
          "mb-6 border-b border-(--graphite) pb-3.75",
          "text-[0.8rem] tracking-[2px] text-(--pencil-gray) uppercase",
        )}
      >
        Art Dept. Station
      </p>

      {submitError && (
        <div className="mb-6 border border-(--red-pencil) bg-red-500/5 p-3 font-mono text-sm text-(--red-pencil)">
          [Error] {submitError}
        </div>
      )}

      <GeneratorForm onSubmit={handleSubmit} isPending={isPending} />

      <div
        className={cn(
          "pointer-events-none absolute bottom-10 left-5 hidden -rotate-3",
          "font-['Caveat',cursive] text-[1.2rem] text-(--red-pencil) opacity-80 md:block",
        )}
      >
        Use #graphite for shadows...
      </div>
    </div>
  );
}
