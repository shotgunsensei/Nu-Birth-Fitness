import { useState } from "react";
import { useParams } from "wouter";
import { useVideo, useUploads } from "@/hooks/youtube";
import { useAppStore } from "@/store/useAppStore";
import { formatPublishedDate, formatViewCount } from "@/utils/format";
import YouTubeEmbed from "@/components/video/YouTubeEmbed";
import VideoRail from "@/components/video/VideoRail";
import VideoCard from "@/components/video/VideoCard";
import { Button } from "@/components/ui/button";
import { Heart, Clock, Share2, ExternalLink, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function VideoDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: video, isLoading } = useVideo(id!);
  const { data: uploads } = useUploads();
  const [descExpanded, setDescExpanded] = useState(false);
  
  const { toggleFavorite, toggleWatchLater, isFavorite, isWatchLater } = useAppStore();

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }
  
  if (!video) {
    return <div className="p-8 text-center">Video not found.</div>;
  }

  const handleShare = async () => {
    const url = `https://www.youtube.com/watch?v=${video.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          url: url
        });
      } catch (err) {
        // Aborted
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  const allVideos = uploads?.pages.flatMap(p => p.videos) || [];
  const relatedVideos = allVideos.filter(v => v.id !== video.id).slice(0, 10);

  const isFav = isFavorite(video.id);
  const isWL = isWatchLater(video.id);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-8"
    >
      <div className="w-full max-w-5xl mx-auto md:py-6 md:px-6">
        <div className="md:rounded-xl overflow-hidden bg-black mb-4 shadow-xl">
          <YouTubeEmbed videoId={video.id} autoPlay />
        </div>
        
        <div className="px-4 md:px-0">
          <h1 className="text-xl md:text-2xl font-serif font-semibold text-foreground mb-2">
            {video.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="font-medium text-foreground">{video.channelTitle}</span>
            <div className="flex items-center gap-1.5">
              <span>{formatViewCount(video.viewCount)}</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
              <span>{formatPublishedDate(video.publishedAt)}</span>
            </div>
          </div>
          
          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-2 mb-6 pb-6 border-b border-border">
            <Button 
              variant={isFav ? "default" : "secondary"} 
              className="rounded-full"
              onClick={() => toggleFavorite(video.id)}
            >
              <Heart className={`w-4 h-4 mr-2 ${isFav ? "fill-current" : ""}`} />
              {isFav ? "Saved" : "Save"}
            </Button>
            
            <Button 
              variant={isWL ? "default" : "secondary"} 
              className="rounded-full"
              onClick={() => toggleWatchLater(video.id)}
            >
              <Clock className={`w-4 h-4 mr-2 ${isWL ? "fill-current" : ""}`} />
              Watch Later
            </Button>
            
            <Button variant="secondary" className="rounded-full" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            
            <Button variant="secondary" className="rounded-full" asChild>
              <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open App
              </a>
            </Button>
          </div>
          
          {/* Description */}
          <div className="bg-secondary/20 rounded-xl p-4 mb-8">
            <p className={`text-sm text-foreground/90 whitespace-pre-wrap ${!descExpanded ? "line-clamp-4" : ""}`}>
              {video.description}
            </p>
            <button 
              onClick={() => setDescExpanded(!descExpanded)}
              className="mt-2 text-sm font-medium text-primary flex items-center hover:underline"
            >
              {descExpanded ? (
                <>Show less <ChevronUp className="w-4 h-4 ml-1" /></>
              ) : (
                <>Show more <ChevronDown className="w-4 h-4 ml-1" /></>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Related Videos */}
      {relatedVideos.length > 0 && (
        <VideoRail title="More from NU Birth Fitness">
          {relatedVideos.map(v => (
            <div key={v.id} className="w-[280px] shrink-0 snap-start">
              <VideoCard video={v} />
            </div>
          ))}
        </VideoRail>
      )}
    </motion.div>
  );
}
