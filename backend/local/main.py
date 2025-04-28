from fastapi import FastAPI, Request, Response, BackgroundTasks
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
