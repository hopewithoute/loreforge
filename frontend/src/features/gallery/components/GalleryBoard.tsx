import { useGallery } from "@/features/gallery/api/useGallery";
import { EvolutionTrack } from "./EvolutionTrack";
import type { Asset } from "@/features/generator/types";

/**
 * Groups assets into generation tracks/lineages.
 * A lineage is a 2D array: each row represents a "generation step",
 * and contains an array of siblings (versions spawned from the same parent).
 */
function buildLineage(root: Asset, allItems: Asset[]): Asset[][] {
  const lineage: Asset[][] = [];

  // Step 1: Find the root asset and any of its direct siblings (retries/regens)
  let currentSiblings = allItems.filter(
    (item) => item.id === root.id || item.sibling_id === root.id,
  );
  lineage.push(currentSiblings);

  while (true) {
    const currentSiblingIds = new Set(currentSiblings.map((s) => s.id));

    // Step 2: Find the NEXT child that evolved from ANY of the current siblings.
    // We only take the first evolutionary root we find (LoreForge currently displays linear evolution tracks).
    const nextEvolutionRoot = allItems.find(
      (item) =>
        item.parent_id && currentSiblingIds.has(item.parent_id) && !item.sibling_id,
    );

    if (!nextEvolutionRoot) break;

    currentSiblings = allItems.filter(
      (item) =>
        item.id === nextEvolutionRoot.id || item.sibling_id === nextEvolutionRoot.id,
    );
    lineage.push(currentSiblings);
  }

  return lineage;
}

export function GalleryBoard() {
  const { data: gallery, isLoading, error } = useGallery();

  if (isLoading) return <div className="text-ink-3 p-10 font-mono">Loading Vault...</div>;
  if (error)
    return <div className="p-10 font-mono text-red-500">Error loading gallery</div>;

  const items = gallery || [];

  // A track root is an asset that started from scratch (no parent and no sibling).
  // These become the vertical columns in the Gallery.
  const trackRoots = items.filter((item) => !item.parent_id && !item.sibling_id);

  if (trackRoots.length === 0) {
    return (
      <div className="p-10 font-mono text-(--pencil-gray) opacity-50">
        The canvas is empty. Initialize a render to begin.
      </div>
    );
  }

  return (
    <>
      {trackRoots.map((root) => (
        <EvolutionTrack key={root.id} lineage={buildLineage(root, items)} />
      ))}
    </>
  );
}
