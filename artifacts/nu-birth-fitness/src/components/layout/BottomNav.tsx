import { Link, useLocation } from "wouter";
import { Home, PlaySquare, ListVideo, Search, Info, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/videos", label: "Videos", icon: PlaySquare },
  { href: "/playlists", label: "Programs", icon: ListVideo },
  { href: "/search", label: "Search", icon: Search },
  { href: "/favorites", label: "Saved", icon: Heart },
  { href: "/about", label: "About", icon: Info },
];

export default function BottomNav() {
  const [location] = useLocation();

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-border pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <div className={cn(
                  "flex items-center justify-center w-10 h-8 rounded-full transition-all duration-300",
                  isActive ? "bg-primary/10" : "bg-transparent"
                )}>
                  <Icon size={20} className={cn(isActive ? "fill-primary/20" : "")} />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
