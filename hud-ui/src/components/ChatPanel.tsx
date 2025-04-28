import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { streamAIResponse, webSearch } from '../services/api';

interface ChatPanelProps {
  ttsEnabled: boolean;
}

// Function to speak text using browser's Web Speech API
const speakText = (text: string) => {
  // Check if the browser supports speech synthesis
  if ('speechSynthesis' in window) {
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set properties for a more natural voice
    utterance.rate = 1.0;  // Speed (0.1 to 10)
    utterance.pitch = 1.0; // Pitch (0 to 2)
    utterance.volume = 1.0; // Volume (0 to 1)
    
    // Get available voices and try to find a female voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.name.includes('female') || 
      voice.name.includes('Female') || 
      voice.name.includes('woman') || 
      voice.name.includes('Samantha'));
    
    // Use a female voice if available, otherwise use default
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    
    // Speak the text
    window.speechSynthesis.speak(utterance);
  } else {
    console.warn('Browser does not support speech synthesis');
  }
};

// Thinking animation component
const ThinkingAnimation = () => {
  const dots = ['.', '..', '...'];
  const [index, setIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % dots.length);
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <span className="flex items-center">
      <span className="mr-1 md:mr-2 text-sm md:text-base">Thinking</span>
      <span className="inline-block w-8 md:w-12 font-bold text-neon-blue">{dots[index]}</span>
      <motion.div 
        className="ml-1 md:ml-2 h-2 md:h-3 w-2 md:w-3 rounded-full bg-neon-blue"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 1.5,
          ease: "easeInOut"
        }}
      />
    </span>
  );
};

