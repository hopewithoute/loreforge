import { useGallery } from "../api/useGallery";
import { EvolutionTrack } from "./EvolutionTrack";

export function GalleryBoard() {
  const { data: gallery, isLoading, error } = useGallery();

  if (isLoading) {
    return <div className="p-10 font-mono text-ink-3">Loading Vault...</div>;
  }

  if (error) {
    return <div className="p-10 font-mono text-red-500">Error loading gallery</div>;
  }

  const items = gallery || [];
  
  // A Track Root is an asset that is neither an evolution (no parent) nor a regeneration (no sibling)
  const trackRoots = items.filter(item => !item.parent_id && !item.sibling_id);
  
  return (
    <>
      {trackRoots.length === 0 ? (
        <div className="text-[var(--pencil-gray)] font-mono opacity-50 p-10">
          The canvas is empty. Initialize a render to begin.
        </div>
      ) : (
        trackRoots.map((root) => {
          const lineage: Asset[][] = [];
          
          // Step 1: Find all regenerations (siblings) of the root
          let currentSiblings = items.filter(
            item => item.id === root.id || item.sibling_id === root.id
          );
          // Sort siblings so the newest is at the top/first (since items are already sorted desc by API, this might be redundant but safe)
          lineage.push(currentSiblings);
          
          // Naive linked-list walk for evolutions
          while (true) {
            const currentSiblingIds = currentSiblings.map(s => s.id);
            // Find the next evolution step: an asset whose parent_id is in currentSiblingIds, AND is a new root (no sibling_id)
            const nextEvolutionRoot = items.find(
              item => item.parent_id && currentSiblingIds.includes(item.parent_id) && !item.sibling_id
            );
            
            if (nextEvolutionRoot) {
              const nextSiblings = items.filter(
                item => item.id === nextEvolutionRoot.id || item.sibling_id === nextEvolutionRoot.id
              );
              lineage.push(nextSiblings);
              currentSiblings = nextSiblings;
            } else {
              break;
            }
          }

          return (
            <EvolutionTrack 
              key={root.id} 
              lineage={lineage} 
            />
          );
        })
      )}
    </>
  );
}
