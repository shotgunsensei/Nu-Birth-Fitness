import { Link } from "wouter";
import { YouTubeVideo } from "@/types/youtube";
import { formatPublishedDate, formatViewCount } from "@/utils/format";
import DurationBadge from "./DurationBadge";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoCardProps {
  video: YouTubeVideo;
  featured?: boolean;
  layout?: "grid" | "list";
}

export default function VideoCard({ video, featured, layout = "grid" }: VideoCardProps) {
  const isList = layout === "list";
  
  return (
    <Link href={`/videos/${video.id}`} className={cn("group flex", isList ? "flex-row gap-4" : "flex-col gap-3")}>
      <div className={cn(
        "relative rounded-xl overflow-hidden bg-muted shrink-0", 
        isList ? "w-40 aspect-video" : "w-full aspect-video"
      )}>
        <img 
          src={video.thumbnails?.medium?.url || video.thumbnails?.default?.url} 
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100 duration-300">
            <Play size={20} className="text-white fill-white ml-1" />
          </div>
        </div>
        <DurationBadge duration={video.duration} />
      </div>
      
      <div className={cn("flex flex-col", isList ? "justify-center flex-1 py-1" : "")}>
        <h3 className={cn(
          "font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors",
          featured ? "text-lg md:text-xl font-serif" : "text-sm leading-tight"
        )}>
          {video.title}
        </h3>
        
        <div className={cn(
          "flex items-center text-muted-foreground gap-1.5 mt-1.5",
          featured ? "text-sm" : "text-xs"
        )}>
          <span>{formatViewCount(video.viewCount)}</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
          <span>{formatPublishedDate(video.publishedAt)}</span>
        </div>
        
        {featured && video.description && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {video.description}
          </p>
        )}
      </div>
    </Link>
  );
}
