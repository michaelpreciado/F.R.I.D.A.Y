import { useState, useRef } from 'react';
import { useStore } from '../store';
import { TRANSCRIBE_ENDPOINT } from '../services/api';
import { motion } from 'framer-motion';

export default function MicButton() {
  const { addMessage, isStreaming } = useStore();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Start recording audio
  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setIsProcessing(true);
        
        // Create audio blob from chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        // Send to transcription API
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob);
          
          const response = await fetch(TRANSCRIBE_ENDPOINT, {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error(`Transcription failed: ${response.status}`);
          }
          
          const result = await response.json();
          
          if (result.text) {
            // Add transcribed text as user message
            addMessage('user', result.text);
          }
        } catch (error) {
          console.error('Transcription error:', error);
        } finally {
          setIsProcessing(false);
          
          // Stop all tracks on the stream
          stream.getTracks().forEach(track => track.stop());
        }
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };
  
  // Toggle recording state
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  const buttonClasses = isRecording 
    ? 'bg-red-500 shadow-[0_0_20px_#ff0000aa]' 
    : isProcessing 
      ? 'bg-yellow-500 shadow-[0_0_20px_#ffaa00aa]' 
      : 'bg-neon-blue/20 shadow-neon hover:bg-neon-blue/30';
  
  return (
    <motion.button
      className={`relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-300 ${buttonClasses} touch-manipulation`}
      onClick={toggleRecording}
      disabled={isStreaming || isProcessing}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
      transition={isRecording ? { repeat: Infinity, duration: 1.5 } : { type: "spring", stiffness: 400, damping: 17 }}
    >
      {/* Glowing border - responsive sizing */}
      <div className="absolute inset-0 rounded-full blur-sm sm:blur-md bg-neon-blue/30"></div>
      
      {/* Pulsing rings around button while recording - responsive sizing */}
      {isRecording && (
        <>
          <motion.div 
            className="absolute inset-0 rounded-full bg-neon-blue/20"
            animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
          <motion.div 
            className="absolute -inset-1 sm:-inset-2 md:-inset-4 rounded-full bg-neon-blue/10"
            animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0, 0.1] }}
            transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
          />
          <motion.div 
            className="absolute -inset-2 sm:-inset-4 md:-inset-8 rounded-full bg-neon-blue/5"
            animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0, 0.05] }}
            transition={{ repeat: Infinity, duration: 2.5, delay: 0.6 }}
          />
        </>
      )}
      
      {/* Processing spinner */}
      {isProcessing && (
        <motion.div 
          className="absolute inset-0 rounded-full border-2 border-yellow-400 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        />
      )}
      
      {/* Microphone icon - responsive sizing */}
      <div className="relative z-10">
        {isRecording ? (
          <motion.svg 
            className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </motion.svg>
        ) : (
          <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </div>
      
      {/* Touch feedback overlay */}
      <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 active:opacity-100 transition-opacity duration-150"></div>
    </motion.button>
  );
}
