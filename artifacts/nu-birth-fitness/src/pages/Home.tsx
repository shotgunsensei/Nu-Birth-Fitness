import { useChannel, useUploads, usePlaylists } from "@/hooks/youtube";
import { classifyVideos } from "@/utils/classify";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import VideoCard from "@/components/video/VideoCard";
import VideoRail from "@/components/video/VideoRail";
import PlaylistCard from "@/components/playlist/PlaylistCard";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { track } from "@/funnel/track";

export default function Home() {
  const { data: channel, isLoading: isChannelLoading } = useChannel();
  const { data: uploadsData, isLoading: isUploadsLoading } = useUploads();
  const { data: playlistsData, isLoading: isPlaylistsLoading } = usePlaylists();
  const [, setLocation] = useLocation();

  if (isChannelLoading || isUploadsLoading || isPlaylistsLoading) {
    return (
      <div className="p-4 space-y-8 animate-pulse">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-40 w-64 rounded-xl shrink-0" />
          <Skeleton className="h-40 w-64 rounded-xl shrink-0" />
        </div>
      </div>
    );
  }

  const allVideos = uploadsData?.pages.flatMap(p => p.videos) || [];
  const featuredVideo = allVideos[0];
  const latestVideos = allVideos.slice(1, 10);
  const mostViewed = [...allVideos].sort((a, b) => parseInt(b.viewCount || "0") - parseInt(a.viewCount || "0")).slice(0, 10);
  
  const categories = classifyVideos(allVideos);
  const playlists = playlistsData?.pages.flatMap(p => p.items) || [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="pb-8"
    >
      {/* Hero */}
      <div className="relative w-full overflow-hidden bg-muted sm:rounded-b-3xl">
        <div className="absolute inset-0 z-0">
          {channel?.bannerUrl ? (
            <img src={channel.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <img src="/hero-bg.png" alt="Abstract Background" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent sm:via-background/40" />
        </div>
        
        <div className="relative z-10 px-4 pt-32 pb-8 sm:pt-40 sm:pb-12 max-w-screen-xl mx-auto flex flex-col items-center text-center sm:items-start sm:text-left">
          {channel?.thumbnails?.high?.url && (
            <img 
              src={channel.thumbnails.high.url} 
              alt={channel.title} 
              className="w-24 h-24 rounded-full border-4 border-background shadow-lg mb-4 sm:hidden"
            />
          )}
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-foreground mb-3 tracking-tight">
            {channel?.title}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mb-6 line-clamp-3">
            {channel?.description}
          </p>
          
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <Button
              size="lg"
              className="rounded-full"
              onClick={() => {
                track("HomeCTA_Clicked", { position: "hero" });
                setLocation("/reset-trap-quiz");
              }}
              data-testid="button-home-quiz"
            >
              <Sparkles className="w-4 h-4" /> Take the Reset Trap Quiz
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="rounded-full"
              onClick={() => setLocation(featuredVideo ? `/videos/${featuredVideo.id}` : "/videos")}
            >
              Watch Latest
            </Button>
          </div>
        </div>
      </div>

      {/* Quiz CTA banner — top of page */}
      <div className="px-4 md:px-6 mt-6">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-primary mb-1">Free 2-minute quiz</div>
            <h3 className="font-serif font-semibold text-lg sm:text-xl">
              Find out which Mom Reset Type you are
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Personalized result + a clear next step for your body, energy, and confidence.
            </p>
          </div>
          <Button
            size="lg"
            className="rounded-full shrink-0"
            onClick={() => {
              track("HomeCTA_Clicked", { position: "top_banner" });
              setLocation("/reset-trap-quiz");
            }}
            data-testid="button-home-quiz-top"
          >
            Start the Quiz <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Featured Latest Video */}
      {featuredVideo && (
        <div className="px-4 md:px-6 mt-8 mb-4">
          <h2 className="text-xl font-serif font-semibold mb-4">Latest Release</h2>
          <VideoCard video={featuredVideo} featured layout="grid" />
        </div>
      )}

      {/* Rails */}
      {latestVideos.length > 0 && (
        <VideoRail title="Recent Uploads" href="/videos">
          {latestVideos.map(v => (
            <div key={v.id} className="w-[280px] shrink-0 snap-start">
              <VideoCard video={v} />
            </div>
          ))}
        </VideoRail>
      )}

      {mostViewed.length > 0 && (
        <VideoRail title="Most Popular">
          {mostViewed.map(v => (
            <div key={v.id} className="w-[280px] shrink-0 snap-start">
              <VideoCard video={v} />
            </div>
          ))}
        </VideoRail>
      )}

      {playlists.length > 0 && (
        <VideoRail title="Programs & Series" href="/playlists">
          {playlists.map(p => (
            <PlaylistCard key={p.id} playlist={p} />
          ))}
        </VideoRail>
      )}

      {categories.pregnancy.length > 0 && (
        <VideoRail title="Pregnancy & Prenatal">
          {categories.pregnancy.map(v => (
            <div key={v.id} className="w-[280px] shrink-0 snap-start">
              <VideoCard video={v} />
            </div>
          ))}
        </VideoRail>
      )}

      {categories.postpartum.length > 0 && (
        <VideoRail title="Postpartum Recovery">
          {categories.postpartum.map(v => (
            <div key={v.id} className="w-[280px] shrink-0 snap-start">
              <VideoCard video={v} />
            </div>
          ))}
        </VideoRail>
      )}

      {categories.strength.length > 0 && (
        <VideoRail title="Strength & Core">
          {categories.strength.map(v => (
            <div key={v.id} className="w-[280px] shrink-0 snap-start">
              <VideoCard video={v} />
            </div>
          ))}
        </VideoRail>
      )}

      {/* Bottom Quiz CTA */}
      <div className="px-4 md:px-6 mt-10">
        <div className="bg-card border border-card-border rounded-2xl p-6 sm:p-8 text-center">
          <Sparkles className="w-6 h-6 text-primary mx-auto mb-2" />
          <h3 className="font-serif font-semibold text-xl sm:text-2xl mb-2">
            Ready for a reset that actually sticks?
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto mb-5">
            Take the 2-minute Reset Trap Quiz and find out which mom pattern is keeping you stuck.
          </p>
          <Button
            size="lg"
            className="rounded-full"
            onClick={() => {
              track("HomeCTA_Clicked", { position: "bottom_banner" });
              setLocation("/reset-trap-quiz");
            }}
            data-testid="button-home-quiz-bottom"
          >
            Take the Reset Trap Quiz <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
