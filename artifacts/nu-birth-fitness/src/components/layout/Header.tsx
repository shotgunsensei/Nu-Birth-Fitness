import { Link } from "wouter";
import { useChannel } from "@/hooks/youtube";
import { Skeleton } from "@/components/ui/skeleton";

export default function Header() {
  const { data: channel, isLoading } = useChannel();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="max-w-screen-xl mx-auto h-14 flex items-center px-4">
        <Link href="/" className="flex items-center gap-3">
          {isLoading ? (
            <Skeleton className="w-8 h-8 rounded-full" />
          ) : channel?.thumbnails?.default?.url ? (
            <img 
              src={channel.thumbnails.default.url} 
              alt={channel.title} 
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/20" />
          )}
          <span className="font-serif font-semibold text-lg tracking-tight">
            {channel?.title || "NU Birth Fitness"}
          </span>
        </Link>
      </div>
    </header>
  );
}
