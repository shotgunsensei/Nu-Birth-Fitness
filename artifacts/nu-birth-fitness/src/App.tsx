import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";

import { useYouTubeKeyCheck } from "@/hooks/youtube";
import SetupScreen from "@/components/common/SetupScreen";
import AppShell from "@/components/layout/AppShell";

import Home from "@/pages/Home";
import Videos from "@/pages/Videos";
import VideoDetail from "@/pages/VideoDetail";
import Playlists from "@/pages/Playlists";
import PlaylistDetail from "@/pages/PlaylistDetail";
import Search from "@/pages/Search";
import Favorites from "@/pages/Favorites";
import About from "@/pages/About";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <AnimatePresence mode="wait">
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/videos" component={Videos} />
        <Route path="/videos/:id" component={VideoDetail} />
        <Route path="/playlists" component={Playlists} />
        <Route path="/playlists/:id" component={PlaylistDetail} />
        <Route path="/search" component={Search} />
        <Route path="/favorites" component={Favorites} />
        <Route path="/about" component={About} />
        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

function AppContent() {
  const hasKey = useYouTubeKeyCheck();
  
  if (!hasKey) {
    return <SetupScreen />;
  }

  return (
    <AppShell>
      <Router />
    </AppShell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppContent />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
