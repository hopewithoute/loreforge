/* eslint-disable */
// @ts-nocheck
import type { AssetCategory } from "./assetCategory";
import type { AssetStyle } from "./assetStyle";

export interface AssetEvolve {
  /** @minLength 3 */
  prompt: string;
  category: AssetCategory;
  style: AssetStyle;
}
