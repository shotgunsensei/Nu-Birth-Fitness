import { Clock } from "lucide-react";
import { formatDuration } from "@/utils/format";

export default function DurationBadge({ duration }: { duration: string }) {
  return (
    <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs font-mono px-1.5 py-0.5 rounded flex items-center gap-1">
      <Clock size={10} />
      <span>{formatDuration(duration)}</span>
    </div>
  );
}
