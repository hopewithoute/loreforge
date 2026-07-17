import { useState, useEffect, useRef } from "react";
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
  serverError?: string | null;
}

export function GeneratorForm({ onSubmit, isPending, serverError }: GeneratorFormProps) {
  const { register, handleSubmit, setValue, watch, reset } =
    useFormContext<GeneratorFormValues>();

  const [localError, setLocalError] = useState<string | null>(null);

  const previewUrl = watch("previewUrl");
  const fileName = watch("fileName");
  const evolveTarget = watch("evolveTarget");
  const siblingId = watch("sibling_id");
  const watchCategory = watch("category");
  const watchStyle = watch("style");
  const isLockedMode = watch("isLockedMode");
  const referenceImage = watch("reference_image");

  const isFormLocked = !!evolveTarget || isLockedMode;

  const prevIsPending = useRef(isPending);

  useEffect(() => {
    if (prevIsPending.current && !isPending) {
      reset();
      setValue("isLockedMode", false);
    }
    prevIsPending.current = isPending;
  }, [isPending, reset, setValue]);

  useEffect(() => {
    if (referenceImage && referenceImage.length > 0) {
      const file = referenceImage[0];
      const objUrl = URL.createObjectURL(file);
      setValue("fileName", file.name);
      setValue("previewUrl", objUrl);
      setValue("existing_reference_id", "");
      setValue("isLockedMode", false);
      return () => URL.revokeObjectURL(objUrl);
    }
  }, [referenceImage, setValue]);

  // Assemble all fields into a single payload when user submits.
  // This function decides whether we are creating a fresh asset,
  // retrying with an existing reference, or evolving an existing asset.
  const onFormSubmit = (data: GeneratorFormValues) => {
    setLocalError(null);
    const refImage = data.reference_image?.[0];

    const hasPrompt = Boolean(data.prompt.trim());
    const hasUploadedImage = Boolean(refImage && refImage.size > 0);
    const hasExistingImage = Boolean(data.existing_reference_id || evolveTarget);

    if (!hasPrompt && !hasUploadedImage && !hasExistingImage) {
      setLocalError("Please provide either a Prompt or a Reference image.");
      return;
    }

    const payload: AssetCreateForm = {
      prompt: data.prompt,
      category: data.category,
      style: data.style,
    };

    if (data.existing_reference_id) {
      payload.existing_reference_id = data.existing_reference_id;
    }

    if (data.sibling_id) {
      payload.sibling_id = data.sibling_id;
    }

    if (refImage) {
      payload.reference_image = refImage;
    }

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
    setValue("reference_image", null);
    setValue("fileName", null);
    setValue("previewUrl", null);
    setValue("existing_reference_id", "");
    setValue("isLockedMode", false);
  };

  const { onChange: rhfOnChange, ...rhfRefProps } = register("reference_image");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    void rhfOnChange(e);
    if (!e.target.files || e.target.files.length === 0) {
      clearFileState();
    }
  };

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
        setValue("reference_image", e.dataTransfer.files);
      }
    }
  };

  const handleClearFile = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    clearFileState();
  };

  const handleCancelEvolve = () => {
    reset();
    setValue("isLockedMode", false);
  };

  return (
    <form id="generator-form" onSubmit={handleSubmit(onFormSubmit)}>
      <CategorySelector
        value={watchCategory}
        onChange={(cat) => setValue("category", cat)}
        disabled={isPending || isFormLocked}
        isLocked={isFormLocked}
      />

      <StyleSelector
        value={watchStyle}
        onChange={(style) => setValue("style", style)}
        disabled={isPending || isFormLocked}
        isLocked={isFormLocked}
      />

      <PromptField {...register("prompt")} disabled={isPending} />

      <ReferenceUpload
        {...rhfRefProps}
        fileName={fileName}
        previewUrl={previewUrl}
        evolveTarget={evolveTarget}
        disabled={isPending}
        onChange={handleFileChange}
        onClearFile={handleClearFile}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />

      <SubmitControls
        isPending={isPending}
        evolveTarget={evolveTarget}
        siblingId={siblingId}
        onCancelEvolve={handleCancelEvolve}
      />

      {(localError || serverError) && (
        <div className="mt-3 border border-(--red-pencil) bg-[rgba(189,49,36,0.05)] p-3 font-mono text-[0.75rem] text-(--red-pencil)">
          [Error] {localError || serverError}
        </div>
      )}
    </form>
  );
}
