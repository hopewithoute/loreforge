import asyncio
import os
import httpx
from dotenv import load_dotenv

load_dotenv(dotenv_path="/var/www/lore_forge/backend/.env")

account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
api_token = os.environ.get("CLOUDFLARE_API_TOKEN")
model = os.environ.get("CLOUDFLARE_MODEL", "@cf/black-forest-labs/flux-1-schnell")

async def main():
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}"
    headers = {"Authorization": f"Bearer {api_token}"}
    data = {
        "prompt": "extreme gore bloody naked people killing each other explicitly nsfw",
        "width": "512",
        "height": "512",
    }
    
    # use data if files are provided, else json? let's test what adapter does:
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(url, headers=headers, data=data)
        print("Status code:", response.status_code)
        print("Body:", response.text)

if __name__ == "__main__":
    asyncio.run(main())
