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
  function buildNode(groupId: string, visited: Set<string>): EvolutionNode {
    if (visited.has(groupId)) {
      console.warn("Circular reference detected in evolution tree for group:", groupId);
      return { groupId, siblings: [], children: [] };
    }
    visited.add(groupId);

    const siblings = siblingGroups.get(groupId) || [];
    const siblingIds = new Set(siblings.map((s) => s.id));

    // Find all assets in the database whose parent is ONE of the current siblings.
    const childGroups = new Set<string>();
    for (const asset of allItems) {
      if (asset.parent_id && siblingIds.has(asset.parent_id)) {
        childGroups.add(asset.sibling_id || asset.id);
      }
    }

    // Recursively build the child nodes
    const children = Array.from(childGroups).map((childGroupId) =>
      buildNode(childGroupId, new Set(visited)),
    );

    return {
      groupId,
      siblings,
      children,
    };
  }

  return buildNode(rootGroupId, new Set());
}

export function GalleryBoard() {
  const { data: gallery, isLoading, error } = useGallery();

  if (isLoading) return <div className="text-ink-3 p-10 font-mono">Loading Vault...</div>;
  if (error)
    return <div className="p-10 font-mono text-red-500">Error loading gallery</div>;

  const items = gallery || [];

  // A track root is a sibling group that started from scratch (no parent).
  // If the original root asset was deleted, its siblings will still share the same sibling_id
  // and will not have a parent_id, so we group them together to form the track roots.
  const trackRootGroups = new Map<string, Asset>();
  items.forEach((item) => {
    if (!item.parent_id) {
      const groupId = item.sibling_id || item.id;
      if (!trackRootGroups.has(groupId)) {
        trackRootGroups.set(groupId, item);
      }
    }
  });
  const trackRoots = Array.from(trackRootGroups.values());

  if (trackRoots.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-10 pb-[15vh]">
        <Logo className="h-64 w-64 opacity-[0.04] brightness-0 grayscale" />
        <h2 className="mt-8 font-mono text-xl font-bold tracking-[2px] text-(--graphite) uppercase opacity-60">
          [ WORKSPACE_EMPTY ]
        </h2>
        <div className="mt-8 w-full max-w-md rounded-md border border-[rgba(15,23,42,0.1)] bg-[rgba(15,23,42,0.02)] p-5 font-mono text-xs text-(--graphite)">
          <p className="mb-4 border-b border-[rgba(15,23,42,0.1)] pb-2 font-bold tracking-[1px] uppercase">
            // Standard Operating Procedure
          </p>
          <ul className="flex flex-col gap-3 leading-relaxed opacity-80">
            <li>
              <span className="mr-2 font-bold text-(--blueprint)">01. DEFINE</span> Input
              target specifications in the parameters terminal.
            </li>
            <li>
              <span className="mr-2 font-bold text-(--blueprint)">02. CLASSIFY</span>{" "}
              Assign the correct asset category and visual style.
            </li>
            <li>
              <span className="mr-2 font-bold text-(--blueprint)">03. PROVIDE</span>{" "}
              (Optional) Attach a reference schematic or sketch.
            </li>
            <li>
              <span className="mr-2 font-bold text-(--blueprint)">04. EXECUTE</span> Click
              "INITIALIZE RENDER" to begin synthesis.
            </li>
          </ul>
        </div>
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
