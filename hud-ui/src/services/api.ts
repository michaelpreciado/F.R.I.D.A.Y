// API service for communicating with the backend

interface MessageType {
  role: string;
  content: string;
}

// Determine backend URL based on mode
const API_BASE_URL = import.meta.env.MODE === 'production' 
  ? import.meta.env.VITE_BACKEND_URL || 'https://friday-backend.onrender.com' // Use Render URL in production
  : '/api'; // Use Vite proxy in development

const CHAT_ENDPOINT = `${API_BASE_URL}/chat`;

// Log environment variables for debugging
console.log('API mode:', import.meta.env.MODE);
console.log('Using backend URL:', API_BASE_URL);
console.log('Chat endpoint:', CHAT_ENDPOINT);

// No need to handle API keys in the frontend anymore
// The backend will manage API keys securely


/**
 * Streams a response from the DeepSeek API
 */
export async function streamAIResponse(
  message: string,
  history: MessageType[] = [],
  onData: (text: string) => void,
  onComplete: (fullResponse: string) => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    console.log('Sending direct API request to DeepSeek');
    
    // Prepare request payload for the backend API
    const payload = {
      message,
      history: history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      use_rag: false // Set to true if you want to use retrieval-augmented generation
    };
    
    console.log('Sending request to backend:', payload);
    
    // Make the request to our backend instead of directly to DeepSeek
    const response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', errorText);
      onError(`Backend Error: ${response.status} - ${errorText}`);
      return;
    }
    
    if (!response.body) {
      onError('Response body is null');
      return;
    }
    
    // Process the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      console.log('Received chunk:', chunk);
      
      // Process SSE format
      const lines = chunk.split('\n\n');
      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue;
        
        const data = line.substring(6);  // Remove 'data: ' prefix
        
        if (data === '[DONE]') {
          console.log('Stream complete');
          continue;
        }
        
        try {
          const parsed = JSON.parse(data);
          if (parsed.choices && 
              parsed.choices[0] && 
              parsed.choices[0].delta && 
              parsed.choices[0].delta.content) {
            const content = parsed.choices[0].delta.content;
            console.log('Content:', content);
            fullResponse += content;
            onData(content);
          }
        } catch (e) {
          console.error('Error parsing stream data:', e);
        }
      }
    }
    
    console.log('Stream completed. Full response:', fullResponse);
    onComplete(fullResponse);
    
  } catch (error) {
    console.error('Error in streamAIResponse:', error);
    
    // Provide specific error messages
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      onError('Network error: Could not connect to the backend server. Make sure it is running.');
    } else {
      onError(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
