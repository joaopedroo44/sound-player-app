import { Home, Search, Library, ListMusic, Plus } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { Playlist } from "@shared/schema";
import { useState } from "react";
import { CreatePlaylistDialog } from "./create-playlist-dialog";

const mainNavItems = [
  {
    title: "Início",
    url: "/",
    icon: Home,
  },
  {
    title: "Buscar",
    url: "/search",
    icon: Search,
  },
  {
    title: "Biblioteca",
    url: "/library",
    icon: Library,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const { data: playlists } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists"],
  });

  return (
    <>
      <Sidebar>
        <SidebarHeader className="p-6">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer" data-testid="link-home">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <ListMusic className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-display font-bold">MusicStream</span>
            </div>
          </Link>
        </SidebarHeader>
        
        <SidebarContent className="px-3">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={`link-${item.title.toLowerCase()}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="flex items-center justify-between px-3">
              <span>Suas Playlists</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setShowCreateDialog(true)}
                data-testid="button-create-playlist"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {playlists && playlists.length > 0 ? (
                  playlists.map((playlist) => (
                    <SidebarMenuItem key={playlist.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === `/playlist/${playlist.id}`}
                        data-testid={`link-playlist-${playlist.id}`}
                      >
                        <Link href={`/playlist/${playlist.id}`}>
                          <ListMusic className="w-5 h-5" />
                          <span className="truncate">{playlist.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                ) : (
                  <div className="px-3 py-4 text-sm text-muted-foreground">
                    Nenhuma playlist ainda
                  </div>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <CreatePlaylistDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
      />
    </>
  );
}
