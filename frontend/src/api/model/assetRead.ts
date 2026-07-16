/* eslint-disable */
// @ts-nocheck
import type { AssetCategory } from "./assetCategory";
import type { AssetStatus } from "./assetStatus";
import type { AssetStyle } from "./assetStyle";

export interface AssetRead {
  id: string;
  user_id: string;
  category: AssetCategory;
  style: AssetStyle;
  prompt: string;
  reference_image_path: string | null;
  prepared_input_path: string | null;
  generated_image_path: string | null;
  parent_id: string | null;
  sibling_id: string | null;
  status: AssetStatus;
  error_code: string | null;
  error_message: string | null;
  provider_name: string | null;
  provider_model: string | null;
  seed: number | null;
  created_at: string;
  updated_at: string;
}
