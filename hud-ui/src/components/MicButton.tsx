import { useState, useRef } from 'react';
import { useStore } from '../store';
import { TRANSCRIBE_ENDPOINT } from '../services/api';

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
    <button
      className={`relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${buttonClasses}`}
      onClick={toggleRecording}
      disabled={isStreaming || isProcessing}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
    >
      {/* Glowing border - more subtle on mobile */}
      <div className="absolute inset-0 rounded-full blur-sm md:blur-md bg-neon-blue/30"></div>
      
      {/* Pulsing rings around button while recording - smaller on mobile */}
      {isRecording && (
        <>
          <div className="absolute inset-0 rounded-full animate-ping bg-neon-blue/20"></div>
          <div className="absolute -inset-2 md:-inset-4 rounded-full animate-pulse bg-neon-blue/10"></div>
          <div className="absolute -inset-4 md:-inset-8 rounded-full animate-pulse bg-neon-blue/5" style={{ animationDelay: '0.5s' }}></div>
        </>
      )}
      
      {/* Microphone icon - smaller on mobile */}
      <div className="relative z-10">
        {isRecording ? (
          <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </div>
    </button>
  );
}