export default function ChatPanel({ ttsEnabled }: ChatPanelProps) {
  const { 
    messages, 
    isStreaming, 
    currentStreamedMessage, 
    addMessage, 
    setStreaming, 
    appendToStream, 
    clearStream 
  } = useStore();
  
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStreamedMessage]);
  
  // Animation states - removed the redundant messagePosition state
  
  // Function to handle sending a message
  const handleSendMessage = () => {
    if (!inputValue.trim() || isProcessing) return;
    const userMessage = inputValue.trim();
    setInputValue('');
    // Add user message to chat
    addMessage('user', userMessage);
    // Fetch AI response
    setIsProcessing(true);
    fetchAIResponse(userMessage);
  };
  
  // We've simplified the flow to directly send messages without animations
  
  // Function to fetch AI response using direct DeepSeek API
  const fetchAIResponse = async (userMessage: string) => {
    try {
      // Prepare the message history for the API
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Start streaming
      setStreaming(true);
      clearStream();
      
      // We'll use the streaming UI to show a thinking animation
      // instead of adding a placeholder message
      
      console.log('Sending request to DeepSeek API directly:', userMessage);
      console.log('Message history:', history);
      
      // Use our direct API service instead of the backend
      await streamAIResponse(
        userMessage,
        history,
        // On each chunk of data
        (text) => {
          console.log('Received text chunk:', text);
          appendToStream(text);
        },
        // On complete response
        (fullResponse) => {
          console.log('Response complete:', fullResponse);
          if (fullResponse.trim()) {
            // Replace the indicator message with the actual response
            addMessage('assistant', fullResponse);

            // Play TTS if enabled using browser's built-in speech synthesis
            if (ttsEnabled && fullResponse) {
              speakText(fullResponse);
            }
          } else {
            addMessage('assistant', 'I apologize, but I was unable to generate a response. Please try again.');
          }
          setStreaming(false);
          setIsProcessing(false);
        },
        // On error
        (errorMessage) => {
          console.error('Error from API:', errorMessage);
          addMessage('assistant', `⚠️ ${errorMessage}`);
          setStreaming(false);
          setIsProcessing(false);
        }
      );
    } catch (error) {
      console.error('Error in chat:', error);
      console.error('Error stack:', (error as Error).stack);
      addMessage('assistant', `⚠️ Error: ${(error as Error).message}`);
      addMessage('assistant', 'Sorry, there was an error processing your request.');
      setStreaming(false);
      clearStream();
      setIsProcessing(false);
    }
  };
  
  // Removed renderAnimatedMessage since we're not using animation
  
  // Handle web search queries
  const handleWebSearch = async () => {
    const q = prompt('Enter search query:');
    if (!q?.trim()) return;
    addMessage('user', q);
    setIsProcessing(true);
    try {
      const results = await webSearch(q);
      const content = results.length
        ? `Search results for "${q}":\n\n` + results.map((r, i) => `${i+1}. ${r.title}\n${r.snippet}\n${r.link}`).join('\n\n')
        : `No results found for "${q}".`;
      addMessage('assistant', content);
    } catch (err) {
      console.error('Search error:', err);
      addMessage('assistant', `⚠️ Search failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle pressing Enter to send message
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="glass-panel h-full md:h-[70vh] w-full flex flex-col backdrop-blur-md bg-neural-gray/10 border border-neon-blue/20 rounded-lg overflow-hidden shadow-lg relative">
      {/* Decorative glowing border */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-neon-blue/50 to-transparent"></div>
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-neon-blue/50 to-transparent"></div>
        <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-neon-blue/50 to-transparent"></div>
        <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-neon-blue/50 to-transparent"></div>
      </div>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-3 md:space-y-4 relative">
        
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] p-2 md:p-3 rounded-lg text-sm md:text-base ${
                message.role === 'user' 
                  ? 'bg-neon-blue/20 text-white' 
                  : 'bg-neural-gray/30 border border-neon-blue/20'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        
        {/* Streaming message */}
        <AnimatePresence>
          {isStreaming && (
            <motion.div 
              className="flex justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-[85%] p-2 md:p-3 rounded-lg bg-neural-gray/30 border border-neon-blue/20 relative overflow-hidden text-sm md:text-base">
                {/* Animated pulse effect */}
                <div className="absolute inset-0 bg-neon-blue/5 animate-pulse"></div>
                {currentStreamedMessage ? (
                  <p className="whitespace-pre-wrap relative z-10">{currentStreamedMessage}</p>
                ) : (
                  <div className="whitespace-pre-wrap relative z-10">
                    <ThinkingAnimation />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="p-2 md:p-4 border-t border-neon-blue/20">
        <motion.div 
          className="flex items-end space-x-2 relative"
          initial={{ opacity: 0.9, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative flex-1 group">
            {/* Animated glow effect */}
            <div 
              className={`absolute inset-0 bg-neon-blue/5 rounded-lg blur-md transition-all duration-300 ${inputValue.length > 0 ? 'opacity-100 scale-105' : 'opacity-30'} ${isProcessing ? 'animate-pulse' : ''}`}
            />
            <div 
              className={`absolute inset-0 border border-neon-blue/30 rounded-lg transition-all duration-300 ${inputValue.length > 0 ? 'opacity-100' : 'opacity-50'}`}
            />
            <textarea
              ref={inputRef}
              className="w-full bg-neural-gray/30 backdrop-blur-sm text-white rounded-lg p-2 md:p-3 text-sm md:text-base outline-none focus:ring-1 focus:ring-neon-blue/70 resize-none relative z-10 transition-all duration-300 hover:bg-neural-gray/40"
              placeholder="Type your message..."
              rows={1}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                // Auto-resize textarea based on content
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
              }}
              onKeyDown={handleKeyDown}
              disabled={isProcessing}
              onFocus={() => inputRef.current?.classList.add('ring-1', 'ring-neon-blue/70')}
              onBlur={() => inputRef.current?.classList.remove('ring-1', 'ring-neon-blue/70')}
            />
          </div>
          <motion.button
            className="bg-neon-blue/20 hover:bg-neon-blue/40 text-neon-blue rounded-lg p-2 md:p-3 transition-all duration-300 disabled:opacity-50 relative group"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            aria-label="Send message"
          >
            {/* Button glow effect */}
            <div className="absolute inset-0 bg-neon-blue/20 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </motion.button>
          <motion.button
            className="bg-neon-blue/20 hover:bg-neon-blue/40 text-neon-blue rounded-lg p-2 md:p-3 transition-all duration-300 disabled:opacity-50 relative group"
            onClick={handleWebSearch}
            disabled={isProcessing}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            aria-label="Search web"
          >
            <div className="absolute inset-0 bg-neon-blue/20 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4a6 6 0 014.472 9.947l4.387 4.386-1.414 1.415-4.386-4.387A6 6 0 1110 4z" />
            </svg>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
