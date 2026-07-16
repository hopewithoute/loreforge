import { CATEGORY_OPTIONS, STYLE_OPTIONS } from "@/features/generator/types";
import { cn } from "@/lib/utils";
import type { AssetCategory, AssetStyle, EvolveTarget } from "@/features/generator/types";

interface CategorySelectorProps {
  value: AssetCategory;
  onChange: (val: AssetCategory) => void;
  disabled: boolean;
}

export function CategorySelector({ value, onChange, disabled }: CategorySelectorProps) {
  return (
    <div className="form-group mb-6">
      <label
        htmlFor="category_group"
        className="mb-2.5 block text-xs font-semibold tracking-[1px] text-(--pencil-gray) uppercase"
      >
        Subject Category
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
              "cursor-pointer border border-(--graphite) bg-transparent px-3 py-1.5",
              "font-mono text-xs text-(--graphite) transition-all duration-200",
              "hover:bg-[rgba(28,28,26,0.05)] disabled:opacity-50",
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
}

export function StyleSelector({ value, onChange, disabled }: StyleSelectorProps) {
  return (
    <div className="form-group mb-6">
      <label
        htmlFor="style_group"
        className="mb-2.5 block text-xs font-semibold tracking-[1px] text-(--pencil-gray) uppercase"
      >
        Art Style
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
              "cursor-pointer border border-(--graphite) bg-transparent px-3 py-1.5",
              "font-mono text-xs text-(--graphite) transition-all duration-200",
              "hover:bg-[rgba(28,28,26,0.05)] disabled:opacity-50",
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
          Director's Notes
        </label>
        <textarea
          id="prompt"
          disabled={disabled}
          ref={ref}
          placeholder="Describe the concept here..."
          className={cn(
            "custom-scrollbar box-border min-h-30 w-full resize-y border border-(--graphite) bg-transparent p-3",
            "font-['Caveat',cursive] text-[1.4rem] leading-[1.2] text-(--blueprint)",
            "transition-all duration-200 focus:border-(--blueprint) focus:bg-[rgba(255,255,255,0.5)]",
            "focus:shadow-[-4px_4px_0px_rgba(42,92,139,0.1)] focus:outline-none disabled:opacity-50",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
PromptField.displayName = "PromptField";

interface ReferenceUploadProps {
  fileName: string | null;
  previewUrl: string | null;
  evolveTarget: EvolveTarget | null;
  disabled: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFile: (e: React.MouseEvent | React.KeyboardEvent) => void;
  onDragOver: (e: React.DragEvent<HTMLButtonElement>) => void;
  onDrop: (e: React.DragEvent<HTMLButtonElement>) => void;
  fileInputResetKey: number;
}

export function ReferenceUpload({
  fileName,
  previewUrl,
  evolveTarget,
  disabled,
  onFileChange,
  onClearFile,
  onDragOver,
  onDrop,
  fileInputResetKey,
}: ReferenceUploadProps) {
  return (
    <div className="form-group relative mb-6">
      <label
        htmlFor="reference_image"
        className="mb-2.5 block text-xs font-semibold tracking-[1px] text-(--pencil-gray) uppercase"
      >
        {evolveTarget ? "Evolving from Parent Image" : "Reference Sketch"}
      </label>
      <input
        key={fileInputResetKey}
        type="file"
        id="reference_image"
        name="reference_image"
        accept="image/png, image/jpeg"
        disabled={disabled || !!evolveTarget}
        className="hidden"
        onChange={onFileChange}
      />

      {fileName && !disabled && !evolveTarget && (
        <div className="absolute top-2 right-2 z-20">
          <button
            type="button"
            className="cursor-pointer border border-(--graphite) bg-(--paper) px-2 py-1 text-xs font-bold text-(--red-pencil) transition-colors hover:text-red-700"
            onClick={onClearFile}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onClearFile(e);
            }}
          >
            × CLEAR
          </button>
        </div>
      )}

      <button
        type="button"
        disabled={disabled || !!evolveTarget}
        className={cn(
          "relative flex w-full cursor-pointer justify-center overflow-hidden border border-dashed",
          "border-(--pencil-gray) bg-transparent p-3.75 text-center text-xs tracking-[1px]",
          "text-(--pencil-gray) uppercase transition-all duration-200",
          "hover:border-solid hover:border-(--graphite) hover:bg-[rgba(28,28,26,0.03)] hover:text-(--graphite)",
          evolveTarget
            ? "cursor-not-allowed border-solid border-(--blueprint) bg-[rgba(42,92,139,0.05)] opacity-100 hover:border-(--blueprint)"
            : "disabled:opacity-50",
        )}
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
          <div className="relative flex h-30 w-full items-center justify-center">
            <img
              src={previewUrl}
              alt={fileName || "Reference Sketch"}
              className="max-h-30 max-w-full object-contain contrast-125 saturate-50"
            />
            <div className="absolute -bottom-3.75 bg-[rgba(28,28,26,0.8)] px-3 py-1 font-mono text-[0.6rem] text-(--paper)">
              {fileName}
            </div>
          </div>
        ) : (
          <span className="my-auto">
            {fileName ? `[ ${fileName} ]` : "[ Drop sketch file or click to attach ]"}
          </span>
        )}
      </button>
    </div>
  );
}

interface SubmitControlsProps {
  isPending: boolean;
  evolveTarget: EvolveTarget | null;
  onCancelEvolve: () => void;
}

export function SubmitControls({
  isPending,
  evolveTarget,
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
            "mb-3 w-full cursor-pointer border border-(--graphite) bg-transparent p-2",
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
          "relative w-full cursor-pointer overflow-hidden p-3 font-mono text-[0.85rem] font-semibold",
          "tracking-[2px] uppercase transition-all duration-200 active:translate-y-0.5 active:shadow-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          evolveTarget
            ? "border border-(--blueprint) bg-(--blueprint) text-(--paper) hover:bg-[#20496e] hover:shadow-[4px_4px_0px_rgba(42,92,139,0.2)]"
            : "border border-(--red-pencil) bg-(--red-pencil) text-(--paper) hover:bg-[#bd3124] hover:shadow-[4px_4px_0px_rgba(28,28,26,0.08)]",
        )}
      >
        {isPending
          ? "Forging..."
          : evolveTarget
            ? "EVOLVE BRANCH ➔"
            : "Initialize Render"}
      </button>
    </>
  );
}
