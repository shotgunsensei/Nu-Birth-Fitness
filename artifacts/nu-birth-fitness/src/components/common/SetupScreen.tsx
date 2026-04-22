import { AlertCircle, KeyRound, Youtube } from "lucide-react";
import { Button } from "../ui/button";

export default function SetupScreen() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-2xl shadow-xl border border-border">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
            <Youtube size={32} />
          </div>
          <h1 className="text-2xl font-serif font-semibold text-foreground">Welcome to NU Birth Fitness</h1>
          <p className="text-muted-foreground text-sm">
            Just one small step to get started. We need a YouTube API key to fetch the latest videos and content directly from the channel.
          </p>
        </div>

        <div className="bg-secondary/30 rounded-xl p-4 border border-secondary text-sm space-y-3">
          <div className="flex items-start gap-2 text-secondary-foreground font-medium">
            <KeyRound size={18} className="shrink-0 mt-0.5" />
            <p>How to configure your API Key:</p>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-1">
            <li>Go to the Google Cloud Console</li>
            <li>Enable the YouTube Data API v3</li>
            <li>Create an API Key</li>
            <li>Add it to the Replit Secrets tool as <code className="bg-background px-1.5 py-0.5 rounded text-foreground font-mono text-xs">VITE_YOUTUBE_API_KEY</code></li>
            <li>Restart the dev server</li>
          </ol>
        </div>

        <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg border border-destructive/20">
          <AlertCircle size={16} className="shrink-0" />
          <p>The app cannot start without this key.</p>
        </div>

        <Button 
          className="w-full"
          onClick={() => window.location.reload()}
        >
          I've added the key, reload app
        </Button>
      </div>
    </div>
  );
}
