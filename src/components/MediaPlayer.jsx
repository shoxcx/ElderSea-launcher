import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Music, Volume2, VolumeX } from 'lucide-react';

const MediaPlayer = ({ isHidden }) => {
  const [isPlaying, setIsPlaying] = useState(() => {
    const saved = localStorage.getItem('eldersea_music_paused');
    return saved === 'true' ? false : true;
  });
  
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isApiReady, setIsApiReady] = useState(false);
  
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('eldersea_music_volume');
    return saved ? parseInt(saved, 10) : 50;
  });
  
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const hoverTimeoutRef = useRef(null);
  
  const playerRef = useRef(null);
  const containerRef = useRef(null);

  // Initialize YouTube API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = () => {
        setIsApiReady(true);
      };
    } else if (window.YT && window.YT.Player) {
      setIsApiReady(true);
    } else {
      const oldCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (oldCallback) oldCallback();
        setIsApiReady(true);
      };
    }
  }, []);

  // Initialize Player when API is ready
  useEffect(() => {
    if (!isApiReady || !containerRef.current || playerRef.current) return;
    
    const savedIndex = parseInt(localStorage.getItem('eldersea_music_index') || '6', 10);

    playerRef.current = new window.YT.Player(containerRef.current, {
      height: '0',
      width: '0',
      playerVars: {
        listType: 'playlist',
        list: 'PLfP6i5T0-DkIkVdTG-kHltjbAYQG4l3eG',
        index: savedIndex,
        autoplay: isPlaying ? 1 : 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        rel: 0,
        modestbranding: 1
      },
      events: {
        onReady: (event) => {
          playerRef.current.setVolume(volume);
          const savedTime = parseFloat(localStorage.getItem('eldersea_music_time') || '0');
          if (savedTime > 0) {
            event.target.seekTo(savedTime, true);
          }
          if (isPlaying) {
            event.target.playVideo();
          } else {
            event.target.pauseVideo();
          }
        },
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            localStorage.setItem('eldersea_music_paused', 'false');
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
            localStorage.setItem('eldersea_music_paused', 'true');
          }
        }
      }
    });

    return () => {
      // We don't destroy it here to keep playback going when it hides
    };
  }, [isApiReady]);

  // Sync play/pause state from React to YT Player
  useEffect(() => {
    if (playerRef.current && playerRef.current.playVideo) {
      const state = playerRef.current.getPlayerState();
      if (isPlaying && state !== 1) {
        playerRef.current.playVideo();
      } else if (!isPlaying && state === 1) {
        playerRef.current.pauseVideo();
      }
    }
  }, [isPlaying]);

  // Sync volume state from React to YT Player
  useEffect(() => {
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(volume);
    }
    localStorage.setItem('eldersea_music_volume', volume.toString());
  }, [volume]);

  // Update progress timer and save state
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const currentTime = playerRef.current.getCurrentTime();
          const currentIdx = playerRef.current.getPlaylistIndex();
          
          setProgress(currentTime);
          setDuration(playerRef.current.getDuration() || 0);
          
          localStorage.setItem('eldersea_music_time', currentTime.toString());
          if (currentIdx !== undefined && currentIdx !== -1) {
            localStorage.setItem('eldersea_music_index', currentIdx.toString());
          }
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handlePlayPause = () => {
    const newState = !isPlaying;
    setIsPlaying(newState);
    localStorage.setItem('eldersea_music_paused', (!newState).toString());
  };

  const handleNext = () => {
    if (playerRef.current && playerRef.current.nextVideo) {
      playerRef.current.nextVideo();
    }
  };

  const handlePrev = () => {
    if (playerRef.current && playerRef.current.previousVideo) {
      playerRef.current.previousVideo();
    }
  };

  const handleVolumeToggle = () => {
    if (volume > 0) {
      localStorage.setItem('eldersea_music_volume_last', volume.toString());
      setVolume(0);
    } else {
      const last = localStorage.getItem('eldersea_music_volume_last');
      setVolume(last ? parseInt(last, 10) : 50);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time) || !time) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handlers to prevent bubble from flickering when moving mouse slightly
  const handleMouseEnterVolume = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsVolumeHovered(true);
  };
  const handleMouseLeaveVolume = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsVolumeHovered(false);
    }, 200); // 200ms delay before hiding to allow smooth transit
  };

  return (
    <div className="media-player-bubble premium-float-bubble fade-in" style={{
      position: 'fixed', bottom: '30px', right: '30px', width: '320px',
      padding: '15px', zIndex: 9990, alignItems: 'center', gap: '15px',
      background: 'rgba(15, 22, 40, 0.85)', backdropFilter: 'blur(10px)',
      border: '1px solid var(--border-bright)', borderRadius: '16px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(212,175,55,0.1)',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
      display: isHidden ? 'none' : 'flex'
    }}>
      {/* Hidden YouTube Container */}
      <div style={{ display: 'none' }}><div ref={containerRef}></div></div>
      
      {/* Cover Logo */}
      <div style={{
        width: '72px', height: '72px', position: 'relative', flexShrink: 0
      }}>
        <img 
          src="logoapp.png" 
          alt="Radio ElderSea" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        />
        {isPlaying && (
          <div style={{
            position: 'absolute', inset: 0, 
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Music size={24} color="var(--purple-light)" style={{ opacity: 0.8, animation: 'pulse 2s infinite', filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.8))' }} />
          </div>
        )}
      </div>

      {/* Details & Controls */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        
        {/* Track Info */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ 
            color: 'var(--crystal)', fontSize: '13px', fontWeight: 800, 
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
          }}>
            Radio ElderSea
          </span>
          <span style={{ 
            color: 'var(--text-dim)', fontSize: '10px', 
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
          }}>
            Playlist en cours
          </span>
        </div>

        {/* Controls & Time */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={handlePrev} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, opacity: 0.7, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity=1} onMouseLeave={e => e.currentTarget.style.opacity=0.7}>
              <SkipBack size={16} />
            </button>
            <button onClick={handlePlayPause} style={{ 
              background: 'var(--purple)', border: 'none', color: 'white', cursor: 'pointer', 
              width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 10px rgba(124, 58, 237, 0.4)', transition: 'transform 0.2s'
            }} onMouseEnter={e => e.currentTarget.style.transform='scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
              {isPlaying ? <Pause size={12} /> : <Play size={12} style={{ marginLeft: '2px' }} />}
            </button>
            <button onClick={handleNext} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, opacity: 0.7, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity=1} onMouseLeave={e => e.currentTarget.style.opacity=0.7}>
              <SkipForward size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '9px', color: 'var(--text-dim)', fontFamily: 'monospace', flexShrink: 0, userSelect: 'none' }}>
              {formatTime(progress)} / {formatTime(duration)}
            </div>
            
            <div 
              style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '100%' }}
              onMouseEnter={handleMouseEnterVolume}
              onMouseLeave={handleMouseLeaveVolume}
            >
              <button 
                onClick={handleVolumeToggle}
                style={{ 
                  background: 'none', border: 'none', color: 'white', cursor: 'pointer', 
                  padding: '4px', opacity: isVolumeHovered ? 1 : 0.6, transition: 'opacity 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              
              {/* Volume Slider Bubble - Added padding area to avoid hover drop */}
              <div style={{
                position: 'absolute', bottom: '100%', right: '50%', transform: 'translateX(50%)',
                paddingBottom: '8px', zIndex: 10,
                opacity: isVolumeHovered ? 1 : 0, pointerEvents: isVolumeHovered ? 'auto' : 'none',
                transition: 'opacity 0.2s ease, transform 0.2s ease',
                transformOrigin: 'bottom center'
              }}>
                <div style={{
                  background: 'rgba(15, 22, 40, 0.95)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', padding: '12px 8px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', boxShadow: '0 5px 20px rgba(0,0,0,0.5)',
                  position: 'relative'
                }}>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                    style={{
                      WebkitAppearance: 'slider-vertical',
                      width: '4px', height: '60px',
                      cursor: 'pointer', outline: 'none'
                    }} 
                  />
                  {/* Small triangle arrow at bottom */}
                  <div style={{
                    position: 'absolute', bottom: '-5px', left: '50%', transform: 'translateX(-50%)',
                    borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                    borderTop: '5px solid rgba(255,255,255,0.1)'
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ 
          height: '4px', width: '100%', background: 'rgba(255,255,255,0.1)', 
          borderRadius: '2px', overflow: 'hidden', cursor: 'pointer' 
        }} onClick={(e) => {
          if (!playerRef.current || !playerRef.current.seekTo || !duration) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const percent = (e.clientX - rect.left) / rect.width;
          playerRef.current.seekTo(percent * duration, true);
        }}>
          <div style={{ 
            height: '100%', width: `${(progress / (duration || 1)) * 100}%`,
            background: 'var(--purple-light)', transition: 'width 0.1s linear'
          }} />
        </div>
      </div>
    </div>
  );
};

export default MediaPlayer;
