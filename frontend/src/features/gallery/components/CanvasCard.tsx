import type { Asset } from "../../generator/types";
import { useAssetStatus } from "../../generator/api/useAssetStatus";
import { useRetryAsset } from "../../generator/api/useRetryAsset";

interface CanvasCardProps {
  asset: Asset;
}

export function CanvasCard({ asset: initialAsset }: CanvasCardProps) {
  // If the asset is still pending, we poll for its status. Otherwise we use the provided one.
  const { data: polledAsset } = useAssetStatus(initialAsset.status === "pending" ? initialAsset.id : null);
  const asset = polledAsset || initialAsset;
  const retryAsset = useRetryAsset();

  const handleRecover = () => {
    retryAsset.mutate({ asset_id: asset.id });
  };

  const handleRegenerate = () => {
    const form = document.querySelector("form");
    if (form) {
      const promptInput = form.querySelector('textarea[name="prompt"]') as HTMLTextAreaElement;
      if (promptInput) {
        promptInput.value = asset.prompt;
      }
      
      const catBtn = form.querySelector(`button[data-category="${asset.category}"]`) as HTMLButtonElement;
      if (catBtn) catBtn.click();
      
      const styleBtn = form.querySelector(`button[data-style="${asset.style}"]`) as HTMLButtonElement;
      if (styleBtn) styleBtn.click();

      const hiddenRefInput = form.querySelector('#hidden_existing_ref') as HTMLInputElement;
      if (hiddenRefInput) {
        // Only set the existing reference if the asset actually had a reference image
        hiddenRefInput.value = asset.reference_image_path ? asset.id : "";
        
        const hiddenSiblingInput = form.querySelector('#hidden_sibling_id') as HTMLInputElement;
        if (hiddenSiblingInput) {
          hiddenSiblingInput.value = asset.id;
        }

        if (asset.reference_image_path) {
          const filename = asset.reference_image_path.split('/').pop() || "previous_sketch.png";
          const url = asset.reference_image_path.startsWith('/') 
             ? asset.reference_image_path 
             : `/media/${asset.reference_image_path}`;
             
          const event = new CustomEvent("restore-reference", { 
            detail: { filename: `[Restored] ${filename}`, url } 
          });
          form.dispatchEvent(event);
        } else {
          // If the asset has no reference image, clear any existing reference in the form
          const event = new CustomEvent("restore-reference", { 
            detail: { filename: null, url: null } 
          });
          form.dispatchEvent(event);
        }
      }

      form.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-w-[280px] max-w-[280px] bg-[var(--paper)] border border-[var(--graphite)] p-[10px] flex flex-col gap-[15px] relative shrink-0 shadow-[3px_3px_0px_rgba(0,0,0,0.05)] transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] hover:-translate-y-1 hover:shadow-[10px_10px_20px_rgba(0,0,0,0.05)] hover:bg-[#FFFFFF] hover:z-10 group snap-start">
      {/* Origami fold corner */}
      <div className="absolute top-0 right-0 border-solid border-b-[15px] border-l-[15px] border-b-transparent border-l-transparent border-t-[#E0DFD8] border-r-[#E0DFD8] transition-colors duration-300 group-hover:border-t-[#FFFFFF] group-hover:border-r-[#FFFFFF]" />

      <div className="w-full aspect-square border border-[var(--graphite)] flex items-center justify-center overflow-hidden cursor-zoom-in bg-[#FFFFFF] relative">
        {/* Crosshairs */}
        <div className="absolute bg-[rgba(255,255,255,0.7)] z-[2] w-[10px] h-[1px] top-[10px] left-[-5px]" />
        <div className="absolute bg-[rgba(255,255,255,0.7)] z-[2] w-[1px] h-[10px] top-[-5px] left-[10px]" />

        {asset.status === "pending" ? (
          <div className="flex flex-col items-center p-4 text-center">
            <div className="w-8 h-8 border-2 border-dashed border-[var(--pencil-gray)] rounded-full animate-spin mb-2" />
            <span className="font-mono text-xs text-[var(--pencil-gray)]">Forging asset...</span>
          </div>
        ) : asset.status === "failed" ? (
          <div className="flex flex-col items-center p-4 text-center text-[var(--red-pencil)]">
            <span className="font-mono text-sm mb-2 font-bold">{asset.error_code || "RENDER_FAILED"}</span>
            <span className="font-mono text-xs opacity-80 line-clamp-4">{asset.error_message || "Unknown anomaly detected"}</span>
          </div>
        ) : (
          <img
            src={asset.generated_image_path?.startsWith('/') ? asset.generated_image_path : `/media/${asset.generated_image_path}`}
            alt={asset.prompt}
            className="w-full h-full object-cover transition-transform duration-400 ease-in group-hover:scale-105 contrast-105 saturate-90"
          />
        )}
      </div>

      <div className="flex flex-col gap-2 relative z-10">
        <p className="font-['Caveat',_cursive] text-[1.4rem] leading-[1.2] text-[var(--blueprint)] m-0 line-clamp-3">
          {asset.prompt || "—"}
        </p>
        <div className="flex gap-2 font-mono text-[0.65rem] uppercase tracking-[1px] text-[var(--pencil-gray)]">
          <span className="px-2 py-1 bg-[rgba(28,28,26,0.05)] border border-[rgba(28,28,26,0.1)]">
            {asset.category}
          </span>
          <span className="px-2 py-1 bg-[rgba(42,92,139,0.05)] border border-[rgba(42,92,139,0.1)] text-[var(--blueprint)]">
            {asset.style}
          </span>
        </div>
        {asset.status === "failed" ? (
          <button
            onClick={handleRecover}
            disabled={retryAsset.isPending}
            className="w-full bg-[rgba(189,49,36,0.05)] border border-[var(--red-pencil)] text-[var(--red-pencil)] p-[6px] font-mono cursor-pointer text-[0.75rem] uppercase tracking-[1px] transition-all duration-200 hover:bg-[var(--red-pencil)] hover:text-[var(--paper)] disabled:opacity-50"
          >
            {retryAsset.isPending ? "Recovering..." : "Recover ↺"}
          </button>
        ) : (
          <button
            onClick={handleRegenerate}
            disabled={asset.status !== "success"}
            className="w-full bg-transparent border border-[var(--graphite)] text-[var(--graphite)] p-[6px] font-mono cursor-pointer text-[0.75rem] uppercase tracking-[1px] transition-all duration-200 hover:bg-[var(--graphite)] hover:text-[var(--paper)] disabled:opacity-50"
          >
            Regenerate ✎
          </button>
        )}
      </div>
    </div>
  );
}
