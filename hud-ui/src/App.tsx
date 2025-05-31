import { useState } from 'react';
import NeonBackground from './components/NeonBackground';
import ChatPanel from './components/ChatPanel';
import MicButton from './components/MicButton';
import SearchPanel from './components/SearchPanel';
import WeatherWidget from './components/WeatherWidget';

function App() {
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-neural-dark">
      {/* 3D Background */}
      <NeonBackground />
      
      {/* Main Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
        
        {/* F.R.I.D.A.Y Title */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wider">
            F.R.I.D.A.Y
          </h1>
        </div>

        {/* Weather Widget - Top Left */}
        <div className="absolute top-8 left-8 z-20">
          <WeatherWidget />
        </div>

        {/* Controls - Top Right */}
        <div className="absolute top-8 right-8 z-20 flex items-center space-x-4">
          {/* Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center space-x-2 bg-neon-blue/20 hover:bg-neon-blue/40 text-neon-blue rounded-lg p-2 transition-all duration-300 group"
            title="Web Search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-sm hidden md:block">Search</span>
          </button>

          {/* Voice Toggle */}
          <div className="flex items-center">
            <span className="mr-2 text-sm text-white">Voice</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={ttsEnabled}
                onChange={() => setTtsEnabled(!ttsEnabled)}
              />
              <div className="w-11 h-6 bg-neural-gray peer-focus:outline-none rounded-full peer 
                             peer-checked:after:translate-x-full peer-checked:after:border-white 
                             after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                             after:bg-white after:border-gray-300 after:border after:rounded-full 
                             after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue"></div>
            </label>
          </div>
        </div>

        {/* Central Holographic Interface */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            {/* Main circular container */}
            <div className="w-96 h-96 md:w-[500px] md:h-[500px] relative">
              
              {/* Outer ring with subtle glow */}
              <div className="absolute inset-0 rounded-full border border-neon-blue/30 animate-pulse-slow"></div>
              
              {/* Middle ring */}
              <div className="absolute inset-4 rounded-full border border-neon-blue/20"></div>
              
              {/* Inner glow ring */}
              <div className="absolute inset-8 rounded-full border border-neon-blue/40 shadow-[0_0_50px_rgba(0,224,255,0.3)]"></div>
              
              {/* Person silhouette container */}
              <div className="absolute inset-16 flex items-center justify-center">
                <div className="relative">
                  {/* Person silhouette */}
                  <svg 
                    width="200" 
                    height="200" 
                    viewBox="0 0 200 200" 
                    className="text-neon-blue/60 drop-shadow-[0_0_20px_rgba(0,224,255,0.4)]"
                  >
                    {/* Head */}
                    <circle cx="100" cy="60" r="30" fill="currentColor" />
                    {/* Body */}
                    <ellipse cx="100" cy="140" rx="45" ry="60" fill="currentColor" />
                    {/* Shoulders */}
                    <ellipse cx="100" cy="110" rx="55" ry="25" fill="currentColor" />
                  </svg>
                  
                  {/* Animated circles around the silhouette */}
                  <div className="absolute inset-0 animate-spin-slow">
                    <div className="absolute top-4 left-1/2 w-2 h-2 bg-neon-blue rounded-full animate-pulse"></div>
                  </div>
                  <div className="absolute inset-0 animate-spin-reverse-slow">
                    <div className="absolute bottom-4 right-1/4 w-1.5 h-1.5 bg-neon-blue/70 rounded-full animate-pulse"></div>
                  </div>
                  <div className="absolute inset-0 animate-spin-slow" style={{ animationDelay: '1s' }}>
                    <div className="absolute top-1/3 right-4 w-1 h-1 bg-neon-blue/50 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute top-8 left-8 w-3 h-3 bg-neon-blue/40 rounded-full animate-pulse"></div>
              <div className="absolute bottom-12 right-16 w-2 h-2 bg-neon-blue/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute top-20 right-8 w-1.5 h-1.5 bg-neon-blue/50 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
            </div>
          </div>
        </div>

        {/* Chat Interface - Bottom Section */}
        <div className="w-full max-w-4xl px-4 pb-8">
          <div className="flex flex-col space-y-4">
            <ChatPanel ttsEnabled={ttsEnabled} />
            <div className="flex justify-center">
              <MicButton />
            </div>
          </div>
        </div>
      </div>
      
      {/* Search Panel */}
      <SearchPanel isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      
      {/* Footer */}
      <div className="absolute bottom-2 w-full text-center z-10">
        <p className="text-xs text-neon-blue/70">Created by MP</p>
      </div>
    </div>
  );
}

export default App;
