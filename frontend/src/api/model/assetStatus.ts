/* eslint-disable */
// @ts-nocheck

export type AssetStatus = (typeof AssetStatus)[keyof typeof AssetStatus];

export const AssetStatus = {
  pending: "pending",
  success: "success",
  failed: "failed",
} as const;
