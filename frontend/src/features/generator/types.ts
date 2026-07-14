import { components } from '../../shared/api/schema';

export type AssetCategory = components['schemas']['AssetCategory'];
export type AssetStyle = components['schemas']['AssetStyle'];
export type AssetStatus = components['schemas']['AssetStatus'];
export type Asset = components['schemas']['AssetRead'];

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
