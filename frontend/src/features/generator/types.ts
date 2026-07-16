import type {
  AssetCategory,
  AssetStyle,
  AssetStatus,
  AssetRead as Asset,
} from "@/api/model";

export type { AssetCategory, AssetStyle, AssetStatus, Asset };

export type EvolveTarget = Pick<
  Asset,
  "id" | "prompt" | "category" | "style" | "generated_image_path" | "reference_image_path"
>;

export type GeneratorFormValues = {
  prompt: string;
  category: AssetCategory;
  style: AssetStyle;
  existing_reference_id: string;
  sibling_id: string;
  previewUrl: string | null;
  fileName: string | null;
  evolveTarget: EvolveTarget | null;
  fileInputResetKey: number;
  isLockedMode: boolean;
};

export const CATEGORY_OPTIONS: { value: AssetCategory; label: string }[] = [
  { value: "environment", label: "Environment" },
  { value: "character", label: "Character" },
  { value: "prop", label: "Prop / Artifact" },
];

export const STYLE_OPTIONS: { value: AssetStyle; label: string }[] = [
  { value: "concept_art", label: "Concept Art" },
  { value: "dark_fantasy", label: "Dark Fantasy" },
  { value: "isometric_rpg", label: "Isometric RPG" },
  { value: "pixel_art", label: "Pixel Art" },
];
