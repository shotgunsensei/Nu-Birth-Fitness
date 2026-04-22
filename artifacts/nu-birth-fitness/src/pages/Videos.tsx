import { useState, useEffect, useRef } from "react";
import { useUploads } from "@/hooks/youtube";
import { isShortForm } from "@/utils/format";
import VideoCard from "@/components/video/VideoCard";
import VideoGrid from "@/components/video/VideoGrid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

type FilterType = "all" | "recent" | "popular" | "short" | "long";
type SortType = "newest" | "oldest" | "popular" | "az";

export default function Videos() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useUploads();
  
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, { rootMargin: "200px" });
    
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
    
    return () => observerRef.current?.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  const allVideos = data?.pages.flatMap(p => p.videos) || [];
  
  // Filter
  let processedVideos = allVideos.filter(v => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!v.title.toLowerCase().includes(q) && !v.description.toLowerCase().includes(q)) {
        return false;
      }
    }
    
    if (filter === "short") return isShortForm(v.durationSeconds);
    if (filter === "long") return !isShortForm(v.durationSeconds);
    // 'recent' and 'popular' are primarily sort concerns, but we could filter threshold here
    
    return true;
  });

  // Sort
  processedVideos.sort((a, b) => {
    if (sort === "newest" || filter === "recent") {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    }
    if (sort === "oldest") {
      return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
    }
    if (sort === "popular" || filter === "popular") {
      return parseInt(b.viewCount || "0") - parseInt(a.viewCount || "0");
    }
    if (sort === "az") {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="py-6 space-y-6"
    >
      <div className="px-4 md:px-6">
        <h1 className="text-2xl font-serif font-semibold mb-4">All Videos</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search videos..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 rounded-full bg-secondary/20 border-transparent focus-visible:ring-primary"
            />
          </div>
          
          <Select value={sort} onValueChange={(v) => setSort(v as SortType)}>
            <SelectTrigger className="w-full sm:w-[180px] rounded-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="popular">Most Viewed</SelectItem>
              <SelectItem value="az">A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {(["all", "recent", "popular", "short", "long"] as FilterType[]).map(f => (
            <Button
              key={f}
              variant={filter === f ? "default" : "secondary"}
              size="sm"
              className="rounded-full shrink-0 capitalize"
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {processedVideos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No videos found matching your criteria.
        </div>
      ) : (
        <VideoGrid>
          {processedVideos.map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </VideoGrid>
      )}

      {/* Infinite Scroll Trigger */}
      <div ref={loadMoreRef} className="py-8 flex justify-center">
        {isFetchingNextPage && <Loader2 className="animate-spin text-primary" />}
      </div>
    </motion.div>
  );
}
