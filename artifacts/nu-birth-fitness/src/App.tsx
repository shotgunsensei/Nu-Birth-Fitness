import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
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

import QuizLanding from "@/pages/funnel/QuizLanding";

function QuizRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/reset-trap-quiz", { replace: true });
  }, [setLocation]);
  return null;
}

import Quiz from "@/pages/funnel/Quiz";
import QuizContact from "@/pages/funnel/QuizContact";
import Result from "@/pages/funnel/Result";
import Booking from "@/pages/funnel/Booking";
import Training from "@/pages/funnel/Training";
import Admin from "@/pages/funnel/Admin";

import { initTracking } from "@/funnel/track";

const queryClient = new QueryClient();

const FUNNEL_PATH_PREFIXES = [
  "/reset-trap-quiz",
  "/quiz",
  "/results/",
  "/book/",
  "/training/",
  "/admin/funnel",
  "/reset",
  "/mom-quiz",
  "/start",
];

function isFunnelPath(p: string): boolean {
  return FUNNEL_PATH_PREFIXES.some((pre) => p === pre || p.startsWith(pre));
}

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
        <Route path="/reset-trap-quiz" component={QuizLanding} />
        <Route path="/reset" component={QuizRedirect} />
        <Route path="/mom-quiz" component={QuizRedirect} />
        <Route path="/start" component={QuizRedirect} />
        <Route path="/quiz" component={Quiz} />
        <Route path="/quiz/contact" component={QuizContact} />
        <Route path="/results/:slug" component={Result} />
        <Route path="/book/:slug" component={Booking} />
        <Route path="/training/:slug" component={Training} />
        <Route path="/admin/funnel" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

function AppContent() {
  const hasKey = useYouTubeKeyCheck();
  const [location] = useLocation();

  useEffect(() => {
    initTracking();
  }, []);

  // Funnel and admin routes don't depend on the YouTube key — render them
  // even if the YouTube setup screen would otherwise block the rest of the app.
  if (!hasKey && !isFunnelPath(location)) {
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
