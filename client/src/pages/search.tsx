import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { YouTubeVideo } from "@shared/schema";
import { TrackCard } from "@/components/track-card";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YouTubeVideo[]>([]);

  const searchMutation = useMutation({
    mutationFn: async (searchQuery: string) => {
      const response = await apiRequest("GET", `/api/youtube/search?q=${encodeURIComponent(searchQuery)}`);
      return response as YouTubeVideo[];
    },
    onSuccess: (data) => {
      setResults(data);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      searchMutation.mutate(query);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-6">Buscar</h1>
        
        <form onSubmit={handleSearch}>
          <div className="relative max-w-2xl">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busque por músicas, artistas ou álbuns..."
              className="h-12 pl-12 text-base"
              data-testid="input-search"
            />
          </div>
        </form>
      </div>

      {searchMutation.isPending && (
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
      )}

      {!searchMutation.isPending && results.length > 0 && (
        <div>
          <h2 className="text-xl font-display font-semibold mb-4">
            Resultados para "{query}"
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {results.map((track) => (
              <TrackCard key={track.id} track={track} queue={results} />
            ))}
          </div>
        </div>
      )}

      {!searchMutation.isPending && searchMutation.isSuccess && results.length === 0 && query && (
        <Card className="p-12 text-center">
          <SearchIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Nenhum resultado encontrado</h3>
          <p className="text-muted-foreground">
            Tente buscar por outros termos
          </p>
        </Card>
      )}

      {!query && !searchMutation.isPending && results.length === 0 && (
        <Card className="p-12 text-center">
          <SearchIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Busque por suas músicas favoritas</h3>
          <p className="text-muted-foreground">
            Digite acima para começar a buscar
          </p>
        </Card>
      )}
    </div>
  );
}
