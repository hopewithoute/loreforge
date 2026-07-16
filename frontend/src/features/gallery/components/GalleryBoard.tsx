import { useGallery } from "@/features/gallery/api/useGallery";
import { EvolutionTrack } from "./EvolutionTrack";
import type { Asset } from "@/features/generator/types";
import { Logo } from "@/components/Logo";

/**
 * Represents a node in the evolution tree, where a node is a group of sibling assets 
 * (assets that share the same parent or are root alternatives).
 */
export interface EvolutionNode {
  groupId: string; // Either sibling_id (if exists) or the asset's own id
  siblings: Asset[]; // All assets belonging to this group
  children: EvolutionNode[]; // Branches (evolutions) spawned from any sibling in this group
}

/**
 * Builds a recursive tree structure representing the evolution lineage.
 * 
 * @param root The root asset of this particular track (has no parent/sibling).
 * @param allItems The flat list of all assets fetched from the server.
 * @returns A hierarchical `EvolutionNode` tree where each node contains siblings and their children.
 */
function buildEvolutionTree(root: Asset, allItems: Asset[]): EvolutionNode {
  const siblingGroups = new Map<string, Asset[]>();
  
  // Group all assets by their sibling_id. If no sibling_id, the asset is its own group.
  allItems.forEach((asset) => {
    const groupId = asset.sibling_id || asset.id;
    if (!siblingGroups.has(groupId)) {
      siblingGroups.set(groupId, []);
    }
    siblingGroups.get(groupId)!.push(asset);
  });

  // The root node's group ID
  const rootGroupId = root.sibling_id || root.id;

  /**
   * Recursively constructs a node and attaches its children.
   */
  function buildNode(groupId: string): EvolutionNode {
    const siblings = siblingGroups.get(groupId) || [];
    const siblingIds = new Set(siblings.map((s) => s.id));

    // Find all assets in the database whose parent is ONE of the current siblings.
    const childGroups = new Set<string>();
    for (const asset of allItems) {
      if (asset.parent_id && siblingIds.has(asset.parent_id)) {
        // We only store the groupId to avoid duplicates (multiple siblings might spawn children in the same sibling group, though rare)
        childGroups.add(asset.sibling_id || asset.id);
      }
    }

    // Recursively build the child nodes
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
      <div className="flex flex-1 flex-col items-center justify-center p-10 pb-[15vh]">
        <Logo className="h-64 w-64 opacity-[0.04] brightness-0 grayscale" />
        <h2 className="mt-8 font-['Playfair_Display',serif] text-3xl text-(--graphite) italic opacity-60">
          The Forge is Cold.
        </h2>
        <p className="mt-4 font-sans text-sm tracking-[0.2em] text-(--pencil-gray) uppercase opacity-50">
          Enter a prompt in the station to strike the anvil
        </p>
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
