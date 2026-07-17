# ruff: noqa
import asyncio
import sys
from pathlib import Path

# Ensure we can import app
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import Settings
from app.providers.cloudflare_flux import CloudflareFluxAdapter
from app.services.prompt_builder import build_prompt

load_dotenv()


async def main():
    config = Settings()
    adapter = CloudflareFluxAdapter(config)

    base_user_prompt = "A tall 30-year-old knight, scar on left cheek, heavy tungsten armor with gold trims, sharp jawline"

    # 1. Base Image
    prompt1 = build_prompt(
        category="character", style="concept_art", user_prompt=base_user_prompt, is_evolve=False
    )
    print(f"Generating Image 1 (Base)...\nPrompt: {prompt1}\n")
    res1 = await adapter.generate(prompt=prompt1)
    Path("tests/img1_base.png").write_bytes(res1.image_bytes)
    print("Saved img1_base.png\n")

    # 2. Evolve 1: Add sword
    prompt2 = build_prompt(
        category="character",
        style="concept_art",
        user_prompt=f"{base_user_prompt}, holding a glowing blue energy sword",
        is_evolve=True,
    )
    print(f"Generating Image 2 (Evolve Sword)...\nPrompt: {prompt2}\n")
    res2 = await adapter.generate(
        prompt=prompt2,
        reference_image_bytes=res1.image_bytes,
    )
    Path("tests/img2_sword.png").write_bytes(res2.image_bytes)
    print("Saved img2_sword.png\n")

    # 3. Evolve 2: Add shield
    prompt3 = build_prompt(
        category="character",
        style="concept_art",
        user_prompt=f"{base_user_prompt}, holding a glowing blue energy sword and a massive spiked tower shield",
        is_evolve=True,
    )
    print(f"Generating Image 3 (Evolve Shield)...\nPrompt: {prompt3}\n")
    res3 = await adapter.generate(
        prompt=prompt3,
        reference_image_bytes=res2.image_bytes,
    )
    Path("tests/img3_shield.png").write_bytes(res3.image_bytes)
    print("Saved img3_shield.png\n")


if __name__ == "__main__":
    asyncio.run(main())
