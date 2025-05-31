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
    <div className="relative min-h-screen w-full flex flex-col bg-neural-dark overflow-hidden">
      {/* 3D Background */}
      <NeonBackground />
      
      {/* Main Content */}
      <div className="absolute inset-0 flex flex-col">
        
        {/* Header Section */}
        <div className="relative z-20 flex justify-between items-start p-3 sm:p-4 md:p-8">
          {/* Weather Widget - Top Left */}
          <div className="flex-shrink-0">
            <WeatherWidget />
          </div>

          {/* F.R.I.D.A.Y Title - Center on mobile, positioned on desktop */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-4 sm:top-6 md:top-8">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-wider text-center">
              F.R.I.D.A.Y
            </h1>
          </div>

          {/* Controls - Top Right */}
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 flex-shrink-0">
            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center space-x-1 sm:space-x-2 bg-neon-blue/20 hover:bg-neon-blue/40 text-neon-blue rounded-lg p-2 sm:p-2.5 transition-all duration-300 group touch-manipulation"
              title="Web Search"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-xs sm:text-sm hidden sm:block">Search</span>
            </button>

            {/* Voice Toggle */}
            <div className="flex items-center">
              <span className="mr-1 sm:mr-2 text-xs sm:text-sm text-white hidden sm:block">Voice</span>
              <label className="relative inline-flex items-center cursor-pointer touch-manipulation">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={ttsEnabled}
                  onChange={() => setTtsEnabled(!ttsEnabled)}
                />
                <div className="w-9 h-5 sm:w-11 sm:h-6 bg-neural-gray peer-focus:outline-none rounded-full peer 
                               peer-checked:after:translate-x-full peer-checked:after:border-white 
                               after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                               after:bg-white after:border-gray-300 after:border after:rounded-full 
                               after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-neon-blue"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Central Holographic Interface */}
        <div className="flex-1 flex items-center justify-center px-4 py-2 sm:py-4">
          <div className="relative">
            {/* Main circular container - Responsive sizing */}
            <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[500px] lg:h-[500px] relative">
              
              {/* Outer ring with subtle glow */}
              <div className="absolute inset-0 rounded-full border border-neon-blue/30 animate-pulse-slow"></div>
              
              {/* Middle ring */}
              <div className="absolute inset-2 sm:inset-3 md:inset-4 rounded-full border border-neon-blue/20"></div>
              
              {/* Inner glow ring */}
              <div className="absolute inset-4 sm:inset-6 md:inset-8 rounded-full border border-neon-blue/40 shadow-[0_0_30px_rgba(0,224,255,0.3)] sm:shadow-[0_0_40px_rgba(0,224,255,0.3)] md:shadow-[0_0_50px_rgba(0,224,255,0.3)]"></div>
              
              {/* Person silhouette container */}
              <div className="absolute inset-8 sm:inset-12 md:inset-16 flex items-center justify-center">
                <div className="relative">
                  {/* Person silhouette - Responsive sizing */}
                  <svg 
                    className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 text-neon-blue/60 drop-shadow-[0_0_15px_rgba(0,224,255,0.4)] sm:drop-shadow-[0_0_20px_rgba(0,224,255,0.4)]"
                    viewBox="0 0 200 200"
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
                    <div className="absolute top-2 sm:top-3 md:top-4 left-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-neon-blue rounded-full animate-pulse"></div>
                  </div>
                  <div className="absolute inset-0 animate-spin-reverse-slow">
                    <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 right-1/4 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-neon-blue/70 rounded-full animate-pulse"></div>
                  </div>
                  <div className="absolute inset-0 animate-spin-slow" style={{ animationDelay: '1s' }}>
                    <div className="absolute top-1/3 right-2 sm:right-3 md:right-4 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-neon-blue/50 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements - Responsive sizing */}
              <div className="absolute top-4 sm:top-6 md:top-8 left-4 sm:left-6 md:left-8 w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-neon-blue/40 rounded-full animate-pulse"></div>
              <div className="absolute bottom-6 sm:bottom-8 md:bottom-12 right-8 sm:right-12 md:right-16 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-neon-blue/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute top-12 sm:top-16 md:top-20 right-4 sm:right-6 md:right-8 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-neon-blue/50 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
            </div>
          </div>
        </div>

        {/* Chat Interface - Bottom Section */}
        <div className="w-full px-3 sm:px-4 pb-4 sm:pb-6 md:pb-8 z-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col space-y-3 sm:space-y-4">
              <ChatPanel ttsEnabled={ttsEnabled} />
              <div className="flex justify-center">
                <MicButton />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-1 sm:bottom-2 w-full text-center z-10">
          <p className="text-xs text-neon-blue/70">Created by MP</p>
        </div>
      </div>
      
      {/* Search Panel */}
      <SearchPanel isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}

export default App;
