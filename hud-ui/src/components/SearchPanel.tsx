import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { webSearch } from '../services/api';

interface SearchResult {
  title: string;
  snippet: string;
  link: string;
}

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchPanel({ isOpen, onClose }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const searchResults = await webSearch(query.trim());
      setResults(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-neural-gray/90 backdrop-blur-md border border-neon-blue/30 rounded-lg w-full max-w-sm sm:max-w-md md:max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-hidden shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-neon-blue/20">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h2 className="text-base sm:text-lg font-bold text-white">Web Search</h2>
                <button
                  onClick={onClose}
                  className="text-neon-blue hover:text-white transition-colors p-1 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Search Input */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <div className="relative flex-1">
                  <div className="absolute inset-0 bg-neon-blue/5 rounded-lg blur-md"></div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter search query..."
                    className="w-full bg-neural-gray/30 backdrop-blur-sm text-white rounded-lg p-2.5 sm:p-3 text-sm outline-none focus:ring-1 focus:ring-neon-blue/70 relative z-10 touch-manipulation"
                    disabled={isSearching}
                    autoFocus
                  />
                </div>
                <motion.button
                  onClick={handleSearch}
                  disabled={!query.trim() || isSearching}
                  className="bg-neon-blue/20 hover:bg-neon-blue/40 text-neon-blue rounded-lg p-2.5 sm:p-3 transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2 touch-manipulation min-h-[44px]"
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {isSearching ? (
                    <motion.div
                      className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-neon-blue border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                  <span className="text-xs sm:text-sm">Search</span>
                </motion.button>
              </div>
            </div>

            {/* Results */}
            <div className="p-3 sm:p-4 overflow-y-auto max-h-64 sm:max-h-80 md:max-h-96">
              {error && (
                <div className="text-red-400 text-xs sm:text-sm mb-3 sm:mb-4 p-2 sm:p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  ⚠️ {error}
                </div>
              )}

              {results.length > 0 && (
                <div className="space-y-2 sm:space-y-3">
                  {results.map((result, index) => (
                    <motion.a
                      key={index}
                      href={result.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 sm:p-3 bg-neural-gray/30 border border-neon-blue/20 rounded-lg hover:bg-neural-gray/40 hover:border-neon-blue/40 transition-all duration-200 group touch-manipulation"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <h3 className="text-white font-medium mb-1 group-hover:text-neon-blue transition-colors text-sm sm:text-base line-clamp-2">
                        {result.title}
                      </h3>
                      <p className="text-gray-300 text-xs sm:text-sm mb-1 sm:mb-2 line-clamp-2 leading-relaxed">
                        {result.snippet}
                      </p>
                      <p className="text-neon-blue text-xs truncate">
                        {result.link}
                      </p>
                    </motion.a>
                  ))}
                </div>
              )}

              {!isSearching && !error && results.length === 0 && query && (
                <div className="text-center text-gray-400 py-6 sm:py-8">
                  <svg className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-sm">No results found</p>
                </div>
              )}

              {!query && !isSearching && (
                <div className="text-center text-gray-400 py-6 sm:py-8">
                  <svg className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-sm">Enter a search query to get started</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 