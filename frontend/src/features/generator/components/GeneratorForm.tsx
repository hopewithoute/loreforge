import { CATEGORY_OPTIONS, STYLE_OPTIONS } from '../types';

interface GeneratorFormProps {
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
}

export function GeneratorForm({ onSubmit, isPending }: GeneratorFormProps) {
  const action = (formData: FormData) => {
    if (isPending) return;

    const prompt = formData.get('prompt') as string;
    const refImage = formData.get('reference_image') as File | null;

    if (!prompt.trim() && (!refImage || refImage.size === 0)) {
      alert("Please provide either a Core Prompt or a Reference Image (or both) to Forge.");
      return;
    }

    onSubmit(formData);
  };

  return (
    <form action={action} className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        {/* Category Field */}
        <div className="flex flex-col gap-2">
          <label htmlFor="category" className="text-xs font-mono text-ink-3 uppercase tracking-wider">
            Category
          </label>
          <div className="relative">
            <select
              name="category"
              id="category"
              required
              disabled={isPending}
              className="w-full appearance-none bg-paper-2 border border-ink-3/20 rounded-lg py-3 px-4 text-ink font-sans focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-colors disabled:opacity-50"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-ink-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        {/* Style Field */}
        <div className="flex flex-col gap-2">
          <label htmlFor="style" className="text-xs font-mono text-ink-3 uppercase tracking-wider">
            Style
          </label>
          <div className="relative">
            <select
              name="style"
              id="style"
              required
              disabled={isPending}
              className="w-full appearance-none bg-paper-2 border border-ink-3/20 rounded-lg py-3 px-4 text-ink font-sans focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-colors disabled:opacity-50"
            >
              {STYLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-ink-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Field */}
      <div className="flex flex-col gap-2">
        <label htmlFor="prompt" className="text-xs font-mono text-ink-3 uppercase tracking-wider">
          Core Prompt <span className="opacity-50">(Required if no image)</span>
        </label>
        <textarea
          name="prompt"
          id="prompt"
          disabled={isPending}
          placeholder="Describe your vision (e.g., A ruined monolithic temple in a dense foggy forest)"
          className="w-full h-32 resize-none bg-paper-2 border border-ink-3/20 rounded-lg py-4 px-4 text-ink font-sans focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-colors placeholder:text-ink-3/50 disabled:opacity-50"
        />
      </div>

      {/* Reference Image (Optional) */}
      <div className="flex flex-col gap-2">
        <label htmlFor="reference_image" className="text-xs font-mono text-ink-3 uppercase tracking-wider">
          Reference Image <span className="opacity-50">(Optional)</span>
        </label>
        <input
          type="file"
          name="reference_image"
          id="reference_image"
          accept="image/png, image/jpeg"
          disabled={isPending}
          className="w-full text-sm text-ink-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-paper-2 file:text-accent hover:file:bg-paper-2/80 focus:outline-none disabled:opacity-50"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className="mt-4 w-full relative group inline-flex items-center justify-center rounded-lg bg-accent/10 border border-accent/20 px-8 py-4 text-sm font-mono tracking-widest text-accent hover:bg-accent hover:text-paper transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent/10 disabled:hover:text-accent overflow-hidden"
      >
        <span className="relative z-10 flex items-center">
          {isPending ? '[ FORGING_ASSET... ]' : '[ INITIALIZE_FORGE ]'}
        </span>
      </button>
    </form>
  );
}
