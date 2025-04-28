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
    let buffer = ''; // Buffer to handle partial lines
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
          // Process any remaining buffer content if the stream ends unexpectedly
          if (buffer.trim()) {
              console.warn('Stream ended with unprocessed buffer content:', buffer);
              // Optionally attempt to process the last bit of buffer here if necessary
          }
          break;
      }
      
      buffer += decoder.decode(value, { stream: true });
      console.log('Received raw data, current buffer:', buffer);
      
      // Process lines separated by single newline
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
        const line = buffer.substring(0, newlineIndex).trim();
        buffer = buffer.substring(newlineIndex + 1); // Remove processed line + newline from buffer

        if (!line || !line.startsWith('data: ')) {
          if (line) console.log('Skipping non-data line:', line);
          continue;
        }
        
        const data = line.substring(6);  // Remove 'data: ' prefix
        console.log('Processing data:', data);
        
        if (data === '[DONE]') {
          console.log('Stream complete signal received.');
          // Call onComplete *now* as the content stream is finished
          onComplete(fullResponse); 
          // We might want to break the outer loop here IF the backend guarantees
          // no more data comes after [DONE]. However, letting reader.read()
          // return done:true is safer to ensure the reader is fully consumed.
          // We just need to ensure onComplete isn't called again later.
          // Let's add a flag.
          // await reader.cancel(); // Optionally cancel reader if needed
          // break; // Might break prematurely if more non-content chunks follow
          fullResponse = ''; // Clear fullResponse to prevent double processing if loop continues
          continue; // Continue reading until reader signals done, but don't process further data chunks
        }
        
        // If onComplete was already called (due to [DONE]), don't process further data chunks
        if (fullResponse === '' && data !== '[DONE]') { 
             console.log('Skipping data after [DONE]:', data);
             continue;
        }

        try {
          const parsed = JSON.parse(data);
          // Assuming structure like: { "text": "..." } based on console logs
          // Adjust parsing logic if the structure is different
          if (parsed.text) {
             const content = parsed.text;
             console.log('Extracted content:', content);
             fullResponse += content;
             onData(content); // Call the callback to update the UI stream
          } else if (parsed.choices && parsed.choices[0]?.delta?.content) {
            // Keep original DeepSeek format handling as fallback
            const content = parsed.choices[0].delta.content;
            console.log('Extracted DeepSeek content:', content);
            fullResponse += content;
            onData(content);
          } else {
             console.log('Parsed data does not contain expected content:', parsed);
          }
        } catch (e) {
          console.error('Error parsing stream data JSON:', data, e);
        }
      }
    } // End of while loop
    
    console.log('Reader loop finished.');
    // Ensure onComplete is called if stream ended without [DONE] 
    // and we have accumulated content. This check prevents calling it twice if [DONE] was received.
    if (fullResponse !== '') { 
        console.warn('Stream ended without [DONE] signal, but content was received.');
        onComplete(fullResponse);
    }
    
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
