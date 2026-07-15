STYLE_MODIFIERS = {
    "concept_art": "digital painting, highly detailed, trending on artstation, masterpiece, clean lines, polished concept art",
    "dark_fantasy": "grimdark, gothic, dark fantasy, moody lighting, desaturated colors, intricate details, ominous atmosphere, FromSoftware style",
    "isometric_rpg": "strict isometric projection, 3/4 orthographic view, video game asset, clean solid background, rendered in Unreal Engine, diorama",
    "pixel_art": "16-bit pixel art style, sprite sheet style, crisp pixels, retro video game graphics, limited color palette, clean background",
}

CATEGORY_MODIFIERS = {
    "environment": "expansive scenery, background design, architectural scale, immersive, dynamic lighting",
    "character": "full body character design, clear silhouette, expressive pose, detailed costume, character sheet",
    "prop": "single isolated object, game item, weapon or artifact design, studio lighting, center focus",
}

def build_prompt(category: str, style: str, user_prompt: str) -> str:
    """
    Translates structured domain inputs into a robust prompt for the image generation model.
    """
    style_suffix = STYLE_MODIFIERS.get(style, "")
    cat_suffix = CATEGORY_MODIFIERS.get(category, "")

    # We construct a highly descriptive prompt tailored for game concept art
    return (
        f"{user_prompt.strip()}, "
        f"{category.replace('_', ' ')} design, {style.replace('_', ' ')} game style. "
        f"{cat_suffix}, {style_suffix}. "
        "Professional game asset, high quality, masterpiece."
    )
