import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface VideoGridProps {
  children: ReactNode;
  className?: string;
}

export default function VideoGrid({ children, className }: VideoGridProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4 md:px-6",
      className
    )}>
      {children}
    </div>
  );
}
