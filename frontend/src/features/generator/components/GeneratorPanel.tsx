import { useState } from "react";
import { GeneratorForm } from "./GeneratorForm";
import { Logo } from "@/components/Logo";
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
      <div className="mb-6 flex items-center gap-4 border-b border-[rgba(15,23,42,0.15)] pb-4">
        <Logo className="h-[3.2rem] w-[3.2rem] text-(--blueprint) drop-shadow-sm" />
        <div className="flex flex-col">
          <h1
            className={cn(
              "m-0 font-['Playfair_Display',serif] text-[2.2rem]",
              "leading-none font-semibold text-(--graphite)",
            )}
          >
            LoreForge
          </h1>
          <p
            className={cn(
              "mt-1 text-[0.65rem] tracking-[1px] whitespace-nowrap text-(--pencil-gray) uppercase",
            )}
          >
            DIGITAL PROTOTYPING FORGE
          </p>
        </div>
      </div>

      <GeneratorForm
        onSubmit={handleSubmit}
        isPending={isPending}
        serverError={submitError}
      />

      <div
        className={cn(
          "pointer-events-none absolute bottom-10 left-5 hidden",
          "font-mono text-[0.7rem] font-bold tracking-[1px] text-(--pencil-gray) md:block",
        )}
      >
        [SYSTEM_READY: AWAITING_SCHEMATICS]
      </div>
    </div>
  );
}
