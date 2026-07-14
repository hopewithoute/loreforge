import asyncio
from app.providers.cloudflare_flux import CloudflareFluxAdapter

async def main():
    adapter = CloudflareFluxAdapter()
    print(f"Testing Cloudflare FLUX Adapter with model {adapter.model}...")
    try:
        result = await adapter.generate(
            prompt="A dark fantasy concept art of a wandering knight, high quality",
            width=512,
            height=512
        )
        print(f"Success! Received {len(result.image_bytes)} bytes of image data.")
        with open("test_output.png", "wb") as f:
            f.write(result.image_bytes)
        print("Saved to test_output.png")
    except Exception as e:
        print(f"Error: {type(e).__name__} - {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
