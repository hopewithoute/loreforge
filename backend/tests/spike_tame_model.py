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

async def main():
    config = Settings()
    adapter = CloudflareFluxAdapter(config)
    
    category = "character"
    style = "dark_fantasy"
    base_user_prompt = "A female elven rogue, green hooded cloak, leather armor, sharp eyes, standing in an alleyway"
    
    style_suffix = STYLE_MODIFIERS.get(style, "")
    cat_suffix = CATEGORY_MODIFIERS.get(category, "")
    
    def assemble(modifier, user_input):
        return f"{modifier} {user_input}, {category.replace('_', ' ')} design, {style.replace('_', ' ')} game style. {cat_suffix}, {style_suffix}. Professional game asset, high quality, masterpiece."
    
    # 1. Base Image
    print("=== Generating Base Image ===")
    prompt_base = assemble("", base_user_prompt)
    res_base = await adapter.generate(prompt=prompt_base)
    with open("tests/tame_base.png", "wb") as f:
        f.write(res_base.image_bytes)
    print("Saved tame_base.png\n")

    user_input_evolve = f"{base_user_prompt}, holding two glowing purple daggers"

    # Test A: Low Strength, Structural Modifier
    print("=== Test A: Low Strength (0.55), Structural Prefix ===")
    mod_a = "CRITICAL: Maintain exact identity, preserve original structural features, keep identical subject, consistent design, identical face and clothing."
    res_a = await adapter.generate(
        prompt=assemble(mod_a, user_input_evolve),
        reference_image_bytes=res_base.image_bytes,
        strength=0.55
    )
    with open("tests/tame_A_low_str.png", "wb") as f:
        f.write(res_a.image_bytes)
    print("Saved tame_A_low_str.png\n")

    # Test B: Medium Strength (Our current default), Structural Prefix
    print("=== Test B: Medium Strength (0.70), Structural Prefix ===")
    mod_b = mod_a
    res_b = await adapter.generate(
        prompt=assemble(mod_b, user_input_evolve),
        reference_image_bytes=res_base.image_bytes,
        strength=0.70
    )
    with open("tests/tame_B_med_str.png", "wb") as f:
        f.write(res_b.image_bytes)
    print("Saved tame_B_med_str.png\n")

    # Test C: High Strength (0.85), Structural Prefix
    print("=== Test C: High Strength (0.85), Structural Prefix ===")
    mod_c = mod_a
    res_c = await adapter.generate(
        prompt=assemble(mod_c, user_input_evolve),
        reference_image_bytes=res_base.image_bytes,
        strength=0.85
    )
    with open("tests/tame_C_high_str.png", "wb") as f:
        f.write(res_c.image_bytes)
    print("Saved tame_C_high_str.png\n")

    # Test D: Medium Strength (0.70), Soft Narrative Prefix
    print("=== Test D: Medium Strength (0.70), Soft Narrative Prefix ===")
    mod_d = "The exact same character returning, identical appearance:"
    res_d = await adapter.generate(
        prompt=assemble(mod_d, user_input_evolve),
        reference_image_bytes=res_base.image_bytes,
        strength=0.70
    )
    with open("tests/tame_D_soft_prompt.png", "wb") as f:
        f.write(res_d.image_bytes)
    print("Saved tame_D_soft_prompt.png\n")

if __name__ == "__main__":
    asyncio.run(main())
