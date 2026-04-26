import { ReactNode } from "react";

export function FunnelDisclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-muted-foreground leading-relaxed ${className}`}>
      Results vary. Nu-Birth Fitness provides coaching and educational guidance, not medical advice.
      Consult your healthcare provider before beginning a new fitness or nutrition program.
    </p>
  );
}

export function FunnelSection({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`px-4 sm:px-6 max-w-2xl mx-auto w-full ${className}`}>{children}</section>
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${pct}%` }}
        aria-valuenow={pct}
        role="progressbar"
      />
    </div>
  );
}

export function VideoEmbed({ src, title }: { src: string | null | undefined; title: string }) {
  if (!src) {
    return (
      <div className="aspect-video w-full rounded-2xl bg-muted flex items-center justify-center text-muted-foreground text-sm border border-border">
        Video coming soon
      </div>
    );
  }
  // Convert YouTube URLs to embed form
  let embed = src;
  const yt = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  if (yt) embed = `https://www.youtube.com/embed/${yt[1]}`;
  return (
    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-border">
      <iframe
        src={embed}
        title={title}
        className="w-full h-full"
        frameBorder={0}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
