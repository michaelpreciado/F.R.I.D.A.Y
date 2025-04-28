// API service for direct DeepSeek API communication

interface MessageType {
  role: string;
  content: string;
}

// Constants
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Load API key from environment variables
// For development, the key can be set in the .env file as VITE_DEEPSEEK_API_KEY
// In production, make sure to set this in your deployment environment
// Using fallback key for development - replace with your key in .env for production
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || 'sk-cebfb951abd74ab08c64b797c525ba1d';

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
    
    // Create system message
    const systemMessage = {
      role: 'system',
      content: 'You are F.R.I.D.A.Y, a helpful AI assistant with a futuristic neural interface. You provide concise, accurate information and assist users with their tasks in a friendly manner.'
    };
    
    // Prepare messages array
    const messages = [
      systemMessage,
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];
    
    // API request parameters
    const params = {
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: true
    };
    
    // Make request with fetch
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', errorText);
      onError(`API Error: ${response.status} - ${errorText}`);
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
    onError(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
