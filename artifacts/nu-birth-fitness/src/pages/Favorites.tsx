import { useState } from "react";
import { useMultipleVideos } from "@/hooks/youtube";
import { useAppStore } from "@/store/useAppStore";
import VideoGrid from "@/components/video/VideoGrid";
import VideoCard from "@/components/video/VideoCard";
import EmptyState from "@/components/common/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Clock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export default function Favorites() {
  const [tab, setTab] = useState<"favorites" | "watchlater">("favorites");
  const { favorites, watchLater } = useAppStore();
  const [, setLocation] = useLocation();
  
  // Only fetch the IDs we need for the current tab
  const currentIds = tab === "favorites" ? favorites : watchLater;
  const { data: videos, isLoading } = useMultipleVideos(currentIds);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="py-6 space-y-6"
    >
      <div className="px-4 md:px-6">
        <h1 className="text-2xl font-serif font-semibold mb-6">Your Library</h1>
        
        <Tabs value={tab} onValueChange={(v) => setTab(v as "favorites" | "watchlater")} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-secondary/30 rounded-full mb-8">
            <TabsTrigger value="favorites" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Heart className="w-4 h-4 mr-2" /> Saved
            </TabsTrigger>
            <TabsTrigger value="watchlater" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Clock className="w-4 h-4 mr-2" /> Watch Later
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="favorites" className="mt-0 focus-visible:outline-none">
            {isLoading && currentIds.length > 0 ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
            ) : favorites.length === 0 ? (
              <EmptyState 
                icon={Heart}
                title="No saved videos yet"
                description="Videos you save will appear here for easy access."
                actionLabel="Browse videos"
                onAction={() => setLocation("/videos")}
              />
            ) : (
              <VideoGrid>
                {videos?.map(video => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </VideoGrid>
            )}
          </TabsContent>
          
          <TabsContent value="watchlater" className="mt-0 focus-visible:outline-none">
            {isLoading && currentIds.length > 0 ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
            ) : watchLater.length === 0 ? (
              <EmptyState 
                icon={Clock}
                title="Watch Later is empty"
                description="Save videos you want to watch another time."
                actionLabel="Browse videos"
                onAction={() => setLocation("/videos")}
              />
            ) : (
              <VideoGrid>
                {videos?.map(video => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </VideoGrid>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
