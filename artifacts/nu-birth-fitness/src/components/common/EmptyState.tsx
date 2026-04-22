import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  children
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 min-h-[50vh]">
      <div className="w-20 h-20 bg-secondary/30 text-secondary-foreground rounded-full flex items-center justify-center mb-6">
        <Icon size={40} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-serif font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline" className="rounded-full">
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
}
