import { useQuery } from "@tanstack/react-query";
import type { Playlist } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog";

export default function LibraryPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const { data: playlists, isLoading } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists"],
  });

  return (
    <>
      <div className="space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              Sua Biblioteca
            </h1>
            <p className="text-muted-foreground">
              Suas playlists e músicas favoritas
            </p>
          </div>
          
          <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-new-playlist">
            <Plus className="w-4 h-4 mr-2" />
            Nova Playlist
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : playlists && playlists.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {playlists.map((playlist) => (
              <Link key={playlist.id} href={`/playlist/${playlist.id}`}>
                <Card className="group overflow-hidden hover-elevate transition-all duration-300 cursor-pointer">
                  <div className="relative aspect-square bg-muted">
                    {playlist.coverUrl ? (
                      <img
                        src={playlist.coverUrl}
                        alt={playlist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <Play className="w-12 h-12 text-primary/40" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium truncate" data-testid={`text-playlist-${playlist.id}`}>
                      {playlist.name}
                    </h3>
                    {playlist.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {playlist.description}
                      </p>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Play className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Nenhuma playlist ainda</h3>
            <p className="text-muted-foreground mb-4">
              Crie sua primeira playlist para começar
            </p>
            <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-first-playlist">
              <Plus className="w-4 h-4 mr-2" />
              Criar Playlist
            </Button>
          </Card>
        )}
      </div>

      <CreatePlaylistDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}
