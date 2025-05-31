from fastapi import FastAPI, Request, Response, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import httpx
import os
import json
import sys
import asyncio
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

# Add common directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common.tts import text_to_speech
from common.rag import get_rag_context

app = FastAPI(title="DeepSeek HUD Agent - Local Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Get environment variables
MODEL_TAG = os.getenv("MODEL_TAG", "deepseek-r1:7b")
PERSONALITY_SYSTEM_PROMPT = os.getenv("PERSONALITY_SYSTEM_PROMPT", "You are a helpful AI assistant.")
OLLAMA_BASE_URL = "http://127.0.0.1:11434/api"
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
GOOGLE_CSE_ID = os.getenv("GOOGLE_CSE_ID", "")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")

# Chat message models
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[Message] = []
    use_rag: bool = False

class SpeakRequest(BaseModel):
    text: str

class WeatherRequest(BaseModel):
    latitude: float
    longitude: float

async def stream_ollama_response(prompt: str):
    """Stream response from Ollama API."""
    async with httpx.AsyncClient() as client:
        data = {
            "model": MODEL_TAG,
            "prompt": prompt,
            "stream": True
        }
        
        async with client.stream("POST", f"{OLLAMA_BASE_URL}/generate", json=data, timeout=60.0) as response:
            if response.status_code != 200:
                yield f"data: {json.dumps({'error': f'Ollama API error: {response.status_code}'})}\n\n"
                return
                
            async for line in response.aiter_lines():
                if not line.strip():
                    continue
                    
                try:
                    chunk = json.loads(line)
                    if "response" in chunk:
                        yield f"data: {json.dumps({'text': chunk['response']})}\n\n"
                    
                    # Check if this is the final response
                    if chunk.get("done", False):
                        yield f"data: [DONE]\n\n"
                        break
                except json.JSONDecodeError:
                    yield f"data: {json.dumps({'error': 'Failed to parse Ollama response'})}\n\n"

@app.post("/chat")
async def chat(request: ChatRequest):
    """Chat endpoint that streams responses from Ollama."""
    # Build the prompt with history
    conversation = []
    for msg in request.history:
        conversation.append(f"{msg.role.upper()}: {msg.content}")
    
    # Get RAG context if enabled
    rag_context = ""
    if request.use_rag:
        rag_context = await get_rag_context(request.message)
        if rag_context:
            rag_context = f"RELEVANT CONTEXT:\n{rag_context}\n\n"
    
    # Construct the final prompt
    prompt = f"{PERSONALITY_SYSTEM_PROMPT}\n\n{rag_context}{''.join(conversation)}\nUSER: {request.message}\nASSISTANT:"
    
    return StreamingResponse(
        stream_ollama_response(prompt),
        media_type="text/event-stream"
    )

@app.post("/speak")
async def speak(request: SpeakRequest):
    """Convert text to speech using ElevenLabs."""
    audio_stream = await text_to_speech(request.text)
    return StreamingResponse(
        audio_stream,
        media_type="audio/mpeg"
    )

@app.post("/transcribe")
async def transcribe(request: Request):
    """Transcribe audio using Whisper."""
    # This is a placeholder for the Whisper implementation
    # In a real implementation, you would:
    # 1. Read the audio data from the request
    # 2. Save it to a temporary file
    # 3. Run Whisper on it
    # 4. Return the transcription
    
    # For now, return a mock response
    return {"text": "This is a placeholder for the transcription service."}

@app.post("/rag/upload")
async def upload_document(request: Request):
    """Upload a document for RAG."""
    # Placeholder for document upload
    return {"status": "success", "message": "Document uploaded successfully"}

@app.get("/rag/query")
async def query_rag(query: str):
    """Query the RAG system."""
    # Placeholder for RAG query
    context = await get_rag_context(query)
    return {"context": context}

@app.get("/search")
async def web_search(query: str):
    """Perform Google Custom Search and return top results."""
    if not GOOGLE_API_KEY or not GOOGLE_CSE_ID:
        # Provide a helpful fallback response when API keys are not configured
        return {
            "results": [
                {
                    "title": "Search API Not Configured",
                    "snippet": "To enable web search functionality, please configure GOOGLE_API_KEY and GOOGLE_CSE_ID environment variables. You can get these from the Google Cloud Console by setting up a Custom Search Engine.",
                    "link": "https://developers.google.com/custom-search/v1/overview"
                },
                {
                    "title": "Alternative: Ask F.R.I.D.A.Y Directly",
                    "snippet": f"You can ask F.R.I.D.A.Y about '{query}' directly in the chat. F.R.I.D.A.Y has knowledge that can help answer your questions without requiring web search.",
                    "link": "#"
                }
            ]
        }
    
    try:
        url = "https://www.googleapis.com/customsearch/v1"
        params = {"key": GOOGLE_API_KEY, "cx": GOOGLE_CSE_ID, "q": query}
        
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
        
        items = data.get("items", [])[:3]
        results = [{"title": i.get("title"), "snippet": i.get("snippet"), "link": i.get("link")} for i in items]
        return {"results": results}
    
    except Exception as e:
        # Fallback for any API errors
        return {
            "results": [
                {
                    "title": "Search Temporarily Unavailable",
                    "snippet": f"Web search encountered an error: {str(e)}. Please try asking F.R.I.D.A.Y directly in the chat.",
                    "link": "#"
                }
            ]
        }

@app.post("/weather")
async def get_weather(request: WeatherRequest):
    """Get weather data for the provided coordinates."""
    if not OPENWEATHER_API_KEY:
        # Return demo weather data when API key is not configured
        return {
            "temperature": 22,
            "condition": "partly cloudy",
            "icon": "02d",
            "location": "Demo Location",
            "humidity": 65,
            "windSpeed": 3.2,
            "demo": True
        }
    
    try:
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            "lat": request.latitude,
            "lon": request.longitude,
            "appid": OPENWEATHER_API_KEY,
            "units": "metric"
        }
        
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
        
        return {
            "temperature": round(data["main"]["temp"]),
            "condition": data["weather"][0]["description"],
            "icon": data["weather"][0]["icon"],
            "location": data["name"],
            "humidity": data["main"]["humidity"],
            "windSpeed": data["wind"]["speed"],
            "demo": False
        }
    
    except Exception as e:
        # Fallback to demo data on API errors
        return {
            "temperature": 22,
            "condition": "partly cloudy",
            "icon": "02d",
            "location": f"Location ({request.latitude:.1f}, {request.longitude:.1f})",
            "humidity": 65,
            "windSpeed": 3.2,
            "demo": True,
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
