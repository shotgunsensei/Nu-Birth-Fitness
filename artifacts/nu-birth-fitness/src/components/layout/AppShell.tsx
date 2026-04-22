import { ReactNode } from "react";
import Header from "./Header";
import BottomNav from "./BottomNav";
import InstallBanner from "./InstallBanner";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground pb-16 md:pb-0">
      <InstallBanner />
      <Header />
      <main className="flex-1 w-full max-w-screen-xl mx-auto flex flex-col relative">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
