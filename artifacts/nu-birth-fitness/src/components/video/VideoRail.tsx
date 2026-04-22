import { ReactNode } from "react";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

interface VideoRailProps {
  title: string;
  href?: string;
  children: ReactNode;
}

export default function VideoRail({ title, href, children }: VideoRailProps) {
  return (
    <div className="py-6">
      <div className="flex items-center justify-between px-4 md:px-6 mb-4">
        <h2 className="text-xl font-serif font-semibold">{title}</h2>
        {href && (
          <Link href={href} className="text-sm font-medium text-primary hover:text-primary/80 flex items-center group">
            See all
            <ChevronRight size={16} className="ml-0.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>
      
      <div className="px-4 md:px-6 pb-4">
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-2">
          {children}
        </div>
      </div>
    </div>
  );
}
