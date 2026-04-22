import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { pwaBannerDismissed, dismissPwaBanner } = useAppStore();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (!deferredPrompt || pwaBannerDismissed) {
    return null;
  }

  return (
    <div className="bg-primary/10 border-b border-primary/20 text-primary-foreground px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center shrink-0">
          <img src="/icon-512.png" alt="App Icon" className="w-8 h-8 object-cover rounded-md" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">NU Birth Fitness App</p>
          <p className="text-xs text-muted-foreground">Install for offline access & better experience</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" onClick={handleInstallClick} className="rounded-full h-8 px-4 bg-primary text-primary-foreground hover:bg-primary/90">
          Install
        </Button>
        <button 
          onClick={dismissPwaBanner}
          className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:bg-black/5 rounded-full"
          data-testid="button-dismiss-install"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
