import { useState } from 'react';
import NeonBackground from './components/NeonBackground';
import ChatPanel from './components/ChatPanel';
import MicButton from './components/MicButton';

function App() {
  const [ttsEnabled, setTtsEnabled] = useState(true);

  return (
    <div className="relative min-h-screen w-full">
      {/* 3D Background */}
      <NeonBackground />
      
      {/* Main Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-start p-4 overflow-hidden">
        <div className="w-full max-w-4xl h-full flex flex-col">
          {/* Header - Always visible with higher z-index */}
          <div className="flex items-center justify-between mb-2 md:mb-4 px-1 py-2 sticky top-0 z-20 bg-neural-gray/30 backdrop-blur-md rounded-lg">
            <h1 className="friday-title text-xl md:text-2xl font-bold tracking-wider relative z-10">
              <span className="relative" data-letter="F">F</span>
              <span className="relative" data-letter=".">.</span>
              <span className="relative" data-letter="R">R</span>
              <span className="relative" data-letter=".">.</span>
              <span className="relative" data-letter="I">I</span>
              <span className="relative" data-letter=".">.</span>
              <span className="relative" data-letter="D">D</span>
              <span className="relative" data-letter=".">.</span>
              <span className="relative" data-letter="A">A</span>
              <span className="relative" data-letter=".">.</span>
              <span className="relative" data-letter="Y">Y</span>
            </h1>
            
            <div className="flex items-center space-x-3 md:space-x-4">
              {/* TTS Toggle */}
              <div className="flex items-center">
                <span className="mr-1 md:mr-2 text-xs md:text-sm text-white">Voice</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={ttsEnabled}
                    onChange={() => setTtsEnabled(!ttsEnabled)}
                  />
                  <div className="w-9 md:w-11 h-5 md:h-6 bg-neural-gray peer-focus:outline-none rounded-full peer 
                                 peer-checked:after:translate-x-full peer-checked:after:border-white 
                                 after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                                 after:bg-white after:border-gray-300 after:border after:rounded-full 
                                 after:h-4 md:after:h-5 after:w-4 md:after:w-5 after:transition-all peer-checked:bg-neon-blue"></div>
                </label>
              </div>
            </div>
          </div>
          
          {/* Adjusted layout structure with fixed heights */}
          <div className="flex flex-col space-y-2 h-[calc(100vh-130px)]">
            {/* Chat Panel - Set to take most of the available space */}
            <div className="flex-1 min-h-0">
              <ChatPanel ttsEnabled={ttsEnabled} />
            </div>
            
            {/* Mic Button - Fixed position right below chat panel */}
            <div className="flex justify-center py-1">
              <MicButton />
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer with creator attribution */}
      <div className="absolute bottom-1 md:bottom-2 w-full text-center z-10">
        <p className="text-xs text-neon-blue/70">Created by MP</p>
      </div>
    </div>
  );
}

export default App;
