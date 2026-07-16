/* eslint-disable */
// @ts-nocheck

export type AssetStyle = (typeof AssetStyle)[keyof typeof AssetStyle];

export const AssetStyle = {
  concept_art: "concept_art",
  isometric_rpg: "isometric_rpg",
  pixel_art: "pixel_art",
  dark_fantasy: "dark_fantasy",
} as const;
