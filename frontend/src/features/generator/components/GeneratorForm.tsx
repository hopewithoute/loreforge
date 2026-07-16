import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { GeneratorFormValues } from "@/features/generator/types";
import {
  CategorySelector,
  StyleSelector,
  PromptField,
  ReferenceUpload,
  SubmitControls,
} from "./GeneratorFormFields";

import { type AssetCreateForm } from "@/api/model";

interface GeneratorFormProps {
  onSubmit: (payload: AssetCreateForm, evolveParentId?: string) => void;
  isPending: boolean;
}

const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
  e.preventDefault();
  e.stopPropagation();
};

const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
  e.preventDefault();
  e.stopPropagation();

  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    if (file.type.startsWith("image/")) {
      const fileInput = document.getElementById("reference_image") as HTMLInputElement;
      if (fileInput) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;

        const event = new Event("change", { bubbles: true });
        fileInput.dispatchEvent(event);
      }
    }
  }
};

export function GeneratorForm({ onSubmit, isPending }: GeneratorFormProps) {
  const { register, handleSubmit, setValue, watch, reset } =
    useFormContext<GeneratorFormValues>();

  const [localError, setLocalError] = useState<string | null>(null);

  const previewUrl = watch("previewUrl");
  const fileName = watch("fileName");
  const evolveTarget = watch("evolveTarget");
  const fileInputResetKey = watch("fileInputResetKey");
  const watchCategory = watch("category");
  const watchStyle = watch("style");

  // Assemble all fields into a single payload when user submits.
  // This function decides whether we are creating a fresh asset,
  // retrying with an existing reference, or evolving an existing asset.
  const onFormSubmit = (data: GeneratorFormValues) => {
    setLocalError(null);
    const fileInput = document.getElementById("reference_image") as HTMLInputElement;
    const refImage = fileInput?.files?.[0];

    if (
      !data.prompt.trim() &&
      (!refImage || refImage.size === 0) &&
      !data.existing_reference_id &&
      !evolveTarget
    ) {
      setLocalError(
        "Please provide either a Director's Notes (Prompt) or a Reference Sketch.",
      );
      return;
    }

    const payload: AssetCreateForm = {
      prompt: data.prompt,
      category: data.category,
      style: data.style,
    };

    if (data.existing_reference_id)
      payload.existing_reference_id = data.existing_reference_id;
    if (data.sibling_id) payload.sibling_id = data.sibling_id;
    if (refImage) payload.reference_image = refImage;

    // If an evolve target is active, we route to the Evolve API via the callback
    // and then clear the evolve state so the form resets.
    if (evolveTarget) {
      onSubmit(payload, evolveTarget.id);
      handleCancelEvolve();
    } else {
      onSubmit(payload);
    }
  };

  const clearFileState = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setValue("fileName", null);
    setValue("previewUrl", null);
    setValue("existing_reference_id", "");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const objUrl = URL.createObjectURL(file);
      setValue("fileName", file.name);
      setValue("previewUrl", objUrl);
      setValue("existing_reference_id", "");
    } else {
      clearFileState();
    }
  };

  const handleClearFile = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    clearFileState();
    setValue("fileInputResetKey", fileInputResetKey + 1);
  };

  const handleCancelEvolve = () => {
    reset();
    setValue("fileInputResetKey", fileInputResetKey + 1);
  };

  return (
    <form id="generator-form" onSubmit={handleSubmit(onFormSubmit)}>
      <CategorySelector
        value={watchCategory}
        onChange={(cat) => setValue("category", cat)}
        disabled={isPending || !!evolveTarget}
        isLocked={!!evolveTarget}
      />

      <StyleSelector
        value={watchStyle}
        onChange={(style) => setValue("style", style)}
        disabled={isPending || !!evolveTarget}
        isLocked={!!evolveTarget}
      />

      <PromptField {...register("prompt")} disabled={isPending} />

      <ReferenceUpload
        fileName={fileName}
        previewUrl={previewUrl}
        evolveTarget={evolveTarget}
        disabled={isPending}
        onFileChange={handleFileChange}
        onClearFile={handleClearFile}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        fileInputResetKey={fileInputResetKey}
      />

      {localError && (
        <div className="mb-2 border border-(--red-pencil) bg-[rgba(189,49,36,0.05)] p-2 text-center font-mono text-[0.75rem] text-(--red-pencil)">
          {localError}
        </div>
      )}

      <SubmitControls
        isPending={isPending}
        evolveTarget={evolveTarget}
        onCancelEvolve={handleCancelEvolve}
      />
    </form>
  );
}
