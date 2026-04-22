import { useChannel } from "@/hooks/youtube";
import { ExternalLink, Youtube, Instagram, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function About() {
  const { data: channel } = useChannel();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="py-8 px-4 md:px-6 max-w-3xl mx-auto space-y-12"
    >
      <section className="text-center space-y-6">
        {channel?.thumbnails?.high?.url && (
          <img 
            src={channel.thumbnails.high.url} 
            alt={channel.title} 
            className="w-32 h-32 rounded-full border-4 border-background shadow-lg mx-auto"
          />
        )}
        <h1 className="text-3xl font-serif font-bold">About NU Birth Fitness</h1>
        
        <p className="text-muted-foreground whitespace-pre-wrap text-left bg-secondary/10 p-6 rounded-2xl border border-border leading-relaxed">
          {channel?.description || "Welcome to NU Birth Fitness. Our mission is to support women through pregnancy, birth, and postpartum with safe, effective strength training and wellness content."}
        </p>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <Button variant="outline" className="h-16 rounded-2xl flex items-center justify-center gap-3 text-base" asChild>
          <a href="https://www.youtube.com/@NU-BirthFitness?sub_confirmation=1" target="_blank" rel="noopener noreferrer">
            <Youtube className="w-6 h-6 text-red-600" />
            Subscribe on YouTube
          </a>
        </Button>
        <Button variant="outline" className="h-16 rounded-2xl flex items-center justify-center gap-3 text-base" asChild>
          <a href="https://www.nu-birthfitness.com/" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-5 h-5 text-primary" />
            Visit Website
          </a>
        </Button>
      </section>

      <section className="bg-muted p-6 rounded-2xl text-sm text-muted-foreground space-y-4">
        <div className="flex items-center gap-2 text-foreground font-medium mb-2">
          <ShieldAlert className="w-5 h-5 text-primary" />
          <span>Disclaimer</span>
        </div>
        <p>
          Always consult with your healthcare provider before beginning any exercise program, especially during pregnancy and postpartum.
        </p>
        <p>
          This application is a standalone media viewer. All video content is securely embedded directly from YouTube via the official YouTube API and remains the property of its respective creators. We do not host, store, or modify any video content.
        </p>
      </section>
      
      <div className="text-center text-xs text-muted-foreground pb-8">
        NU Birth Fitness App v1.0
      </div>
    </motion.div>
  );
}
