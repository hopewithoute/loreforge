import { SiblingDeck } from "./SiblingDeck";
import type { Asset } from "../../generator/types"; // Assuming Asset type is here

interface EvolutionTrackProps {
  lineage: Asset[][];
}

export function EvolutionTrack({ lineage }: EvolutionTrackProps) {
  if (lineage.length === 0 || lineage[0].length === 0) return null;
  const rootAsset = lineage[0][0];

  return (
    <div className="flex flex-col gap-5 w-full relative">
      {/* The thin dashed connecting line */}
      <div className="absolute top-[170px] left-0 w-full h-px border-t border-dashed border-[var(--pencil-gray)] z-0 hidden md:block" />

      <div className="text-[0.85rem] text-[var(--pencil-gray)] border-b border-[rgba(28,28,26,0.1)] pb-2 flex justify-between items-baseline">
        <span>Lineage // {rootAsset.prompt.substring(0, 30)}...</span>
        <span className="font-['Caveat',_cursive] text-[1.4rem] text-[var(--red-pencil)]">
          Gen {lineage.length}
        </span>
      </div>

      <div className="flex flex-row gap-[30px] overflow-x-auto pb-10 pt-2.5 px-2.5 md:pl-2.5 md:pr-5 snap-x snap-mandatory items-start w-full box-border relative z-10 horizontal-scrollbar">
        {lineage.map((siblingGroup, i) => (
          <div key={siblingGroup[0].id} className="flex flex-row gap-[30px] items-start shrink-0">
            {/* Sibling Deck (Solitaire style) */}
            <SiblingDeck siblings={siblingGroup} />
            
            {/* Evolution Arrow (between columns) */}
            {i < lineage.length - 1 && (
              <div className="text-[1.5rem] text-[var(--pencil-gray)] font-light shrink-0 mt-[135px] bg-[var(--paper)] px-[5px] hidden md:block">
                →
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
