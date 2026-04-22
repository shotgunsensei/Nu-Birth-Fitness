import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Search as SearchIcon, Clock, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useUploads, usePlaylists } from "@/hooks/youtube";
import { useAppStore } from "@/store/useAppStore";
import VideoCard from "@/components/video/VideoCard";
import PlaylistCard from "@/components/playlist/PlaylistCard";
import { motion } from "framer-motion";

export default function Search() {
  const [query, setQuery] = useState("");
  const { data: uploadsData } = useUploads();
  const { data: playlistsData } = usePlaylists();
  
  const { recentSearches, addRecentSearch, clearRecentSearches } = useAppStore();

  const allVideos = uploadsData?.pages.flatMap(p => p.videos) || [];
  const allPlaylists = playlistsData?.pages.flatMap(p => p.items) || [];

  const results = useMemo(() => {
    if (!query.trim()) return { videos: [], playlists: [] };
    
    const q = query.toLowerCase();
    
    const videos = allVideos.filter(v => 
      v.title.toLowerCase().includes(q) || 
      v.description.toLowerCase().includes(q)
    ).slice(0, 20); // limit results
    
    const playlists = allPlaylists.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q)
    ).slice(0, 4);

    return { videos, playlists };
  }, [query, allVideos, allPlaylists]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      addRecentSearch(query.trim());
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="py-6 px-4 md:px-6 min-h-screen"
    >
      <form onSubmit={handleSearchSubmit} className="relative mb-8 max-w-2xl mx-auto">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input 
          autoFocus
          placeholder="Search workouts, topics, or programs..." 
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-11 pr-10 h-14 rounded-full bg-secondary/20 border-transparent focus-visible:ring-primary text-base"
        />
        {query && (
          <button 
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </form>

      {!query.trim() && recentSearches.length > 0 && (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-muted-foreground">Recent Searches</h2>
            <button onClick={clearRecentSearches} className="text-xs text-primary hover:underline">Clear</button>
          </div>
          <div className="space-y-2">
            {recentSearches.map((s, i) => (
              <button 
                key={i}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/20 transition-colors text-left"
                onClick={() => setQuery(s)}
              >
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{s}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {query.trim() && (
        <div className="space-y-8">
          {results.playlists.length > 0 && (
            <div>
              <h2 className="text-xl font-serif font-semibold mb-4 border-b border-border pb-2">Programs ({results.playlists.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {results.playlists.map(p => (
                  <PlaylistCard key={p.id} playlist={p} />
                ))}
              </div>
            </div>
          )}

          {results.videos.length > 0 && (
            <div>
              <h2 className="text-xl font-serif font-semibold mb-4 border-b border-border pb-2">Videos ({results.videos.length})</h2>
              <div className="flex flex-col gap-4">
                {results.videos.map(v => (
                  <VideoCard key={v.id} video={v} layout="list" />
                ))}
              </div>
            </div>
          )}

          {results.videos.length === 0 && results.playlists.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No results found for "{query}". Try a different keyword.
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
