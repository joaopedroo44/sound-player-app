import { useQuery } from "@tanstack/react-query";
import type { Playlist, RecentlyPlayed } from "@shared/schema";
import { TrackCard } from "@/components/track-card";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { data: playlists, isLoading: playlistsLoading } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists"],
  });

  const { data: recentlyPlayed, isLoading: recentLoading } = useQuery<RecentlyPlayed[]>({
    queryKey: ["/api/recently-played"],
  });

  return (
    <div className="space-y-8 pb-24">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
          Bem-vindo de volta
        </h1>
        <p className="text-muted-foreground">
          Continue de onde você parou
        </p>
      </div>

      {/* Recently Played */}
      {recentlyPlayed && recentlyPlayed.length > 0 && (
        <section>
          <h2 className="text-2xl font-display font-semibold mb-6">
            Tocadas recentemente
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {recentLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-square" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </Card>
              ))
            ) : (
              recentlyPlayed.slice(0, 6).map((track) => (
                <TrackCard
                  key={track.id}
                  track={{
                    id: track.youtubeId,
                    title: track.title,
                    artist: track.artist,
                    thumbnail: track.thumbnail,
                    duration: track.duration,
                  }}
                />
              ))
            )}
          </div>
        </section>
      )}

      {/* Your Playlists */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-semibold">Suas Playlists</h2>
          <Link href="/library">
            <Button variant="ghost" size="sm" data-testid="link-see-all-playlists">
              Ver todas
            </Button>
          </Link>
        </div>

        {playlistsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
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
            {playlists.slice(0, 6).map((playlist) => (
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
          </Card>
        )}
      </section>
    </div>
  );
}
