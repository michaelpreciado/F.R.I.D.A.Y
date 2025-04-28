import os
import httpx
import asyncio
from typing import AsyncGenerator, Optional

# Get environment variables
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Default voice ID

async def text_to_speech(text: str, voice_id: Optional[str] = None) -> AsyncGenerator[bytes, None]:
    """
    Convert text to speech using ElevenLabs API.
    
    Args:
        text: The text to convert to speech
        voice_id: Optional voice ID to use, defaults to ELEVENLABS_VOICE_ID env var
        
    Returns:
        AsyncGenerator yielding audio chunks
    """
    if not ELEVENLABS_API_KEY:
        raise ValueError("ELEVENLABS_API_KEY environment variable not set")
    
    voice_id = voice_id or ELEVENLABS_VOICE_ID
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"
    
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
    }
    
    data = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }
    
    async with httpx.AsyncClient() as client:
        async with client.stream("POST", url, json=data, headers=headers) as response:
            if response.status_code != 200:
                error_text = await response.aread()
                raise Exception(f"ElevenLabs API error: {response.status_code} - {error_text}")
            
            async for chunk in response.aiter_bytes():
                yield chunk
