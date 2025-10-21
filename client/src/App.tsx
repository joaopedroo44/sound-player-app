import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MusicPlayer } from "@/components/music-player";
import { UserMenu } from "@/components/user-menu";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { PlayerProvider } from "@/lib/player-context";

import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import HomePage from "@/pages/home";
import SearchPage from "@/pages/search";
import LibraryPage from "@/pages/library";
import PlaylistDetailPage from "@/pages/playlist-detail";
import ProfilePage from "@/pages/profile";

function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  const sidebarStyle = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route>
          <Redirect to="/login" />
        </Route>
      </Switch>
    );
  }

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b border-border">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <UserMenu />
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-screen-2xl mx-auto p-6">
              <Switch>
                <Route path="/" component={() => <ProtectedRoute component={HomePage} />} />
                <Route path="/search" component={() => <ProtectedRoute component={SearchPage} />} />
                <Route path="/library" component={() => <ProtectedRoute component={LibraryPage} />} />
                <Route path="/playlist/:id" component={() => <ProtectedRoute component={PlaylistDetailPage} />} />
                <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
                <Route component={NotFound} />
              </Switch>
            </div>
          </main>
          <MusicPlayer />
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <PlayerProvider>
            <AppRoutes />
            <Toaster />
          </PlayerProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
