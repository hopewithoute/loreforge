STYLE_MODIFIERS = {
    "concept_art": "digital painting, highly detailed, professional portfolio showcase, masterpiece, clean lines, polished concept art",
    "dark_fantasy": "grimdark, gothic, dark fantasy, moody lighting, desaturated colors, intricate details, ominous atmosphere, dark medieval aesthetic",
    "isometric_rpg": "strict isometric projection, 3/4 orthographic view, video game asset, clean solid background, high-end 3D render, diorama",
    "pixel_art": "16-bit pixel art style, sprite sheet style, crisp pixels, retro video game graphics, limited color palette, clean background",
}

CATEGORY_MODIFIERS = {
    "environment": "expansive scenery, background design, architectural scale, immersive, dynamic lighting",
    "character": "full body character design, clear silhouette, expressive pose, detailed costume, character sheet",
    "prop": "single isolated object, game item, weapon or artifact design, studio lighting, center focus",
}


def build_prompt(
    category: str,
    style: str,
    user_prompt: str,
    has_reference: bool = False,
    is_evolve: bool = False,
) -> str:
    """
    Translates structured domain inputs into a robust prompt for the image generation model.
    """
    style_suffix = STYLE_MODIFIERS.get(style, "")
    cat_suffix = CATEGORY_MODIFIERS.get(category, "")

    # For FLUX.2 klein-4b on Workers AI, prompt engineering works best with a strict hierarchy:
    # Subject, Action, Style, Context. We must also explicitly reference image 0 if it is provided.
    instruction = ""
    if is_evolve:
        instruction = (
            "Using image 0 as the base structure and composition, apply these modifications: "
        )
    elif has_reference:
        instruction = (
            "Using image 0 as a rough sketch or structural guide, generate the following: "
        )

    return (
        f"{instruction}{user_prompt.strip()}. "
        f"Subject: A {category.replace('_', ' ')} game asset. "
        f"Style: {style.replace('_', ' ')} aesthetic. "
        f"Context & Details: {cat_suffix}, {style_suffix}. "
        "High quality, masterpiece, photorealistic or crisp rendering, highly detailed."
    )
