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
export const TRANSCRIBE_ENDPOINT = `${API_BASE_URL}/transcribe`;

// Google Custom Search endpoint
export const SEARCH_ENDPOINT = `${API_BASE_URL}/search`;

/**
 * Perform a web search via backend and return top results.
 */
export async function webSearch(query: string): Promise<{ title: string; snippet: string; link: string }[]> {
  const response = await fetch(`${SEARCH_ENDPOINT}?query=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error(`Search API error: ${response.status}`);
  }
  const data = await response.json();
  return data.results || [];
}

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
    let streamFinished = false; // Flag to ensure onComplete is called only once

    const processLine = (line: string) => {
        if (streamFinished || !line || !line.startsWith('data: ')) {
            if (line && !line.startsWith('data:')) console.log('Skipping non-data line:', line);
            return;
        }

        const data = line.substring(6).trim(); // Remove 'data: ' prefix and trim
        console.log('Processing data:', data);

        if (data === '[DONE]') {
            console.log('Stream complete signal received.');
            if (!streamFinished) {
                onComplete(fullResponse); // Call onComplete with the accumulated response
                streamFinished = true;   // Set flag
            }
            return; // Stop processing this line
        }

        // If [DONE] was already processed, do not handle more data chunks
        if (streamFinished) {
            console.log('Skipping data after [DONE] was processed:', data);
            return;
        }

        try {
            const parsed = JSON.parse(data);
            let content = '';
            if (parsed.text) {
                content = parsed.text;
                console.log('Extracted content:', content);
            } else if (parsed.choices && parsed.choices[0]?.delta?.content) {
                content = parsed.choices[0].delta.content;
                console.log('Extracted DeepSeek content:', content);
            } else {
                console.log('Parsed data does not contain expected content:', parsed);
            }
            
            if (content) {
                fullResponse += content;
                onData(content); // Call the callback to update the UI stream
            }
        } catch (e) {
            console.error('Error parsing stream data JSON:', data, e);
        }
    };
    
    while (true) {
        const { done, value } = await reader.read();
        
        if (value) {
            buffer += decoder.decode(value, { stream: true });
            console.log('Received raw data, buffer contains:', buffer.length, 'chars');
        }

        // Process all complete lines in the buffer
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
            const line = buffer.substring(0, newlineIndex).trim();
            buffer = buffer.substring(newlineIndex + 1); // Update buffer
            processLine(line);
            if (streamFinished) break; // Stop processing lines in this chunk if [DONE] was found
        }
        
        // If stream finished processing lines in this chunk, continue reading
        if (streamFinished) {
             // Ensure the reader continues until actually done if necessary,
             // but don't process further lines.
             if (done) break; // Break outer loop if reader is also done
             continue; // Continue reading
        }

        if (done) {
            console.log('Reader finished. Processing final buffer content.');
            // If the stream is done, process any remaining part in the buffer as the last line
            if (buffer.trim()) {
                processLine(buffer.trim());
            }
            break; // Exit the outer loop
        }
    } // End of while (true)

    console.log('Reader loop finished.');
    
    // Final check: If stream ended WITHOUT the [DONE] signal being processed
    if (!streamFinished) {
        if (fullResponse) {
            console.warn('Stream ended without [DONE] signal, but content was received.');
            onComplete(fullResponse); // Call onComplete with whatever was received
        } else {
            console.warn('Stream ended without [DONE] signal and without receiving content.');
            onError("Stream ended unexpectedly without data or a DONE signal.");
        }
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
