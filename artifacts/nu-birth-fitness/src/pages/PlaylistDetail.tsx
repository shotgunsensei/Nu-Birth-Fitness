import { useParams } from "wouter";
import { usePlaylists, usePlaylistItems } from "@/hooks/youtube";
import YouTubeEmbed from "@/components/video/YouTubeEmbed";
import VideoCard from "@/components/video/VideoCard";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  
  // Find playlist details from the cache
  const { data: playlistsData } = usePlaylists();
  const playlist = playlistsData?.pages.flatMap(p => p.items).find(p => p.id === id);
  
  const { data: itemsData, isLoading, fetchNextPage, hasNextPage } = usePlaylistItems(id!);

  if (isLoading && !itemsData) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  const videos = itemsData?.pages.flatMap(p => p.videos) || [];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-8"
    >
      <div className="w-full max-w-5xl mx-auto md:py-6 md:px-6">
        <div className="md:rounded-xl overflow-hidden bg-black mb-4 shadow-xl">
          <YouTubeEmbed videoId="" playlistId={id} />
        </div>
        
        <div className="px-4 md:px-0 mb-8">
          <h1 className="text-xl md:text-2xl font-serif font-semibold text-foreground mb-2">
            {playlist?.title || "Playlist"}
          </h1>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {playlist?.description}
          </p>
        </div>

        <div className="px-4 md:px-0">
          <h2 className="text-lg font-serif font-semibold mb-4 border-b border-border pb-2">
            Videos in this Program ({videos.length})
          </h2>
          
          <div className="flex flex-col gap-4">
            {videos.map((video, index) => (
              <div key={`${video.id}-${index}`} className="flex items-start gap-4 p-2 hover:bg-secondary/10 rounded-xl transition-colors">
                <div className="text-muted-foreground font-mono text-sm w-6 pt-6 text-center hidden sm:block">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <VideoCard video={video} layout="list" />
                </div>
              </div>
            ))}
          </div>

          {hasNextPage && (
            <div className="py-4 flex justify-center">
              <button 
                className="text-primary text-sm font-medium hover:underline"
                onClick={() => fetchNextPage()}
              >
                Load more videos
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
