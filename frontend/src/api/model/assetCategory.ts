/* eslint-disable */
// @ts-nocheck

export type AssetCategory = (typeof AssetCategory)[keyof typeof AssetCategory];

export const AssetCategory = {
  environment: "environment",
  character: "character",
  prop: "prop",
} as const;
