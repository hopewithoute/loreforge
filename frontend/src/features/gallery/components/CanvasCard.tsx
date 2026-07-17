import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { getListAssetsQueryKey } from "@/api/endpoints/assets/assets";
import type { Asset, GeneratorFormValues } from "@/features/generator/types";
import { useAssetStatus } from "@/features/generator/api/useAssetStatus";

import { useDeleteAsset } from "@/features/generator/api/useDeleteAsset";
import { useLightbox } from "@/app/LightboxContext";
import { useConfirm } from "@/app/ConfirmContext";
import { cn, getMediaUrl } from "@/lib/utils";
import { EditIcon, ArrowRightIcon, TrashIcon } from "@/components/Icons";

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

  const queryClient = useQueryClient();

  useEffect(() => {
    if (
      initialAsset.status === "pending" &&
      polledAsset &&
      polledAsset.status !== "pending"
    ) {
      void queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey() });
    }
  }, [initialAsset.status, polledAsset, queryClient]);

  const asset = polledAsset || initialAsset;

  const deleteAsset = useDeleteAsset();
  const { openLightbox } = useLightbox();

  // Access global form context (provided in App.tsx)
  // This allows the CanvasCard to "reach over" to the left panel and update its inputs.
  const { setValue } = useFormContext<GeneratorFormValues>();

  /**
   * Helper function to fill the left panel (GeneratorForm) with data from this specific asset.
   * Based on the `mode`, it configures the form either to completely regenerate the asset,
   * or evolve the image further.
   */
  const populateForm = (mode: "regen" | "evolve") => {
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
      setValue("sibling_id", asset.id);
      setValue("evolveTarget", null);
      setValue("isLockedMode", !!asset.parent_id);

      if (asset.reference_image_path) {
        setValue("previewUrl", getMediaUrl(asset.reference_image_path));
        const defaultName = `[Restored] ${asset.reference_image_path.split("/").pop() || "previous_sketch.png"}`;
        setValue("fileName", defaultName);
      } else if (asset.prepared_input_path) {
        setValue("previewUrl", getMediaUrl(asset.prepared_input_path));
        setValue("fileName", "[ Restored Evolution Parent ]");
      } else {
        setValue("previewUrl", null);
        setValue("fileName", null);
      }
    }

    if (window.innerWidth < 768) {
      document.getElementById("generator-form")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleRegenerate = () => populateForm("regen");
  const handleEvolve = () => populateForm("evolve");

  return (
    <div
      className={cn(
        "group relative flex w-70 shrink-0 snap-start flex-col gap-4 p-4",
        "rounded-xl border border-[rgba(15,23,42,0.1)] bg-(--paper) shadow-md",
        "transition-all duration-200",
        "hover:z-10 hover:-translate-y-1 hover:bg-[#FFFFFF] hover:shadow-xl",
      )}
    >
      <div
        role="button"
        tabIndex={0}
        className={cn(
          "relative flex aspect-square w-full cursor-zoom-in items-center justify-center",
          "overflow-hidden rounded-lg border border-[rgba(15,23,42,0.1)] bg-[rgba(255,255,255,0.4)]",
        )}
        onClick={() => {
          if (asset.status === "success") {
            openLightbox(getMediaUrl(asset.generated_image_path), asset.prompt);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            if (asset.status === "success") {
              openLightbox(getMediaUrl(asset.generated_image_path), asset.prompt);
            }
          }
        }}
      >
        {asset.status === "pending" ? (
          <div className="flex h-full w-full flex-col items-center justify-center bg-[rgba(15,23,42,0.02)] p-4 text-center">
            {/* Pulsing Hexagon Core */}
            <div className="relative mb-6 flex h-14 w-14 items-center justify-center">
              {/* Outer rotating dashed hexagon */}
              <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 h-full w-full animate-[spin_4s_linear_infinite] text-(--blueprint) opacity-60"
              >
                <polygon
                  points="50 3, 93 25, 93 75, 50 97, 7 75, 7 25"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray="15 5"
                />
              </svg>
              {/* Inner pulsing solid hexagon */}
              <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 h-full w-full animate-pulse text-(--blueprint)"
              >
                <polygon
                  points="50 18, 77 34, 77 66, 50 82, 23 66, 23 34"
                  fill="currentColor"
                  fillOpacity="0.15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              {/* Core energy dot */}
              <div className="h-2 w-2 animate-ping rounded-full bg-(--blueprint)" />
            </div>

            {/* Blinking Status Text */}
            <span className="animate-pulse font-mono text-[0.65rem] font-bold tracking-[2px] text-(--pencil-gray) uppercase drop-shadow-sm">
              [ SYNTHESIZING ASSET... ]
            </span>
          </div>
        ) : asset.status === "failed" ? (
          <div className="flex h-full w-full flex-col items-center justify-center bg-[rgba(191,97,106,0.05)] p-4 text-center text-(--red-pencil)">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-(--red-pencil) bg-[rgba(191,97,106,0.1)]">
              <span className="font-mono text-xl font-bold">!</span>
            </div>
            <span className="mb-1 border-b border-[rgba(191,97,106,0.3)] pb-1 font-mono text-xs font-bold tracking-[2px] uppercase">
              {asset.error_code || "RENDER_FAILED"}
            </span>
            <span className="mt-2 line-clamp-4 max-w-[95%] font-mono text-[0.65rem] leading-relaxed uppercase opacity-80">
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
        <p className="m-0 line-clamp-3 font-mono text-xs leading-relaxed text-(--pencil-gray)">
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
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={asset.status === "pending"}
            className={cn(
              "flex-1 cursor-pointer rounded-md border p-1.5",
              "font-mono text-[0.75rem] font-bold tracking-[1px] uppercase shadow-sm transition-all duration-200 disabled:opacity-50",
              asset.status === "failed"
                ? "border-(--red-pencil) bg-[rgba(225,29,72,0.05)] text-(--red-pencil) hover:bg-(--red-pencil) hover:text-(--paper)"
                : "border-(--graphite) bg-transparent text-(--graphite) hover:bg-(--graphite) hover:text-(--paper)",
            )}
          >
            <span className="flex items-center justify-center gap-1.5">
              {asset.status === "failed" ? "RETRY" : "REGEN"} <EditIcon />
            </span>
          </button>
          {asset.status === "success" && (
            <button
              type="button"
              onClick={handleEvolve}
              className={cn(
                "flex-1 cursor-pointer rounded-md border border-transparent bg-(--blueprint) p-1.5",
                "font-mono text-[0.75rem] font-bold tracking-[1px] text-(--paper) uppercase shadow-sm",
                "transition-all duration-200 hover:bg-[#81a1c1] disabled:opacity-50",
              )}
            >
              <span className="flex items-center justify-center gap-1.5">
                EVOLVE <ArrowRightIcon />
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Global Prune Button (Visible on Hover) */}
      <button
        type="button"
        onClick={async (e) => {
          e.stopPropagation();
          const isConfirmed = await confirm(
            "This action will completely remove this asset and recursively delete all of its descendants from existence. This action cannot be undone.",
            "Prune Branch?",
            <span className="flex items-center justify-center gap-1.5">
              PRUNE <TrashIcon className="h-4 w-4" />
            </span>,
          );
          if (isConfirmed) {
            deleteAsset.mutate({ assetId: asset.id });
          }
        }}
        disabled={deleteAsset.isPending || asset.status === "pending" || isTrackPending}
        className={cn(
          "absolute -top-2.5 -right-2.5 z-20 hidden h-7 w-7 items-center justify-center",
          "cursor-pointer rounded-full border border-[rgba(191,97,106,0.5)] bg-(--paper) font-mono text-[0.7rem] text-(--red-pencil)",
          "shadow-sm transition-all duration-200 hover:border-(--red-pencil) hover:bg-(--red-pencil) hover:text-(--paper)",
          "group-hover:flex",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[rgba(191,97,106,0.5)] disabled:hover:bg-(--paper) disabled:hover:text-(--red-pencil)",
        )}
        title="Prune this asset (and all descendants)"
      >
        {deleteAsset.isPending ? "..." : "X"}
      </button>
    </div>
  );
}
