import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Plus, MoreVertical } from "lucide-react";
import type { YouTubeVideo } from "@shared/schema";
import { usePlayer } from "@/lib/player-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { AddToPlaylistDialog } from "./add-to-playlist-dialog";

interface TrackCardProps {
  track: YouTubeVideo;
  queue?: YouTubeVideo[];
}

export function TrackCard({ track, queue = [] }: TrackCardProps) {
  const { play, addToQueue } = usePlayer();
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);

  const handlePlay = () => {
    if (queue.length > 0) {
      play(track, queue);
    } else {
      play(track, [track]);
    }
  };

  const handleAddToQueue = () => {
    addToQueue(track);
  };

  return (
    <>
      <Card className="group overflow-hidden hover-elevate transition-all duration-300 cursor-pointer">
        <div className="relative aspect-square" onClick={handlePlay}>
          <img
            src={track.thumbnail}
            alt={track.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button
              size="icon"
              className="h-12 w-12 rounded-full"
              data-testid={`button-play-${track.id}`}
            >
              <Play className="w-6 h-6 ml-0.5" />
            </Button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate text-sm" data-testid={`text-title-${track.id}`}>
                {track.title}
              </h3>
              <p className="text-sm text-muted-foreground truncate" data-testid={`text-artist-${track.id}`}>
                {track.artist}
              </p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  data-testid={`button-menu-${track.id}`}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleAddToQueue}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar à fila
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowAddToPlaylist(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar à playlist
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>

      <AddToPlaylistDialog
        track={track}
        open={showAddToPlaylist}
        onOpenChange={setShowAddToPlaylist}
      />
    </>
  );
}
