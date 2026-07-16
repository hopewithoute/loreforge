import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { GalleryBoard, type EvolutionNode } from "./GalleryBoard";
import type { Asset } from "@/features/generator/types";

// Mock the API hook to return our custom flat list of assets
const mockUseGallery = vi.fn();
vi.mock("@/features/gallery/api/useGallery", () => ({
  useGallery: () => mockUseGallery() as unknown,
}));

// Mock EvolutionTrack so we can inspect the tree object it receives
vi.mock("./EvolutionTrack", () => ({
  EvolutionTrack: ({ tree }: { tree: unknown }) => (
    <div data-testid="mock-track">{JSON.stringify(tree, null, 2)}</div>
  ),
}));

const createAsset = (
  id: string,
  parent_id: string | null = null,
  sibling_id: string | null = null,
): Asset => ({
  id,
  parent_id,
  sibling_id,
  prompt: "Prompt",
  category: "character",
  style: "concept_art",
  status: "success",
  user_id: "user-123",
  created_at: new Date().toISOString(),
} as unknown as Asset);

describe("GalleryBoard - Tree Builder", () => {
  it("builds the correct evolution tree with siblings and children", () => {
    // 1. Root asset (A)
    const assetA = createAsset("A");

    // 2. Sibling of A (B) -> Shares same sibling_id as A (assuming A is the group leader)
    const assetB = createAsset("B", null, "A");

    // 3. Child of A (C)
    const assetC = createAsset("C", "A");

    // 4. Child of B (D) -> Belongs to the SAME child group as C if we group by sibling_id,
    // but let's make D its own new group spawned from B.
    const assetD = createAsset("D", "B");

    mockUseGallery.mockReturnValue({
      data: [assetA, assetB, assetC, assetD],
      isLoading: false,
      error: null,
    });

    render(<GalleryBoard />);

    // Since A and B are siblings, there is only 1 root track rendered
    const tracks = screen.getAllByTestId("mock-track");
    expect(tracks).toHaveLength(1);

    const tree = JSON.parse(tracks[0].textContent || "{}") as EvolutionNode;

    // Root node should contain A and B as siblings
    expect(tree.groupId).toBe("A");
    expect(tree.siblings.map((s: Asset) => s.id)).toEqual(["A", "B"]);

    // Root should have children (C and D)
    // Since C and D don't have a sibling_id linking them, they are separate branches
    expect(tree.children).toHaveLength(2);
    expect(tree.children[0].groupId).toBe("C");
    expect(tree.children[0].siblings[0].id).toBe("C");

    expect(tree.children[1].groupId).toBe("D");
    expect(tree.children[1].siblings[0].id).toBe("D");
  });
});
