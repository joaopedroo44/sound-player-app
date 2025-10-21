import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Playlist, YouTubeVideo, InsertPlaylistTrack } from "@shared/schema";
import { Plus, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddToPlaylistDialogProps {
  track: YouTubeVideo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddToPlaylistDialog({ track, open, onOpenChange }: AddToPlaylistDialogProps) {
  const { toast } = useToast();

  const { data: playlists, isLoading } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists"],
    enabled: open,
  });

  const addTrackMutation = useMutation({
    mutationFn: async ({ playlistId }: { playlistId: string }) => {
      const trackData: InsertPlaylistTrack = {
        youtubeId: track.id,
        title: track.title,
        artist: track.artist,
        thumbnail: track.thumbnail,
        duration: track.duration,
        position: 0,
      };
      return apiRequest("POST", `/api/playlists/${playlistId}/tracks`, trackData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists", variables.playlistId] });
      toast({
        title: "Adicionado!",
        description: "Música adicionada à playlist com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar à Playlist</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <img
              src={track.thumbnail}
              alt={track.title}
              className="w-12 h-12 rounded object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{track.title}</div>
              <div className="text-xs text-muted-foreground truncate">{track.artist}</div>
            </div>
          </div>

          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando playlists...
              </div>
            ) : playlists && playlists.length > 0 ? (
              <div className="space-y-1">
                {playlists.map((playlist) => (
                  <Button
                    key={playlist.id}
                    variant="ghost"
                    className="w-full justify-start h-auto py-3"
                    onClick={() => addTrackMutation.mutate({ playlistId: playlist.id })}
                    disabled={addTrackMutation.isPending}
                    data-testid={`button-add-to-${playlist.id}`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        {playlist.coverUrl ? (
                          <img
                            src={playlist.coverUrl}
                            alt={playlist.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <Plus className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="font-medium text-sm truncate">{playlist.name}</div>
                        {playlist.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {playlist.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Você ainda não tem playlists. Crie uma para começar!
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
