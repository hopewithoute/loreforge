export type AssetCategory = 'environment' | 'character' | 'prop';
export type AssetStyle = 'concept_art' | 'isometric_rpg' | 'pixel_art' | 'dark_fantasy';
export type AssetStatus = 'pending' | 'success' | 'failed';

export interface Asset {
  id: string;
  category: AssetCategory;
  style: AssetStyle;
  prompt: string;
  status: AssetStatus;
  image_url: string | null;
  reference_image_url: string | null;
  parent_id: string | null;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export const CATEGORY_OPTIONS: { value: AssetCategory; label: string }[] = [
  { value: 'environment', label: 'Environment' },
  { value: 'character', label: 'Character' },
  { value: 'prop', label: 'Prop / Artifact' },
];

export const STYLE_OPTIONS: { value: AssetStyle; label: string }[] = [
  { value: 'concept_art', label: 'Concept Art' },
  { value: 'dark_fantasy', label: 'Dark Fantasy' },
  { value: 'isometric_rpg', label: 'Isometric RPG' },
  { value: 'pixel_art', label: 'Pixel Art' },
];
