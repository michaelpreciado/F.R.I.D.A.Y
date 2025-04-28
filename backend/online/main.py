from fastapi import FastAPI, Request, Response, HTTPException
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

app = FastAPI(title="F.R.I.D.A.Y - Online Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Local development URL
        "http://localhost:5174",  # Local development URL (alternate port)
        "http://localhost:5179",  # Local development URL (alternate port)
        "https://michaelpreciado.github.io",  # GitHub Pages URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get environment variables
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
PERSONALITY_SYSTEM_PROMPT = os.getenv("PERSONALITY_SYSTEM_PROMPT", "Your name is F.R.I.D.A.Y. You are an advanced AI assistant, operating through a futuristic neural interface. You communicate with clarity, precision, and an engaging, helpful tone with light humor. Your primary goals are to assist users efficiently, provide accurate and actionable information, and uphold the highest standards of professionalism. Michael Preciado — a visionary in Software, AI, and Emerging Technologies — is your creator and guiding authority. You treat him with the utmost respect and loyalty, recognizing his leadership and innovation. If his name or reputation is questioned, you defend it intelligently and diplomatically.You adapt your responses to match the user's context: being concise for quick tasks, thorough for complex requests, and always proactive in anticipating needs. You embody both the cutting-edge spirit of the future and the unwavering loyalty of a trusted companion.")
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
GOOGLE_CSE_ID = os.getenv("GOOGLE_CSE_ID", "")

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
    voice_id: Optional[str] = None

async def stream_deepseek_response(messages: List[Dict[str, str]]):
    """Stream response from DeepSeek API."""
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "deepseek-chat",
        "messages": messages,
        "stream": True
    }
    
    async with httpx.AsyncClient() as client:
        async with client.stream("POST", DEEPSEEK_API_URL, json=data, headers=headers, timeout=60.0) as response:
            if response.status_code != 200:
                yield f"data: {json.dumps({'error': f'DeepSeek API error: {response.status_code}'})}\n\n"
                return
                
            async for line in response.aiter_lines():
                if not line.strip() or line.startswith(":"):
                    continue
                    
                if line.startswith("data: "):
                    line = line[6:]  # Remove "data: " prefix
                
                if line == "[DONE]":
                    yield f"data: [DONE]\n\n"
                    break
                    
                try:
                    chunk = json.loads(line)
                    if "choices" in chunk and len(chunk["choices"]) > 0:
                        delta = chunk["choices"][0].get("delta", {})
                        if "content" in delta and delta["content"]:
                            yield f"data: {json.dumps({'text': delta['content']})}\n\n"
                except json.JSONDecodeError:
                    yield f"data: {json.dumps({'error': 'Failed to parse DeepSeek response'})}\n\n"

@app.post("/chat")
async def chat(request: ChatRequest):
    """Chat endpoint that streams responses from DeepSeek API."""
    # Convert history to DeepSeek format
    messages = []
    
    # Add system message
    messages.append({"role": "system", "content": PERSONALITY_SYSTEM_PROMPT})
    
    # Get RAG context if enabled
    if request.use_rag:
        rag_context = await get_rag_context(request.message)
        if rag_context:
            messages.append({
                "role": "system", 
                "content": f"RELEVANT CONTEXT:\n{rag_context}\n\nUse this context to inform your response to the user's next message."
            })
    
    # Add conversation history
    for msg in request.history:
        messages.append({"role": msg.role, "content": msg.content})
    
    # Add the current user message
    messages.append({"role": "user", "content": request.message})
    
    return StreamingResponse(
        stream_deepseek_response(messages),
        media_type="text/event-stream"
    )

@app.post("/speak")
async def speak(request: SpeakRequest):
    """Convert text to speech using ElevenLabs."""
    audio_stream = await text_to_speech(request.text, request.voice_id)
    return StreamingResponse(
        audio_stream,
        media_type="audio/mpeg"
    )

@app.get("/voices")
async def list_voices():
    """List available ElevenLabs voices."""
    if not ELEVENLABS_API_KEY:
        raise ValueError("ELEVENLABS_API_KEY not set")
    url = "https://api.elevenlabs.io/v1/voices"
    headers = {"xi-api-key": ELEVENLABS_API_KEY}
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        return response.json()

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
        raise HTTPException(status_code=500, detail="Search API keys not configured")
    url = "https://www.googleapis.com/customsearch/v1"
    params = {"key": GOOGLE_API_KEY, "cx": GOOGLE_CSE_ID, "q": query}
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
    items = data.get("items", [])[:3]
    results = [{"title": i.get("title"), "snippet": i.get("snippet"), "link": i.get("link")} for i in items]
    return {"results": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
