import * as React from "react";
import { CATEGORY_OPTIONS, STYLE_OPTIONS } from "@/features/generator/types";
import { cn } from "@/lib/utils";
import { ArrowRightIcon, LockIcon } from "@/components/Icons";
import type { AssetCategory, AssetStyle, EvolveTarget } from "@/features/generator/types";

interface CategorySelectorProps {
  value: AssetCategory;
  onChange: (val: AssetCategory) => void;
  disabled: boolean;
  isLocked?: boolean;
}

export function CategorySelector({
  value,
  onChange,
  disabled,
  isLocked,
}: CategorySelectorProps) {
  return (
    <div className="form-group mb-6">
      <label
        htmlFor="category_group"
        className="mb-2.5 flex items-center gap-2 text-xs font-semibold tracking-[1px] text-(--pencil-gray) uppercase"
      >
        ASSET CATEGORY
        {isLocked && (
          <span title="Locked to parent lineage" className="text-[10px]">
            <LockIcon className="opacity-80" />
          </span>
        )}
      </label>
      <div id="category_group" className="flex flex-wrap gap-2">
        {CATEGORY_OPTIONS.map((opt) => (
          <button
            type="button"
            key={opt.value}
            data-category={opt.value}
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            className={cn(
              "cursor-pointer rounded-md border border-[rgba(15,23,42,0.15)] bg-transparent px-3 py-1.5",
              "font-mono text-xs text-(--graphite) transition-all duration-200",
              "hover:bg-[rgba(15,23,42,0.05)] disabled:opacity-50",
              value === opt.value && "bg-(--graphite)! text-(--paper)!",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface StyleSelectorProps {
  value: AssetStyle;
  onChange: (val: AssetStyle) => void;
  disabled: boolean;
  isLocked?: boolean;
}

export function StyleSelector({
  value,
  onChange,
  disabled,
  isLocked,
}: StyleSelectorProps) {
  return (
    <div className="form-group mb-6">
      <label
        htmlFor="style_group"
        className="mb-2.5 flex items-center gap-2 text-xs font-semibold tracking-[1px] text-(--pencil-gray) uppercase"
      >
        OUTPUT STYLE
        {isLocked && (
          <span title="Locked to parent lineage" className="text-[10px]">
            <LockIcon className="opacity-80" />
          </span>
        )}
      </label>
      <div id="style_group" className="flex flex-wrap gap-2">
        {STYLE_OPTIONS.map((opt) => (
          <button
            type="button"
            key={opt.value}
            data-style={opt.value}
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            className={cn(
              "cursor-pointer rounded-md border border-[rgba(15,23,42,0.15)] bg-transparent px-3 py-1.5",
              "font-mono text-xs text-(--graphite) transition-all duration-200",
              "hover:bg-[rgba(15,23,42,0.05)] disabled:opacity-50",
              value === opt.value &&
                "border-(--blueprint)! bg-(--blueprint)! text-(--paper)!",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

import { forwardRef } from "react";

export type PromptFieldProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const PromptField = forwardRef<HTMLTextAreaElement, PromptFieldProps>(
  ({ className, disabled, ...props }, ref) => {
    return (
      <div className="form-group mb-6">
        <label
          htmlFor="prompt"
          className="mb-2.5 block text-xs font-semibold tracking-[1px] text-(--pencil-gray) uppercase"
        >
          GENERATION PARAMETERS
        </label>
        <textarea
          id="prompt"
          disabled={disabled}
          ref={ref}
          placeholder="> Input target asset specifications and visual parameters..."
          className={cn(
            "custom-scrollbar box-border min-h-30 w-full resize-y rounded-md border border-[rgba(15,23,42,0.15)] bg-transparent p-3",
            "font-mono text-xs leading-relaxed text-(--graphite)",
            "transition-all duration-200 focus:border-(--blueprint) focus:bg-[rgba(255,255,255,0.8)]",
            "focus:shadow-[0_0_10px_rgba(129,161,193,0.2)] focus:ring-0! focus:ring-transparent! focus:outline-none! disabled:opacity-50",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
PromptField.displayName = "PromptField";

interface ReferenceUploadProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onDragOver" | "onDrop"
> {
  fileName: string | null;
  previewUrl: string | null;
  evolveTarget: EvolveTarget | null;
  onClearFile: (e: React.MouseEvent | React.KeyboardEvent) => void;
  onDragOver: (e: React.DragEvent<HTMLButtonElement>) => void;
  onDrop: (e: React.DragEvent<HTMLButtonElement>) => void;
}

export const ReferenceUpload = React.forwardRef<HTMLInputElement, ReferenceUploadProps>(
  (
    {
      fileName,
      previewUrl,
      evolveTarget,
      onClearFile,
      onDragOver,
      onDrop,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <div className="form-group relative mb-6">
        <div className="mb-2.5 flex items-end justify-between">
          <label
            htmlFor="reference_image"
            className="block text-xs font-semibold tracking-[1px] text-(--pencil-gray) uppercase"
          >
            {evolveTarget ? "Evolving from Parent Image" : "REFERENCE"}
          </label>

          {fileName && !disabled && !evolveTarget && (
            <button
              type="button"
              className="cursor-pointer font-mono text-[0.65rem] font-bold tracking-[1px] text-(--red-pencil) uppercase transition-colors hover:text-red-700"
              onClick={onClearFile}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onClearFile(e);
              }}
            >
              [ CLEAR ]
            </button>
          )}
        </div>
        <input
          type="file"
          id="reference_image"
          accept="image/png, image/jpeg"
          className={cn("hidden", className)}
          ref={ref}
          disabled={disabled || !!evolveTarget}
          {...props}
        />

        <button
          type="button"
          disabled={disabled || !!evolveTarget}
          className={cn(
            "relative flex w-full cursor-pointer justify-center overflow-hidden rounded-md border border-[rgba(15,23,42,0.15)]",
            "bg-transparent p-3.75 text-center text-xs tracking-[1px]",
            "text-(--pencil-gray) uppercase transition-all duration-200",
            "hover:border-(--blueprint) hover:bg-[rgba(255,255,255,0.8)] hover:text-(--blueprint) hover:shadow-[0_0_10px_rgba(129,161,193,0.2)]",
            evolveTarget
              ? "cursor-not-allowed border-(--blueprint) bg-[rgba(42,92,139,0.05)] bg-none! opacity-100 hover:border-(--blueprint) hover:shadow-none"
              : "disabled:opacity-50",
          )}
          style={{
            backgroundImage: evolveTarget
              ? "none"
              : "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(15,23,42,0.03) 8px, rgba(15,23,42,0.03) 16px)",
          }}
          onClick={() => {
            if (!evolveTarget) {
              const fileInput = document.getElementById(
                "reference_image",
              ) as HTMLInputElement;
              if (fileInput) fileInput.click();
            }
          }}
          onDragOver={!evolveTarget ? onDragOver : undefined}
          onDrop={!evolveTarget ? onDrop : undefined}
        >
          {previewUrl ? (
            <div className="relative flex h-30 w-full items-center justify-center p-2">
              <img
                src={previewUrl}
                alt={fileName || "Reference Sketch"}
                className="h-full w-full rounded object-contain drop-shadow-md"
              />
            </div>
          ) : (
            <span className="my-auto">
              {fileName ? `[ ${fileName} ]` : "[ UPLOAD REFERENCE ]"}
            </span>
          )}
        </button>
      </div>
    );
  },
);
ReferenceUpload.displayName = "ReferenceUpload";

interface SubmitControlsProps {
  isPending: boolean;
  evolveTarget: EvolveTarget | null;
  siblingId?: string;
  onCancelEvolve: () => void;
}

export function SubmitControls({
  isPending,
  evolveTarget,
  siblingId,
  onCancelEvolve,
}: SubmitControlsProps) {
  return (
    <>
      {evolveTarget && (
        <button
          type="button"
          onClick={onCancelEvolve}
          disabled={isPending}
          className={cn(
            "mb-3 w-full cursor-pointer rounded-md border border-(--graphite) bg-transparent p-2",
            "font-mono text-[0.75rem] font-semibold tracking-[1px] text-(--graphite) uppercase",
            "hover:bg-[rgba(28,28,26,0.05)] disabled:opacity-50",
          )}
        >
          × CANCEL EVOLVE
        </button>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "relative w-full cursor-pointer overflow-hidden rounded-md border border-transparent p-3 font-mono text-[0.85rem] font-bold",
          "tracking-[2px] uppercase shadow-md transition-all duration-200 active:translate-y-0.5 active:shadow-sm",
          "disabled:cursor-not-allowed disabled:opacity-50",
          evolveTarget
            ? "bg-(--blueprint) text-(--paper) hover:bg-[#81a1c1]"
            : "bg-(--blueprint) text-(--paper) hover:bg-[#81a1c1]",
        )}
      >
        {isPending ? (
          "FORGING..."
        ) : evolveTarget ? (
          <span className="flex items-center justify-center gap-2">
            EVOLVE BRANCH <ArrowRightIcon className="h-4 w-4" />
          </span>
        ) : siblingId ? (
          "REGENERATE VARIANT"
        ) : (
          "INITIALIZE RENDER"
        )}
      </button>
    </>
  );
}
