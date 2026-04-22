import { usePlaylists } from "@/hooks/youtube";
import PlaylistCard from "@/components/playlist/PlaylistCard";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Playlists() {
  const { data, isLoading } = usePlaylists();

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  const playlists = data?.pages.flatMap(p => p.items) || [];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="py-6 px-4 md:px-6"
    >
      <h1 className="text-2xl font-serif font-semibold mb-6">Programs & Series</h1>
      
      {playlists.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No playlists found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {playlists.map(playlist => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
