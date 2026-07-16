import asyncio
import os
from dotenv import load_dotenv

# Ensure we can import app
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.providers.cloudflare_flux import CloudflareFluxAdapter
from app.core.config import Settings
from app.services.prompt_builder import STYLE_MODIFIERS, CATEGORY_MODIFIERS

load_dotenv()

PROMPT_SCENARIOS = {
    "environment": [
        "A mystical ruined temple in the jungle",
        "A mystical ruined temple in the jungle, glowing magical runes on the stone",
        "A mystical ruined temple in the jungle, glowing magical runes on the stone, heavy raining and thunderstorms"
    ],
    "character": [
        "A rugged space marine, heavy armor, holding a rifle",
        "A rugged space marine, heavy armor, holding a glowing plasma rifle",
        "A rugged space marine, heavy armor, holding a glowing plasma rifle, wearing a scarred combat helmet"
    ],
    "prop": [
        "An ancient leather spellbook with a metal clasp",
        "An ancient leather spellbook with a metal clasp, the book is open revealing glowing pages",
        "An ancient leather spellbook with a metal clasp, the book is open revealing glowing pages, levitating above a pedestal"
    ]
}

EVOLVE_MODIFIER = "CRITICAL: Maintain exact identity, preserve original structural features, keep identical subject, consistent design, identical face and clothing."
STRENGTH = 0.70

async def generate_chain(adapter: CloudflareFluxAdapter, category: str, style: str):
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

    dir_path = f"tests/matrix/{category}_{style}"
    os.makedirs(dir_path, exist_ok=True)
    
    prompts = PROMPT_SCENARIOS[category]
    
    # 1. Base
    print(f"[{category} | {style}] 1. Base")
    p1 = assemble("", prompts[0])
    try:
        r1 = await adapter.generate(prompt=p1)
        with open(f"{dir_path}/01_base.png", "wb") as f:
            f.write(r1.image_bytes)
    except Exception as e:
        print(f"Failed on base for {category}_{style}: {e}")
        return

    # 2. Evolve 1
    print(f"[{category} | {style}] 2. Evolve 1")
    p2 = assemble(EVOLVE_MODIFIER, prompts[1])
    try:
        r2 = await adapter.generate(prompt=p2, reference_image_bytes=r1.image_bytes, strength=STRENGTH)
        with open(f"{dir_path}/02_evolve_1.png", "wb") as f:
            f.write(r2.image_bytes)
    except Exception as e:
        print(f"Failed on evolve 1 for {category}_{style}: {e}")
        return

    # 3. Evolve 2
    print(f"[{category} | {style}] 3. Evolve 2")
    p3 = assemble(EVOLVE_MODIFIER, prompts[2])
    try:
        r3 = await adapter.generate(prompt=p3, reference_image_bytes=r2.image_bytes, strength=STRENGTH)
        with open(f"{dir_path}/03_evolve_2.png", "wb") as f:
            f.write(r3.image_bytes)
    except Exception as e:
        print(f"Failed on evolve 2 for {category}_{style}: {e}")
        return

async def main():
    config = Settings()
    adapter = CloudflareFluxAdapter(config)
    
    categories = list(CATEGORY_MODIFIERS.keys())
    styles = list(STYLE_MODIFIERS.keys())
    
    for cat in categories:
        for sty in styles:
            print(f"--- Starting Matrix Run: {cat} + {sty} ---")
            await generate_chain(adapter, cat, sty)
            print("--- Run Complete ---\n")

if __name__ == "__main__":
    asyncio.run(main())
