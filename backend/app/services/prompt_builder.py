def build_prompt(category: str, style: str, user_prompt: str) -> str:
    """
    Translates structured domain inputs into a robust prompt for the image generation model.
    """
    formatted_category = category.replace("_", " ")
    formatted_style = style.replace("_", " ")

    # We construct a highly descriptive prompt tailored for game concept art
    return (
        f"A {formatted_style} concept art of a game {formatted_category}. "
        f"{user_prompt.strip()}. "
        "High quality, detailed, professional game asset design."
    )
