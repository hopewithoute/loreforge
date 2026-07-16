import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EvolutionTrack } from "./EvolutionTrack";
import type { EvolutionNode } from "./GalleryBoard";
import type { Asset } from "@/features/generator/types";

// Mock SiblingDeck to verify the isTrackPending prop passed to it
vi.mock("./SiblingDeck", () => ({
  SiblingDeck: ({
    isTrackPending,
    siblings,
  }: {
    isTrackPending: boolean;
    siblings: Asset[];
  }) => (
    <div data-testid={`mock-deck-${siblings[0].id}`} data-pending={isTrackPending}>
      Deck
    </div>
  ),
}));

// Mock scrolling since jsdom doesn't support real layout scrolling well
window.HTMLElement.prototype.scrollTo = vi.fn();

const createAsset = (id: string, status: string = "success"): Asset =>
  ({
    id,
    prompt: "Prompt",
    category: "character",
    style: "concept_art",
    status: status as Asset["status"],
    user_id: "user-123",
    created_at: new Date().toISOString(),
  }) as unknown as Asset;

describe("EvolutionTrack", () => {
  it("propagates isTrackPending=true to ALL descendants if ANY node is pending", () => {
    // Tree: Root(Success) -> Child(Success) -> Grandchild(Pending)
    const tree: EvolutionNode = {
      groupId: "root",
      siblings: [createAsset("root", "success")],
      children: [
        {
          groupId: "child",
          siblings: [createAsset("child", "success")],
          children: [
            {
              groupId: "grandchild",
              siblings: [createAsset("grandchild", "pending")],
              children: [],
            },
          ],
        },
      ],
    };

    render(<EvolutionTrack tree={tree} />);

    // ALL decks in the track must receive isTrackPending=true
    expect(screen.getByTestId("mock-deck-root")).toHaveAttribute("data-pending", "true");
    expect(screen.getByTestId("mock-deck-child")).toHaveAttribute("data-pending", "true");
    expect(screen.getByTestId("mock-deck-grandchild")).toHaveAttribute(
      "data-pending",
      "true",
    );
  });

  it("propagates isTrackPending=false if NO nodes are pending", () => {
    const tree: EvolutionNode = {
      groupId: "root",
      siblings: [createAsset("root", "success")],
      children: [
        {
          groupId: "child",
          siblings: [createAsset("child", "success")],
          children: [],
        },
      ],
    };

    render(<EvolutionTrack tree={tree} />);

    // Decks should receive isTrackPending=false
    expect(screen.getByTestId("mock-deck-root")).toHaveAttribute("data-pending", "false");
    expect(screen.getByTestId("mock-deck-child")).toHaveAttribute(
      "data-pending",
      "false",
    );
  });
});
