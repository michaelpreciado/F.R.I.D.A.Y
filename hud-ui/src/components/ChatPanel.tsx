import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { streamAIResponse } from '../services/api';
import ParticleEffect from './ParticleEffect';

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
    }, 200);
    
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
          duration: 0.8,
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages, currentStreamedMessage]);
  
  // Adjust chat panel position when mobile keyboard appears
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const updateHeight = () => {
      const offset = window.innerHeight - viewport.height;
      setKeyboardHeight(offset > 0 ? offset : 0);
    };
    viewport.addEventListener('resize', updateHeight);
    updateHeight();
    return () => viewport.removeEventListener('resize', updateHeight);
  }, []);
  
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
  
  // Handle pressing Enter to send message
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <motion.div
      id="chat-panel"
      className="glass-panel w-full max-h-[20rem] sm:max-h-[24rem] md:max-h-[32rem] flex flex-col backdrop-blur-md bg-neural-gray/10 border border-neon-blue/20 rounded-lg overflow-hidden shadow-lg relative chat-container"
      initial={{ y: 0 }}
      animate={{ y: -keyboardHeight }}
      transition={{ type: 'tween', ease: 'easeInOut', duration: 0.2 }}
    >
      {/* Particle Effect */}
      <ParticleEffect 
        containerId="chat-panel" 
        particleCount={20} 
        color="#00e0ff" 
        size={1} 
        speed={0.1} 
        opacity={0.3} 
      />
      
      {/* Decorative glowing border */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-neon-blue/50 to-transparent animate-pulse-slow"></div>
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-neon-blue/50 to-transparent animate-pulse-slow"></div>
        <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-neon-blue/50 to-transparent animate-pulse-slow"></div>
        <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-neon-blue/50 to-transparent animate-pulse-slow"></div>
      </div>
      
      {/* Messages area - Responsive height */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2 relative min-h-0 max-h-60 sm:max-h-72 md:max-h-96">
        
        {messages.map((message) => (
          <motion.div 
            key={message.id} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              type: 'spring', 
              stiffness: 400,
              damping: 30,
              duration: 0.15 
            }}
          >
            <motion.div 
              className={`max-w-[85%] sm:max-w-[80%] p-2 sm:p-3 rounded-lg text-xs sm:text-sm relative overflow-hidden message-bubble ${
                message.role === 'user' 
                  ? 'bg-neon-blue/20 text-white user-message' 
                  : 'bg-neural-gray/30 border border-neon-blue/20 assistant-message'
              }`}
              whileHover={{
                scale: 1.01,
                transition: { duration: 0.1 }
              }}
              whileTap={{ scale: 0.99 }}
            >
              {/* Decorative message bubble elements */}
              <div className="absolute inset-0 pointer-events-none message-glow-overlay"></div>
              
              {message.role === 'assistant' && (
                <div className="absolute -inset-1 bg-neon-blue/5 blur-md rounded-lg animate-pulse-very-slow"></div>
              )}
              
              <div className="relative z-10">
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            </motion.div>
          </motion.div>
        ))}
        
        {/* Streaming message */}
        <AnimatePresence>
          {isStreaming && (
            <motion.div 
              className="flex justify-start"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              <div className="max-w-[85%] sm:max-w-[80%] p-2 sm:p-3 rounded-lg bg-neural-gray/30 border border-neon-blue/20 relative overflow-hidden text-xs sm:text-sm">
                {/* Animated pulse effect */}
                <div className="absolute inset-0 bg-neon-blue/5 animate-pulse"></div>
                {currentStreamedMessage ? (
                  <p className="whitespace-pre-wrap relative z-10 leading-relaxed">{currentStreamedMessage}</p>
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
      
      {/* Input area - Mobile optimized */}
      <div className="p-2 sm:p-3 border-t border-neon-blue/20">
        <motion.div 
          className="flex items-center space-x-2 relative"
          initial={{ opacity: 0.9, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="relative flex-1 group">
            {/* Animated glow effect */}
            <div 
              className={`absolute inset-0 bg-neon-blue/5 rounded-lg blur-md transition-all duration-300 ${inputValue.length > 0 ? 'opacity-100 scale-105' : 'opacity-30'} ${isProcessing ? 'animate-pulse' : ''}`}
            />
            <div 
              className={`absolute inset-0 border border-neon-blue/30 rounded-lg transition-all duration-300 ${inputValue.length > 0 ? 'opacity-100' : 'opacity-50'}`}
            />
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-neural-gray/30 backdrop-blur-sm text-white rounded-lg p-2.5 sm:p-3 text-sm outline-none focus:ring-1 focus:ring-neon-blue/70 relative z-10 transition-all duration-300 hover:bg-neural-gray/40 touch-manipulation"
              placeholder="Chat with F.R.I.D.A.Y"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isProcessing}
              onFocus={() => inputRef.current?.classList.add('ring-1', 'ring-neon-blue/70')}
              onBlur={() => inputRef.current?.classList.remove('ring-1', 'ring-neon-blue/70')}
            />
          </div>
          <motion.button
            className="bg-neon-blue/20 hover:bg-neon-blue/40 text-neon-blue rounded-lg p-2.5 sm:p-3 transition-all duration-300 disabled:opacity-50 relative group flex-shrink-0 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            aria-label="Send message"
          >
            {/* Button glow effect */}
            <div className="absolute inset-0 bg-neon-blue/20 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
