/* eslint-disable */
// @ts-nocheck
import type { AssetCategory } from "./assetCategory";
import type { AssetStyle } from "./assetStyle";

export interface AssetCreateForm {
  category: AssetCategory;
  style: AssetStyle;
  prompt?: string;
  reference_image?: Blob | null;
  existing_reference_id?: string | null;
  sibling_id?: string | null;
}
