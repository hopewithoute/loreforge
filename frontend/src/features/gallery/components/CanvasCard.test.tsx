import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CanvasCard } from "./CanvasCard";
import type { Asset } from "@/features/generator/types";

// --- Mocking Dependencies ---
const mockDeleteMutate = vi.fn();
const mockConfirm = vi.fn();

vi.mock("@/features/generator/api/useAssetStatus", () => ({
  useAssetStatus: () => ({ data: undefined }),
}));
vi.mock("@/features/generator/api/useRetryAsset", () => ({
  useRetryAsset: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/features/generator/api/useDeleteAsset", () => ({
  useDeleteAsset: () => ({ mutate: mockDeleteMutate, isPending: false }),
}));
vi.mock("@/app/ConfirmContext", () => ({
  useConfirm: () => mockConfirm,
}));
const mockOpenLightbox = vi.fn();
vi.mock("./LightboxContext", () => ({
  useLightbox: () => ({ openLightbox: mockOpenLightbox, closeLightbox: vi.fn() }),
}));
vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
  getMediaUrl: (path: string) => path,
  extractError: () => "Error",
}));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
const mockSetValue = vi.fn();
vi.mock("react-hook-form", () => ({
  useFormContext: () => ({ setValue: mockSetValue }),
}));

// Dummy Asset factory
const createAsset = (overrides?: Partial<Asset>): Asset =>
  ({
    id: "asset-123",
    prompt: "A cool test prompt",
    category: "character",
    style: "concept_art",
    status: "success",
    user_id: "user-123",
    created_at: new Date().toISOString(),
    ...overrides,
  }) as unknown as Asset;

describe("CanvasCard - Lineage Lockdown (Ground Truth)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should NOT disable the Prune (Delete) button if the track is NOT pending", () => {
    const asset = createAsset({ status: "success" });
    render(<CanvasCard asset={asset} isTrackPending={false} />);

    // The Prune button should be enabled
    const pruneButton = screen.getByTitle(/Prune/i);
    expect(pruneButton).not.toBeDisabled();
  });

  it("should DISABLE the Prune (Delete) button if the entire track is locked (isTrackPending=true)", () => {
    // Even if this specific asset is "success", if the track is pending (a relative is generating),
    // it must be locked to prevent breaking the lineage tree.
    const asset = createAsset({ status: "success" });
    render(<CanvasCard asset={asset} isTrackPending={true} />);

    // The Prune button MUST be disabled
    const pruneButton = screen.getByTitle(/Prune/i);
    expect(pruneButton).toBeDisabled();
  });

  it("should inject data back to generator panel when Regen is clicked", () => {
    const asset = createAsset({
      prompt: "Test Inject Prompt",
      category: "character",
      style: "pixel_art",
      status: "success",
    });

    render(<CanvasCard asset={asset} isTrackPending={false} />);

    // Click Regen button
    const regenButton = screen.getByRole("button", { name: /REGEN/i });
    regenButton.click();

    // Verify it called setValue from useFormContext with the right data
    expect(mockSetValue).toHaveBeenCalledWith("prompt", "Test Inject Prompt");
    expect(mockSetValue).toHaveBeenCalledWith("category", "character");
    expect(mockSetValue).toHaveBeenCalledWith("style", "pixel_art");
  });

  it("should trigger confirm dialog and delete when Prune is clicked and confirmed", async () => {
    const asset = createAsset({ id: "asset-456", status: "success" });

    // Mock the confirm function to resolve to true (user clicks "Continue")
    mockConfirm.mockResolvedValueOnce(true);

    render(<CanvasCard asset={asset} isTrackPending={false} />);

    // Click Prune
    const pruneButton = screen.getByTitle(/Prune/i);
    pruneButton.click();

    // Wait for the async confirm check and mutation call
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockDeleteMutate).toHaveBeenCalledWith({ assetId: "asset-456" });
  });

  it("should open lightbox when image is clicked on a success asset", () => {
    const asset = createAsset({
      prompt: "Lightbox Test",
      generated_image_path: "/test-image.png",
      status: "success",
    });

    render(<CanvasCard asset={asset} isTrackPending={false} />);

    // The wrapper has role="button" but we can just click the image inside it, the event will bubble.
    const image = screen.getByAltText("Lightbox Test");
    image.click();

    expect(mockOpenLightbox).toHaveBeenCalledWith("/test-image.png", "Lightbox Test");
  });

  it("should trigger Evolve mode when EVOLVE button is clicked", () => {
    const asset = createAsset({ prompt: "A normal prompt", status: "success" });
    render(<CanvasCard asset={asset} isTrackPending={false} />);

    const evolveButton = screen.getByRole("button", { name: /EVOLVE/i });
    evolveButton.click();

    expect(mockSetValue).toHaveBeenCalledWith("evolveTarget", asset);
    expect(mockSetValue).toHaveBeenCalledWith("fileName", "[ Evolving Parent ]");
  });

  it("should show error UI and RETRY buttons when status is failed", () => {
    const asset = createAsset({
      status: "failed",
      error_code: "CUDA_OUT_OF_MEMORY",
      error_message: "VRAM exploded",
    });
    render(<CanvasCard asset={asset} isTrackPending={false} />);

    expect(screen.getByText("CUDA_OUT_OF_MEMORY")).toBeInTheDocument();
    expect(screen.getByText("VRAM exploded")).toBeInTheDocument();

    const retryRenderButton = screen.getByRole("button", { name: /RETRY RENDER/i });
    const retryFormButton = screen.getByRole("button", { name: /^RETRY$/i });

    expect(retryRenderButton).toBeInTheDocument();
    expect(retryFormButton).toBeInTheDocument();
  });
});
