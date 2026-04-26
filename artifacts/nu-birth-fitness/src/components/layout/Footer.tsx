import { Link } from "wouter";
import { FunnelDisclaimer } from "@/funnel/components";

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background/50 mt-12">
      <div className="max-w-screen-xl mx-auto px-4 py-8 text-sm text-muted-foreground space-y-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link href="/videos" className="hover:text-foreground transition-colors">Videos</Link>
          <Link href="/playlists" className="hover:text-foreground transition-colors">Programs</Link>
          <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
          <Link href="/reset-trap-quiz" className="hover:text-foreground transition-colors font-medium text-primary">
            What Type of Mom Are You? Quiz
          </Link>
        </div>
        <FunnelDisclaimer />
        <div className="text-xs">
          © {new Date().getFullYear()} Nu-Birth Fitness. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
