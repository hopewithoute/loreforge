# ruff: noqa
import asyncio
import sys
from pathlib import Path

from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import Settings
from app.providers.cloudflare_flux import CloudflareFluxAdapter
from app.services.prompt_builder import CATEGORY_MODIFIERS, STYLE_MODIFIERS

load_dotenv()

PREFIXES = {
    "P1_Rigid": "CRITICAL: Maintain exact identity, preserve original structural features, keep identical subject, consistent design, identical face and clothing.",
    "P2_Narrative": "The exact same subject returning, identical appearance.",
    "P3_None": "",
}

STRENGTHS = [0.70, 0.75, 0.80, 0.85]


async def main():
    config = Settings()
    adapter = CloudflareFluxAdapter(config)

    category = "character"
    style = "concept_art"

    cat_suffix = CATEGORY_MODIFIERS.get(category, "")
    style_suffix = STYLE_MODIFIERS.get(style, "")

    # Read the base image (Wizard holding staff)
    base_path = Path("tests/matrix/character_concept_art_safe/01_base.png")
    base_bytes = base_path.read_bytes()

    out_dir = Path("tests/matrix/spellbook_test")
    out_dir.mkdir(parents=True, exist_ok=True)

    user_prompt = "A wise elderly wizard, wearing flowing robes, holding a glowing magical wooden staff, reading from an open spellbook"

    def assemble(modifier, user_input):
        parts = [user_input.strip()]
        if category:
            parts.append(f"{category.replace('_', ' ')} design")
        if style:
            parts.append(f"{style.replace('_', ' ')} game style")

        core = ", ".join(parts)
        full_prompt = f"{modifier} {core}. {cat_suffix}, {style_suffix}. Professional game asset, high quality, masterpiece."
        return full_prompt.strip()

    for p_name, prefix in PREFIXES.items():
        for strength in STRENGTHS:
            print(f"Testing {p_name} @ {strength}...")
            prompt = assemble(prefix, user_prompt)

            try:
                res = await adapter.generate(
                    prompt=prompt, reference_image_bytes=base_bytes, strength=strength
                )
                filename = f"{out_dir}/{p_name}_s{str(strength).replace('.', '')}.png"
                Path(filename).write_bytes(res.image_bytes)
                print(f" -> Saved {filename}")
            except Exception as e:
                print(f" -> Failed: {e}")


if __name__ == "__main__":
    asyncio.run(main())
