import { Link, useLocation } from "wouter";
import { useChannel } from "@/hooks/youtube";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { track } from "@/funnel/track";

export default function Header() {
  const { data: channel, isLoading } = useChannel();
  const [, setLocation] = useLocation();

  function clickCta() {
    track("HeaderCTA_Clicked");
    setLocation("/reset-trap-quiz");
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="max-w-screen-xl mx-auto h-14 flex items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-3 min-w-0">
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
          <span className="font-serif font-semibold text-lg tracking-tight truncate">
            {channel?.title || "NU Birth Fitness"}
          </span>
        </Link>
        <Button
          size="sm"
          className="rounded-full whitespace-nowrap text-xs sm:text-sm"
          onClick={clickCta}
          data-testid="button-header-quiz"
        >
          Take the Quiz
        </Button>
      </div>
    </header>
  );
}
