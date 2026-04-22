import { Link } from "wouter";
import { YouTubePlaylist } from "@/types/youtube";
import { PlaySquare } from "lucide-react";

export default function PlaylistCard({ playlist }: { playlist: YouTubePlaylist }) {
  return (
    <Link href={`/playlists/${playlist.id}`} className="group flex flex-col gap-3 shrink-0 w-[280px] sm:w-full snap-start">
      <div className="relative rounded-xl overflow-hidden bg-muted aspect-[4/3]">
        <img 
          src={playlist.thumbnails?.medium?.url || playlist.thumbnails?.default?.url} 
          alt={playlist.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center scale-90 group-hover:scale-100 transition-all duration-300">
            <PlaySquare size={20} className="text-white" />
          </div>
        </div>
        
        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded flex items-center gap-1.5">
          <PlaySquare size={12} />
          <span>{playlist.itemCount} videos</span>
        </div>
      </div>
      
      <div className="flex flex-col">
        <h3 className="font-medium text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {playlist.title}
        </h3>
      </div>
    </Link>
  );
}
