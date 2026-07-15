import { useState, useRef, useEffect } from "react";
import { CATEGORY_OPTIONS, STYLE_OPTIONS } from "../types";

interface GeneratorFormProps {
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
}

export function GeneratorForm({ onSubmit, isPending }: GeneratorFormProps) {
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0].value);
  const [style, setStyle] = useState(STYLE_OPTIONS[0].value);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const form = document.getElementById("generator-form");
    if (!form) return;

    const handleRestore = (e: Event) => {
      const customEvent = e as CustomEvent<{ filename: string | null, url?: string | null }>;
      const detail = customEvent.detail;
      if (detail) {
        setFileName(detail.filename);
        
        // Always clear physical file input when restoring from a card
        const fileInput = document.getElementById("reference_image") as HTMLInputElement;
        if (fileInput) fileInput.value = "";

        if (detail.url) {
          setPreviewUrl(detail.url);
        } else {
          setPreviewUrl(null);
        }
      }
    };

    form.addEventListener("restore-reference", handleRestore);
    return () => form.removeEventListener("restore-reference", handleRestore);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);
    if (isPending) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // Ensure category and style are set from state
    formData.set("category", category);
    formData.set("style", style);

    const prompt = formData.get("prompt") as string;
    const refImage = formData.get("reference_image") as File | null;
    const hasExistingRef = !!formData.get("existing_reference_id");

    if (!prompt.trim() && (!refImage || refImage.size === 0) && !hasExistingRef) {
      setLocalError("Please provide either a Director's Notes (Prompt) or a Reference Sketch.");
      return;
    }

    onSubmit(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFileName(file.name);
      
      const objUrl = URL.createObjectURL(file);
      setPreviewUrl(objUrl);
      
      // Clear existing_reference_id because user uploaded a new physical file
      const hiddenInput = e.target.form?.querySelector('input[name="existing_reference_id"]') as HTMLInputElement;
      if (hiddenInput) {
        hiddenInput.value = "";
      }
    } else {
      setFileName(null);
      if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        // We manually trigger the change logic
        if (fileInputRef.current) {
          // Hack to set FileList
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInputRef.current.files = dataTransfer.files;
          
          // Trigger the React synthetic event manually
          const event = new Event('change', { bubbles: true });
          fileInputRef.current.dispatchEvent(event);
          setFileName(file.name);
          
          const objUrl = URL.createObjectURL(file);
          setPreviewUrl(objUrl);
          
          // Clear existing_reference_id because user uploaded a new physical file
          const hiddenInput = document.querySelector('input[name="existing_reference_id"]') as HTMLInputElement;
          if (hiddenInput) {
            hiddenInput.value = "";
          }
        }
      }
    }
  };

  const handleClearFile = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFileName(null);
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    const hiddenInput = document.getElementById("hidden_existing_ref") as HTMLInputElement;
    if (hiddenInput) hiddenInput.value = "";
    
    // We do NOT clear sibling_id here, because clearing the sketch doesn't mean it's not a sibling variation.
    // Sibling ID should only be cleared if we had a "Reset Form" button, but we don't.
  };

  return (
    <form id="generator-form" onSubmit={handleSubmit}>
      <input type="hidden" name="existing_reference_id" id="hidden_existing_ref" />
      <input type="hidden" name="sibling_id" id="hidden_sibling_id" />
      
      {/* Category Field */}
      <div className="form-group mb-6">
        <label htmlFor="category_group" className="block text-xs font-semibold uppercase tracking-[1px] mb-2.5 text-[var(--pencil-gray)]">
          Subject Category
        </label>
        <div id="category_group" className="flex gap-2 flex-wrap">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.value}
              data-category={opt.value}
              onClick={() => setCategory(opt.value)}
              disabled={isPending}
              className={`py-1.5 px-3 border border-[var(--graphite)] bg-transparent text-[var(--graphite)] font-mono text-xs cursor-pointer transition-all duration-200 hover:bg-[rgba(28,28,26,0.05)] disabled:opacity-50 ${
                category === opt.value ? "bg-[var(--graphite)]! text-[var(--paper)]!" : ""
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Style Field */}
      <div className="form-group mb-6">
        <label htmlFor="style_group" className="block text-xs font-semibold uppercase tracking-[1px] mb-2.5 text-[var(--pencil-gray)]">
          Art Style
        </label>
        <div id="style_group" className="flex gap-2 flex-wrap">
          {STYLE_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.value}
              data-style={opt.value}
              onClick={() => setStyle(opt.value)}
              disabled={isPending}
              className={`py-1.5 px-3 border border-[var(--graphite)] bg-transparent text-[var(--graphite)] font-mono text-xs cursor-pointer transition-all duration-200 hover:bg-[rgba(28,28,26,0.05)] disabled:opacity-50 ${
                style === opt.value ? "bg-[var(--blueprint)]! border-[var(--blueprint)]! text-[var(--paper)]!" : ""
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Field */}
      <div className="form-group mb-6">
        <label htmlFor="prompt" className="block text-xs font-semibold uppercase tracking-[1px] mb-2.5 text-[var(--pencil-gray)]">
          Director's Notes
        </label>
        <textarea
          id="prompt"
          name="prompt"
          disabled={isPending}
          placeholder="Describe the concept here..."
          className="w-full box-border p-3 border border-[var(--graphite)] bg-transparent font-['Caveat',_cursive] text-[1.4rem] leading-[1.2] text-[var(--blueprint)] resize-y min-h-[120px] transition-all duration-200 focus:outline-none focus:bg-[rgba(255,255,255,0.5)] focus:border-[var(--blueprint)] focus:shadow-[-4px_4px_0px_rgba(42,92,139,0.1)] disabled:opacity-50 custom-scrollbar"
        />
      </div>

      {/* Reference Image (Optional) */}
      <div className="form-group mb-6 relative">
        <label htmlFor="reference_image" className="block text-xs font-semibold uppercase tracking-[1px] mb-2.5 text-[var(--pencil-gray)]">
          Reference Sketch
        </label>
        <input
          type="file"
          id="reference_image"
          name="reference_image"
          accept="image/png, image/jpeg"
          disabled={isPending}
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        
        {/* We use a div click handler but it's not a button. For accessibility, we should add keyboard support, but this is MVP. */}
        {/* Disabling the jsx-a11y rules for this specific div because the user says "jangan pake eslint ignore", wait! I should not use eslint ignore! */}
        {fileName && !isPending && (
          <div className="absolute top-2 right-2 z-20">
            <button
              type="button"
              className="bg-[var(--paper)] text-[var(--red-pencil)] border border-[var(--graphite)] hover:text-red-700 cursor-pointer font-bold px-2 py-1 text-xs transition-colors"
              onClick={handleClearFile}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleClearFile(e);
                }
              }}
            >
              × CLEAR
            </button>
          </div>
        )}

        <button
          type="button"
          disabled={isPending}
          className="w-full border border-dashed border-[var(--pencil-gray)] p-[15px] text-center text-[var(--pencil-gray)] cursor-pointer text-xs uppercase tracking-[1px] transition-all duration-200 hover:border-solid hover:border-[var(--graphite)] hover:text-[var(--graphite)] hover:bg-[rgba(28,28,26,0.03)] bg-transparent flex justify-center disabled:opacity-50 relative overflow-hidden"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {previewUrl ? (
            <div className="relative w-full h-[120px] flex justify-center items-center">
              <img src={previewUrl} alt={fileName || "Reference Sketch"} className="max-h-[120px] max-w-full object-contain saturate-50 contrast-125" />
              <div className="absolute bottom-[-15px] bg-[rgba(28,28,26,0.8)] text-[var(--paper)] px-3 py-1 font-mono text-[0.6rem]">
                {fileName}
              </div>
            </div>
          ) : (
            <span className="my-auto">{fileName ? `[ ${fileName} ]` : "[ Drop sketch file or click to attach ]"}</span>
          )}
        </button>
      </div>

      {localError && (
        <div className="text-[var(--red-pencil)] text-[0.75rem] font-mono mb-2 text-center border border-[var(--red-pencil)] p-2 bg-[rgba(189,49,36,0.05)]">
          {localError}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full p-3 bg-[var(--red-pencil)] text-[var(--paper)] border border-[var(--red-pencil)] font-mono text-[0.85rem] font-semibold uppercase tracking-[2px] cursor-pointer mt-5 relative overflow-hidden transition-all duration-200 hover:bg-[#bd3124] hover:shadow-[4px_4px_0px_rgba(28,28,26,0.08)] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Forging..." : "Initialize Render"}
      </button>
    </form>
  );
}
