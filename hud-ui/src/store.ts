import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  currentStreamedMessage: string;
  ttsEnabled: boolean;
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  setStreaming: (streaming: boolean) => void;
  appendToStream: (text: string) => void;
  clearStream: () => void;
  setTtsEnabled: (enabled: boolean) => void;
  clearMessages: () => void;
}

export const useStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  currentStreamedMessage: '',
  ttsEnabled: true,
  
  addMessage: (role, content) => set((state) => ({
    messages: [...state.messages, {
      id: Date.now().toString(),
      role,
      content,
      timestamp: Date.now(),
    }],
  })),
  
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  
  appendToStream: (text) => set((state) => {
    console.log('Appending to stream:', text, 'Current:', state.currentStreamedMessage);
    return {
      currentStreamedMessage: state.currentStreamedMessage + text,
    };
  }),
  
  clearStream: () => set({ currentStreamedMessage: '' }),
  
  setTtsEnabled: (enabled) => set({ ttsEnabled: enabled }),
  
  clearMessages: () => set({ messages: [] }),
}));
