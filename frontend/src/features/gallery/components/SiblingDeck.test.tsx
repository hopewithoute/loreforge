import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SiblingDeck } from "./SiblingDeck";
import type { Asset } from "@/features/generator/types";

// Mock CanvasCard to avoid dealing with its complex dependencies in this test
vi.mock("./CanvasCard", () => ({
  CanvasCard: ({ asset }: { asset: Asset }) => (
    <div data-testid={`mock-canvas-${asset.id}`}>{asset.prompt}</div>
  ),
}));

const createAsset = (id: string, prompt: string): Asset => ({
  id,
  prompt,
  category: "character",
  style: "concept_art",
  status: "success",
  user_id: "user-123",
  created_at: new Date().toISOString(),
} as unknown as Asset);

describe("SiblingDeck", () => {
  it("does not render pagination arrows if there is only 1 sibling", () => {
    const siblings = [createAsset("1", "Only sibling")];
    render(<SiblingDeck siblings={siblings} />);

    expect(screen.getByTestId("mock-canvas-1")).toBeInTheDocument();

    // Pagination buttons should not exist
    expect(screen.queryByText(/OLDER/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/NEWER/i)).not.toBeInTheDocument();
  });

  it("paginates through siblings correctly when arrows are clicked", () => {
    const siblings = [
      createAsset("1", "First"),
      createAsset("2", "Second"),
      createAsset("3", "Third"),
    ];
    render(<SiblingDeck siblings={siblings} />);

    // Click OLDER (goes to i + 1)
    fireEvent.click(screen.getByText(/OLDER/i));
    expect(screen.getByTestId("mock-canvas-2")).toBeInTheDocument();

    // Click OLDER again
    fireEvent.click(screen.getByText(/OLDER/i));
    expect(screen.getByTestId("mock-canvas-3")).toBeInTheDocument();

    // Click OLDER again (cycles back to first)
    fireEvent.click(screen.getByText(/OLDER/i));
    expect(screen.getByTestId("mock-canvas-1")).toBeInTheDocument();

    // Click NEWER (goes to last)
    fireEvent.click(screen.getByText(/NEWER/i));
    expect(screen.getByTestId("mock-canvas-3")).toBeInTheDocument();
  });
});
