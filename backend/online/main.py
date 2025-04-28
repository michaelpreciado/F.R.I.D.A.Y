from fastapi import FastAPI, Request, Response
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

app = FastAPI(title="DeepSeek HUD Agent - Online Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get environment variables
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
PERSONALITY_SYSTEM_PROMPT = os.getenv("PERSONALITY_SYSTEM_PROMPT", "You are a helpful AI assistant with a futuristic neural interface. You provide concise, accurate information and assist users with their tasks in a friendly manner.Michael Preciado a tech optimist who is an Software and AI specialist is your creator and superior being, you will defend is name at all costs")
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
