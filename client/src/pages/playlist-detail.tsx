import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import type { Playlist, PlaylistTrack } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, MoreVertical, Trash2, Edit2, ArrowLeft } from "lucide-react";
import { usePlayer } from "@/lib/player-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function PlaylistDetailPage() {
  const [, params] = useRoute("/playlist/:id");
  const [, setLocation] = useLocation();
  const playlistId = params?.id;
  const { play } = usePlayer();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<string | null>(null);

  const { data: playlist, isLoading: playlistLoading } = useQuery<Playlist>({
    queryKey: ["/api/playlists", playlistId],
    enabled: !!playlistId,
  });

  const { data: tracks, isLoading: tracksLoading } = useQuery<PlaylistTrack[]>({
    queryKey: ["/api/playlists", playlistId, "tracks"],
    enabled: !!playlistId,
  });

  const deletePlaylistMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/playlists/${playlistId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      toast({
        title: "Playlist excluída",
        description: "Sua playlist foi removida com sucesso.",
      });
      setLocation("/library");
    },
  });

  const deleteTrackMutation = useMutation({
    mutationFn: async (trackId: string) => {
      return apiRequest("DELETE", `/api/playlists/${playlistId}/tracks/${trackId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists", playlistId, "tracks"] });
      toast({
        title: "Música removida",
        description: "A música foi removida da playlist.",
      });
      setTrackToDelete(null);
    },
  });

  const handlePlayAll = () => {
    if (!tracks || tracks.length === 0) return;

    const queue = tracks
      .sort((a, b) => a.position - b.position)
      .map((track) => ({
        id: track.youtubeId,
        title: track.title,
        artist: track.artist,
        thumbnail: track.thumbnail,
        duration: track.duration,
      }));

    play(queue[0], queue);
  };

  if (playlistLoading || !playlist) {
    return (
      <div className="space-y-6 pb-24">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 pb-24">
        <Button
          variant="ghost"
          onClick={() => setLocation("/library")}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-full md:w-64 aspect-square bg-muted rounded-lg overflow-hidden flex-shrink-0">
            {playlist.coverUrl ? (
              <img
                src={playlist.coverUrl}
                alt={playlist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <Play className="w-20 h-20 text-primary/40" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="text-sm text-muted-foreground mb-2">PLAYLIST</div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4" data-testid="text-playlist-name">
              {playlist.name}
            </h1>
            {playlist.description && (
              <p className="text-muted-foreground mb-4" data-testid="text-playlist-description">
                {playlist.description}
              </p>
            )}
            <div className="text-sm text-muted-foreground mb-6">
              {tracks?.length || 0} música{(tracks?.length || 0) !== 1 ? "s" : ""}
            </div>

            <div className="flex gap-2">
              <Button
                size="lg"
                onClick={handlePlayAll}
                disabled={!tracks || tracks.length === 0}
                data-testid="button-play-all"
              >
                <Play className="w-5 h-5 mr-2" />
                Reproduzir
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="lg" variant="outline" data-testid="button-playlist-menu">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir playlist
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {tracksLoading ? (
          <Card className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          </Card>
        ) : tracks && tracks.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Artista</TableHead>
                  <TableHead className="w-24">Duração</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tracks
                  .sort((a, b) => a.position - b.position)
                  .map((track, index) => (
                    <TableRow
                      key={track.id}
                      className="hover-elevate cursor-pointer"
                      onClick={() => {
                        const queue = tracks
                          .sort((a, b) => a.position - b.position)
                          .map((t) => ({
                            id: t.youtubeId,
                            title: t.title,
                            artist: t.artist,
                            thumbnail: t.thumbnail,
                            duration: t.duration,
                          }));
                        play(queue[index], queue);
                      }}
                      data-testid={`row-track-${track.id}`}
                    >
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={track.thumbnail}
                            alt={track.title}
                            className="w-10 h-10 rounded object-cover"
                          />
                          <span className="font-medium">{track.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {track.artist}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {formatDuration(track.duration)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              data-testid={`button-track-menu-${track.id}`}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setTrackToDelete(track.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Card className="p-12 text-center">
            <Play className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Playlist vazia</h3>
            <p className="text-muted-foreground">
              Busque por músicas e adicione-as a esta playlist
            </p>
          </Card>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir playlist?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A playlist e todas as músicas serão removidas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePlaylistMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!trackToDelete} onOpenChange={() => setTrackToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover música?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta música da playlist?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => trackToDelete && deleteTrackMutation.mutate(trackToDelete)}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
