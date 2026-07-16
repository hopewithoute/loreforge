import { useGallery } from "@/features/gallery/api/useGallery";
import { EvolutionTrack } from "./EvolutionTrack";
import type { Asset } from "@/features/generator/types";

export interface EvolutionNode {
  groupId: string;
  siblings: Asset[];
  children: EvolutionNode[];
}

function buildEvolutionTree(root: Asset, allItems: Asset[]): EvolutionNode {
  const siblingGroups = new Map<string, Asset[]>();
  allItems.forEach((asset) => {
    const groupId = asset.sibling_id || asset.id;
    if (!siblingGroups.has(groupId)) {
      siblingGroups.set(groupId, []);
    }
    siblingGroups.get(groupId)!.push(asset);
  });

  const rootGroupId = root.sibling_id || root.id;

  function buildNode(groupId: string): EvolutionNode {
    const siblings = siblingGroups.get(groupId) || [];
    const siblingIds = new Set(siblings.map((s) => s.id));

    const childGroups = new Set<string>();
    for (const asset of allItems) {
      if (asset.parent_id && siblingIds.has(asset.parent_id)) {
        childGroups.add(asset.sibling_id || asset.id);
      }
    }

    const children = Array.from(childGroups).map((childGroupId) =>
      buildNode(childGroupId),
    );

    return {
      groupId,
      siblings,
      children,
    };
  }

  return buildNode(rootGroupId);
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
        <EvolutionTrack key={root.id} tree={buildEvolutionTree(root, items)} />
      ))}
    </>
  );
}
