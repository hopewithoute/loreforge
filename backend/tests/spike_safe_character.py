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

SAFE_PROMPTS = [
    "A wise elderly wizard, wearing flowing robes, holding a wooden staff",
    "A wise elderly wizard, wearing flowing robes, holding a glowing magical wooden staff",
    "A wise elderly wizard, wearing flowing robes, holding a glowing magical wooden staff, reading from an open spellbook",
]

EVOLVE_MODIFIER = "CRITICAL: Maintain exact identity, preserve original structural features, keep identical subject, consistent design, identical face and clothing."
STRENGTH = 0.70


async def main():
    config = Settings()
    adapter = CloudflareFluxAdapter(config)

    category = "character"
    style = "concept_art"

    cat_suffix = CATEGORY_MODIFIERS.get(category, "")
    style_suffix = STYLE_MODIFIERS.get(style, "")

    def assemble(modifier, user_input):
        parts = [user_input.strip()]
        if category:
            parts.append(f"{category.replace('_', ' ')} design")
        if style:
            parts.append(f"{style.replace('_', ' ')} game style")

        core = ", ".join(parts)
        full_prompt = f"{modifier} {core}. {cat_suffix}, {style_suffix}. Professional game asset, high quality, masterpiece."
        return full_prompt.strip()

    dir_path = Path(f"tests/matrix/{category}_{style}_safe")
    dir_path.mkdir(parents=True, exist_ok=True)

    # 1. Base
    print(f"[{category} | {style} (SAFE)] 1. Base")
    p1 = assemble("", SAFE_PROMPTS[0])
    try:
        r1 = await adapter.generate(prompt=p1)
        (dir_path / "01_base.png").write_bytes(r1.image_bytes)
        print(" -> Success!")
    except Exception as e:
        print(f" -> Failed: {e}")
        return

    # 2. Evolve 1
    print(f"[{category} | {style} (SAFE)] 2. Evolve 1")
    p2 = assemble(EVOLVE_MODIFIER, SAFE_PROMPTS[1])
    try:
        r2 = await adapter.generate(prompt=p2, reference_image_bytes=r1.image_bytes)
        (dir_path / "02_evolve_1.png").write_bytes(r2.image_bytes)
        print(" -> Success!")
    except Exception as e:
        print(f" -> Failed: {e}")
        return

    # 3. Evolve 2
    print(f"[{category} | {style} (SAFE)] 3. Evolve 2")
    p3 = assemble(EVOLVE_MODIFIER, SAFE_PROMPTS[2])
    try:
        r3 = await adapter.generate(prompt=p3, reference_image_bytes=r2.image_bytes)
        (dir_path / "03_evolve_2.png").write_bytes(r3.image_bytes)
        print(" -> Success!")
    except Exception as e:
        print(f" -> Failed: {e}")
        return


if __name__ == "__main__":
    asyncio.run(main())
