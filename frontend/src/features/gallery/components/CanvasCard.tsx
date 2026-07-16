import { useFormContext } from "react-hook-form";
import type { Asset, GeneratorFormValues } from "@/features/generator/types";
import { useAssetStatus } from "@/features/generator/api/useAssetStatus";
import { useRetryAsset } from "@/features/generator/api/useRetryAsset";
import { useDeleteAsset } from "@/features/generator/api/useDeleteAsset";
import { useLightbox } from "@/features/gallery/components/LightboxProvider";
import { useConfirm } from "@/app/ConfirmProvider";
import { cn, extractError, getMediaUrl } from "@/lib/utils";
import { RetryIcon, EditIcon, ArrowRightIcon, TrashIcon } from "@/components/Icons";

interface CanvasCardProps {
  asset: Asset;
  isTrackPending?: boolean;
}

export function CanvasCard({ asset: initialAsset, isTrackPending }: CanvasCardProps) {
  const confirm = useConfirm();
  // If the asset is still pending, we poll for its status. Otherwise we use the provided one.
  const { data: polledAsset } = useAssetStatus(
    initialAsset.status === "pending" ? initialAsset.id : null,
  );
  const asset = polledAsset || initialAsset;
  const retryAsset = useRetryAsset();
  const deleteAsset = useDeleteAsset();
  const { openLightbox } = useLightbox();

  // Access global form context (provided in App.tsx)
  // This allows the CanvasCard to "reach over" to the left panel and update its inputs.
  const { setValue } = useFormContext<GeneratorFormValues>();

  const handleRecover = () => {
    retryAsset.mutate(
      { assetId: asset.id },
      {
        onError: (error: unknown) => {
          alert(`Failed to recover: ${extractError(error, "Unknown error")}`);
        },
      },
    );
  };

  /**
   * Helper function to fill the left panel (GeneratorForm) with data from this specific asset.
   * Based on the `mode`, it configures the form either to completely regenerate the asset,
   * recover an existing sketch, or evolve the image further.
   */
  const populateForm = (mode: "regen" | "recover" | "evolve") => {
    // 1. Basic properties are always restored
    setValue("prompt", asset.prompt);
    setValue("category", asset.category);
    setValue("style", asset.style);

    if (mode === "evolve") {
      setValue("existing_reference_id", "");
      setValue("sibling_id", "");
      setValue("evolveTarget", asset);
      setValue("fileName", "[ Evolving Parent ]");
      setValue("previewUrl", getMediaUrl(asset.generated_image_path) || null);
    } else {
      const hasReference = !!(asset.reference_image_path || asset.prepared_input_path);
      setValue("existing_reference_id", hasReference ? asset.id : "");
      setValue("sibling_id", mode === "regen" ? asset.id : "");
      setValue("evolveTarget", null);
      setValue("isLockedMode", mode === "regen" && !!asset.parent_id);

      if (asset.reference_image_path) {
        setValue("previewUrl", getMediaUrl(asset.reference_image_path));
        const defaultName = `[Restored] ${asset.reference_image_path.split("/").pop() || "previous_sketch.png"}`;
        setValue("fileName", mode === "recover" ? "[ Existing Reference ]" : defaultName);
      } else if (asset.prepared_input_path) {
        setValue("previewUrl", getMediaUrl(asset.prepared_input_path));
        setValue("fileName", "[ Restored Evolution Parent ]");
      } else {
        setValue("previewUrl", null);
        setValue("fileName", null);
      }
    }

    setValue("fileInputResetKey", Date.now());
    if (window.innerWidth < 768) {
      document.getElementById("generator-form")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleRegenerate = () => populateForm("regen");
  const handleRecoverForm = () => populateForm("recover");
  const handleEvolve = () => populateForm("evolve");

  return (
    <div
      className={cn(
        "group relative flex w-70 shrink-0 snap-start flex-col gap-3.75 p-2.5",
        "border border-(--graphite) bg-(--paper) shadow-[3px_3px_0px_rgba(0,0,0,0.05)]",
        "transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]",
        "hover:z-10 hover:-translate-y-1 hover:bg-[#FFFFFF] hover:shadow-[10px_10px_20px_rgba(0,0,0,0.05)]",
      )}
    >
      {/* Origami fold corner */}
      <div
        className={cn(
          "absolute top-0 right-0 border-b-15 border-l-15 border-solid",
          "border-t-[#E0DFD8] border-r-[#E0DFD8] border-b-transparent border-l-transparent",
          "transition-colors duration-300 group-hover:border-t-[#FFFFFF] group-hover:border-r-[#FFFFFF]",
        )}
      />

      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className={cn(
          "relative flex aspect-square w-full cursor-zoom-in items-center justify-center",
          "overflow-hidden border border-(--graphite) bg-[#FFFFFF]",
        )}
        onClick={() => {
          if (asset.status === "success") {
            openLightbox(getMediaUrl(asset.generated_image_path), asset.prompt);
          }
        }}
      >
        {/* Crosshairs */}
        <div className="absolute top-2.5 -left-1.25 z-2 h-px w-2.5 bg-[rgba(255,255,255,0.7)]" />
        <div className="absolute -top-1.25 left-2.5 z-2 h-2.5 w-px bg-[rgba(255,255,255,0.7)]" />

        {asset.status === "pending" ? (
          <div className="flex flex-col items-center p-4 text-center">
            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-2 border-dashed border-(--pencil-gray)" />
            <span className="font-mono text-xs text-(--pencil-gray)">
              Forging asset...
            </span>
          </div>
        ) : asset.status === "failed" ? (
          <div className="flex flex-col items-center p-4 text-center text-(--red-pencil)">
            <span className="mb-2 font-mono text-sm font-bold">
              {asset.error_code || "RENDER_FAILED"}
            </span>
            <span className="line-clamp-4 font-mono text-xs opacity-80">
              {asset.error_message || "Unknown anomaly detected"}
            </span>
          </div>
        ) : (
          <img
            src={getMediaUrl(asset.generated_image_path)}
            alt={asset.prompt}
            className={cn(
              "h-full w-full object-cover contrast-105 saturate-90",
              "transition-transform duration-400 ease-in group-hover:scale-105",
            )}
          />
        )}
      </div>

      <div className="relative z-10 flex flex-col gap-2">
        <p className="m-0 line-clamp-3 font-['Caveat',cursive] text-[1.4rem] leading-[1.2] text-(--blueprint)">
          {asset.prompt || "—"}
        </p>
        <div className="flex gap-2 font-mono text-[0.65rem] tracking-[1px] text-(--pencil-gray) uppercase">
          <span className="border border-[rgba(28,28,26,0.1)] bg-[rgba(28,28,26,0.05)] px-2 py-1">
            {asset.category}
          </span>
          <span className="border border-[rgba(42,92,139,0.1)] bg-[rgba(42,92,139,0.05)] px-2 py-1 text-(--blueprint)">
            {asset.style}
          </span>
        </div>
        {asset.status === "failed" ? (
          <div className="flex flex-col gap-2">
            {asset.error_code !== "INVALID_PROMPT" && (
              <button
                type="button"
                onClick={handleRecover}
                disabled={retryAsset.isPending}
                className={cn(
                  "w-full cursor-pointer border border-(--red-pencil) bg-[rgba(189,49,36,0.05)] p-1.5",
                  "font-mono text-[0.75rem] tracking-[1px] text-(--red-pencil) uppercase",
                  "transition-all duration-200 hover:bg-(--red-pencil) hover:text-(--paper) disabled:opacity-50",
                )}
              >
                {retryAsset.isPending ? (
                  "Retrying..."
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    RETRY RENDER <RetryIcon />
                  </span>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={handleRecoverForm}
              disabled={retryAsset.isPending || deleteAsset.isPending}
              className={cn(
                "w-full cursor-pointer border border-(--graphite) bg-[rgba(28,28,26,0.05)] p-1.5",
                "font-mono text-[0.75rem] tracking-[1px] text-(--graphite) uppercase",
                "transition-all duration-200 hover:bg-(--graphite) hover:text-(--paper) disabled:opacity-50",
              )}
            >
              <span className="flex items-center justify-center gap-1.5">
                RETRY <RetryIcon />
              </span>
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={asset.status !== "success"}
              className={cn(
                "flex-1 cursor-pointer border border-(--graphite) bg-transparent p-1.5",
                "font-mono text-[0.75rem] tracking-[1px] text-(--graphite) uppercase",
                "transition-all duration-200 hover:bg-(--graphite) hover:text-(--paper) disabled:opacity-50",
              )}
            >
              <span className="flex items-center justify-center gap-1.5">
                REGEN <EditIcon />
              </span>
            </button>
            <button
              type="button"
              onClick={handleEvolve}
              disabled={asset.status !== "success"}
              className={cn(
                "flex-1 cursor-pointer border border-(--blueprint) bg-(--paper) p-1.5",
                "font-mono text-[0.75rem] tracking-[1px] text-(--blueprint) uppercase",
                "transition-all duration-200 hover:bg-(--blueprint) hover:text-(--paper) disabled:opacity-50",
              )}
            >
              <span className="flex items-center justify-center gap-1.5">
                EVOLVE <ArrowRightIcon />
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Global Prune Button (Visible on Hover) */}
      <button
        type="button"
        onClick={async (e) => {
          e.stopPropagation();
          const isConfirmed = await confirm(
            "This action will completely remove this asset and recursively delete all of its descendants from existence. This action cannot be undone.",
            "Prune Branch?",
            "Prune",
          );
          if (isConfirmed) {
            deleteAsset.mutate({ assetId: asset.id });
          }
        }}
        disabled={deleteAsset.isPending || asset.status === "pending" || isTrackPending}
        className={cn(
          "absolute -top-3 -right-3 z-20 hidden h-7 w-7 items-center justify-center",
          "border-2 border-(--graphite) bg-(--paper) font-mono text-xs font-bold text-(--graphite)",
          "shadow-[2px_2px_0px_var(--graphite)] transition-transform",
          "active:translate-y-0 active:shadow-[0px_0px_0px_var(--graphite)]",
          "group-hover:flex",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "cursor-pointer hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_var(--graphite)] disabled:hover:translate-y-0 disabled:hover:shadow-[2px_2px_0px_var(--graphite)]",
        )}
        title="Prune this asset (and all descendants)"
      >
        {deleteAsset.isPending ? "..." : <TrashIcon className="h-4 w-4" />}
      </button>
    </div>
  );
}
