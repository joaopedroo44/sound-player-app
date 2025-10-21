import { usePlayer } from "@/lib/player-context";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function MusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    pause,
    resume,
    playNext,
    playPrevious,
    shuffle,
    repeat,
    toggleShuffle,
    toggleRepeat,
    volume,
    setVolume,
  } = usePlayer();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentVideoIdRef = useRef<string | null>(null);
  const hasTrackedRef = useRef(false);

  const trackPlayedMutation = useMutation({
    mutationFn: async (track: any) => {
      return apiRequest("POST", "/api/recently-played", {
        youtubeId: track.id,
        title: track.title,
        artist: track.artist,
        thumbnail: track.thumbnail,
        duration: track.duration,
      });
    },
  });

  const initializePlayer = useCallback(() => {
    if (!window.YT || !window.YT.Player || playerRef.current) return;

    playerRef.current = new window.YT.Player(playerContainerRef.current!, {
      height: '0',
      width: '0',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
      },
      events: {
        onReady: () => {
          setPlayerReady(true);
          playerRef.current.setVolume(volume);
        },
        onStateChange: (event: any) => {
          const PlayerState = window.YT.PlayerState;
          
          if (event.data === PlayerState.ENDED) {
            playNext();
            hasTrackedRef.current = false;
          }
          
          if (event.data === PlayerState.PLAYING) {
            const dur = playerRef.current?.getDuration();
            if (dur) {
              setDuration(dur);
            }
            
            if (!hasTrackedRef.current && currentTrack) {
              trackPlayedMutation.mutate(currentTrack);
              hasTrackedRef.current = true;
            }
            
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            intervalRef.current = setInterval(() => {
              if (playerRef.current?.getCurrentTime) {
                setCurrentTime(playerRef.current.getCurrentTime());
              }
            }, 100);
          } else {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        },
      },
    });
  }, [volume, playNext, currentTrack, trackPlayedMutation]);

  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initializePlayer();
      return;
    }

    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      initializePlayer();
    };

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [initializePlayer]);

  useEffect(() => {
    if (!playerReady || !playerRef.current || !currentTrack) return;

    if (currentVideoIdRef.current !== currentTrack.id) {
      currentVideoIdRef.current = currentTrack.id;
      hasTrackedRef.current = false;
      playerRef.current.loadVideoById(currentTrack.id);
      setCurrentTime(0);
    }
  }, [currentTrack, playerReady]);

  useEffect(() => {
    if (!playerReady || !playerRef.current) return;

    try {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } catch (error) {
      console.error('Player control error:', error);
    }
  }, [isPlaying, playerReady]);

  useEffect(() => {
    if (!playerReady || !playerRef.current) return;

    try {
      playerRef.current.setVolume(isMuted ? 0 : volume);
    } catch (error) {
      console.error('Volume control error:', error);
    }
  }, [volume, isMuted, playerReady]);

  const handleSeek = (value: number[]) => {
    if (!playerReady || !playerRef.current) return;

    try {
      const newTime = value[0];
      setCurrentTime(newTime);
      playerRef.current.seekTo(newTime, true);
    } catch (error) {
      console.error('Seek error:', error);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (!currentTrack) {
    return null;
  }

  return (
    <>
      <div ref={playerContainerRef} style={{ display: 'none' }}></div>
      <div className="fixed bottom-0 left-0 right-0 h-[90px] bg-card/95 backdrop-blur-md border-t border-card-border z-50">
        <div className="h-full px-4 flex items-center gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 w-[280px]">
            <div className="w-14 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate text-sm" data-testid="text-track-title">
                {currentTrack.title}
              </div>
              <div className="text-xs text-muted-foreground truncate" data-testid="text-track-artist">
                {currentTrack.artist}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex-1 flex flex-col items-center gap-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleShuffle}
                className={shuffle ? "text-primary" : ""}
                data-testid="button-shuffle"
              >
                <Shuffle className="w-4 h-4" />
              </Button>
              
              <Button
                size="icon"
                variant="ghost"
                onClick={playPrevious}
                data-testid="button-previous"
              >
                <SkipBack className="w-5 h-5" />
              </Button>
              
              <Button
                size="icon"
                className="h-10 w-10"
                onClick={isPlaying ? pause : resume}
                disabled={!playerReady}
                data-testid="button-play-pause"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </Button>
              
              <Button
                size="icon"
                variant="ghost"
                onClick={playNext}
                data-testid="button-next"
              >
                <SkipForward className="w-5 h-5" />
              </Button>
              
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleRepeat}
                className={repeat !== "none" ? "text-primary" : ""}
                data-testid="button-repeat"
              >
                {repeat === "one" ? (
                  <Repeat1 className="w-4 h-4" />
                ) : (
                  <Repeat className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="w-full flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="flex-1"
                disabled={!playerReady}
                data-testid="slider-progress"
              />
              <span className="text-xs text-muted-foreground font-mono w-10">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 w-[180px] justify-end">
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleMute}
              data-testid="button-mute"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={100}
              step={1}
              onValueChange={(value) => setVolume(value[0])}
              className="w-24"
              data-testid="slider-volume"
            />
          </div>
        </div>
      </div>
    </>
  );
}
