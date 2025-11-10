/**
 * High-Performance Cine Signal Viewer Component
 * 
 * A production-ready signal visualizer with smooth GPU-accelerated animations.
 * 
 * Features:
 * - Smooth cursor movement and waveform scrolling
 * - GPU-accelerated rendering using CSS transforms
 * - Optimized canvas rendering with requestAnimationFrame
 * - Separated concerns: AudioManager hook + SignalViewer component
 * - Responsive and mobile-friendly
 * - Play/Pause controls with progress tracking
 * 
 * Performance optimizations:
 * - Pre-rendered waveform to offscreen canvas
 * - CSS transform for horizontal scrolling (GPU-accelerated)
 * - Minimal re-renders using refs and memoization
 * - Chunked waveform data processing
 */
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import './CineSignalViewer.css';

/**
 * Custom hook for managing audio playback and time tracking
 * Separates audio logic from visual rendering
 */
function useAudioManager(audioUrl, gain = 1.0) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const rafRef = useRef(null);
  const isSeekingRef = useRef(false);
  const isStoppingRef = useRef(false);  // New flag to track stop operation

  // Initialize audio element
  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.playbackRate = playbackRate;
    audio.volume = Math.min(1.0, Math.max(0, gain)); // Clamp gain between 0 and 1

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.src = '';
    };
  }, [audioUrl, gain, playbackRate]); // Added gain to dependencies

  // Update playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Update volume when gain changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.min(1.0, Math.max(0, gain));
    }
  }, [gain]);

  // Smooth animation loop for time updates
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      let lastUpdateTime = 0;
      const updateTime = () => {
        if (audioRef.current && !audioRef.current.paused) {
          const now = performance.now();
          // Throttle updates to every 100ms to reduce re-renders
          if (now - lastUpdateTime > 100) {
            setCurrentTime(audioRef.current.currentTime);
            lastUpdateTime = now;
          }
          rafRef.current = requestAnimationFrame(updateTime);
        }
      };
      rafRef.current = requestAnimationFrame(updateTime);
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isPlaying]);

  const play = useCallback(async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Play failed:', error);
      }
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    isStoppingRef.current = true;  // Set flag before stopping
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    // Clear flag after a short delay
    setTimeout(() => {
      isStoppingRef.current = false;
    }, 100);
  }, []);

  const seek = useCallback((time) => {
    if (audioRef.current && duration > 0) {
      const targetTime = Math.max(0, Math.min(time, duration));
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  }, [duration]);

  const startSeeking = useCallback(() => {
    isSeekingRef.current = true;
  }, []);

  const endSeeking = useCallback(() => {
    isSeekingRef.current = false;
  }, []);

  const changePlaybackRate = useCallback((rate) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    setPlaybackRate,
    play,
    pause,
    stop,
    seek,
    changePlaybackRate,
    startSeeking,
    endSeeking,
    isSeeking: () => isSeekingRef.current,
    isStopping: () => isStoppingRef.current
  };
}

/**
 * Extracts downsampled waveform data from signal
 * Returns evenly distributed samples for smooth visualization
 */
function extractWaveformData(signal, targetPoints = 4000) {
  if (!signal || signal.length === 0) return [];

  const step = Math.max(1, Math.floor(signal.length / targetPoints));
  const waveform = [];

  for (let i = 0; i < signal.length; i += step) {
    // Use min/max for better waveform representation
    let min = signal[i];
    let max = signal[i];

    for (let j = 0; j < step && i + j < signal.length; j++) {
      const val = signal[i + j];
      if (val < min) min = val;
      if (val > max) max = val;
    }

    waveform.push({ min, max, avg: (min + max) / 2 });
  }

  return waveform;
}

/**
 * Renders waveform to an offscreen canvas for better performance
 * This canvas is then drawn to the visible canvas during animation
 */
function renderWaveformToCanvas(waveform, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx || waveform.length === 0) return canvas;

  // Get theme for colors
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw waveform
  const barWidth = width / waveform.length;
  const centerY = height / 2;
  const amplitudeScale = height / 2; // Use full canvas height

  ctx.fillStyle = isDark ? '#60a5fa' : '#3B82F6';
  ctx.strokeStyle = isDark ? '#3b82f6' : '#2563eb';
  ctx.lineWidth = 1;

  waveform.forEach((point, i) => {
    const x = i * barWidth;
    const minY = centerY - (point.max * amplitudeScale);
    const maxY = centerY - (point.min * amplitudeScale);
    const barHeight = maxY - minY;

    // Draw vertical bar for this sample
    if (barHeight > 1) {
      ctx.fillRect(x, minY, Math.max(barWidth, 1), barHeight);
    } else {
      // For very small bars, draw a line
      ctx.beginPath();
      ctx.moveTo(x, centerY);
      ctx.lineTo(x, minY);
      ctx.stroke();
    }
  });

  return canvas;
}

/**
 * Main CineSignalViewer Component
 * 
 * Displays a smooth, GPU-accelerated waveform visualization with:
 * - Cursor that moves from left to right
 * - Waveform scrolling when cursor reaches the edge
 * - Smooth transitions using CSS transforms
 * - Optimized rendering with offscreen canvas
 */
export default function CineSignalViewer({
  signal = [],
  sampleRate = 44100,
  title = 'Signal',
  audioUrl = null,
  linkedViewerState = null,
  onViewStateChange = null,
  cursorFollowOnly = false,  // New prop: if true, only cursor follows, no audio playback
  gain = 1.0  // New prop: audio volume gain
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const waveformCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastNotifiedStateRef = useRef({ isPlaying: false, currentTime: 0 });

  const [containerWidth, setContainerWidth] = useState(0);
  const [waveformData, setWaveformData] = useState([]);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [zoom, setZoom] = useState(1.0);

  // Use audio manager hook with gain
  const audio = useAudioManager(audioUrl, gain);
  const { isPlaying, currentTime, duration, playbackRate, play, pause, stop, seek, changePlaybackRate, startSeeking, endSeeking, isSeeking, isStopping } = audio;

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.5, 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.5, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1.0);
  }, []);

  // Calculate waveform data when signal changes
  useEffect(() => {
    if (signal && signal.length > 0 && containerWidth > 0) {
      // Extract waveform with optimal point count for smooth rendering
      const waveform = extractWaveformData(signal, 4000);
      setWaveformData(waveform);
      setScrollOffset(0);

      // Pre-render waveform to offscreen canvas with duration-based scaling
      const durationScale = duration > 0 ? Math.max(1, duration / 30) : 3;
      const waveformWidth = containerWidth * durationScale * zoom;
      const waveformCanvas = renderWaveformToCanvas(waveform, waveformWidth, 300);
      waveformCanvasRef.current = waveformCanvas;
    }
  }, [signal, containerWidth, zoom, duration]);

  // Handle container resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Calculate cursor position and scroll offset
  const visualState = useMemo(() => {
    if (!duration || duration === 0) {
      return { cursorX: 0, shouldScroll: false, scrollX: 0 };
    }

    const progress = currentTime / duration;

    // Scale waveform based on duration - longer songs get wider waveforms
    // Use a scaling factor that makes the waveform fill the container properly
    const durationScale = Math.max(1, duration / 30); // Scale up for songs longer than 30s
    const totalWaveformWidth = containerWidth * durationScale * zoom;
    const absolutePosition = progress * totalWaveformWidth;

    // Cursor stays at 20% of screen width initially
    const cursorThreshold = containerWidth * 0.2;

    if (absolutePosition <= cursorThreshold) {
      // Phase 1: Cursor moves, waveform static
      return {
        cursorX: absolutePosition,
        shouldScroll: false,
        scrollX: 0
      };
    } else if (progress < 0.95) {
      // Phase 2: Cursor fixed, waveform scrolls (until 95% of song)
      const maxScroll = totalWaveformWidth - containerWidth;
      const scrollAmount = Math.min(absolutePosition - cursorThreshold, maxScroll);

      return {
        cursorX: cursorThreshold,
        shouldScroll: true,
        scrollX: -scrollAmount
      };
    } else {
      // Phase 3: Final 5% - cursor moves to the right edge as waveform ends
      const maxScroll = totalWaveformWidth - containerWidth;
      const remainingProgress = (progress - 0.95) / 0.05; // 0 to 1 for the final 5%
      const finalCursorX = cursorThreshold + (remainingProgress * (containerWidth - cursorThreshold));

      return {
        cursorX: Math.min(finalCursorX, containerWidth),
        shouldScroll: true,
        scrollX: -maxScroll
      };
    }
  }, [currentTime, duration, containerWidth, zoom]);

  // Smooth rendering loop - only updates canvas transforms
  useEffect(() => {
    const canvas = canvasRef.current;
    const waveformCanvas = waveformCanvasRef.current;

    if (!canvas || !waveformCanvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw center line
      ctx.strokeStyle = isDark ? '#334155' : '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Draw waveform with GPU-accelerated scroll
      ctx.save();
      ctx.translate(visualState.scrollX, 0);
      ctx.drawImage(waveformCanvas, 0, 0);
      ctx.restore();

      // Draw cursor line with glow effect
      const cursorX = visualState.cursorX;

      // Glow
      ctx.strokeStyle = isDark ? 'rgba(248, 113, 113, 0.3)' : 'rgba(239, 68, 68, 0.3)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(cursorX, 0);
      ctx.lineTo(cursorX, canvas.height);
      ctx.stroke();

      // Main line
      ctx.strokeStyle = isDark ? '#f87171' : '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cursorX, 0);
      ctx.lineTo(cursorX, canvas.height);
      ctx.stroke();

      // Draw time info
      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = '12px monospace';
      ctx.fillText(
        `${formatTime(currentTime)} / ${formatTime(duration)}`,
        10,
        20
      );

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    if (isPlaying) {
      render();
    } else {
      // Render once when paused
      render();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, visualState, currentTime, duration]);

  // Initialize canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && containerRef.current) {
      canvas.width = containerRef.current.clientWidth;
      canvas.height = 300;
    }
  }, [containerWidth]);

  // Sync with linked viewer (skip during seeking/stopping to prevent interference)
  useEffect(() => {
    if (!linkedViewerState || isSeeking() || isStopping()) return;

    // If cursorFollowOnly is true, only sync time (cursor follows), not play/pause state
    if (cursorFollowOnly) {
      // Cursor-only mode: always sync time position
      if (linkedViewerState.currentTime !== undefined) {
        const timeDiff = Math.abs(linkedViewerState.currentTime - currentTime);
        if (timeDiff > 0.1) {  // Smaller threshold for smoother cursor following
          seek(linkedViewerState.currentTime);
        }
      }
    } else {
      // Normal mode: sync both play/pause and time
      if (linkedViewerState.isPlaying !== isPlaying) {
        if (linkedViewerState.isPlaying) {
          play();
        } else {
          pause();
        }
      }

      // Only sync time if there's a significant difference
      if (linkedViewerState.currentTime !== undefined) {
        const timeDiff = Math.abs(linkedViewerState.currentTime - currentTime);
        if (timeDiff > 0.5) {  // Increased threshold to reduce sync frequency
          seek(linkedViewerState.currentTime);
        }
      }
    }
  }, [linkedViewerState, cursorFollowOnly]); // Added cursorFollowOnly to dependencies

  // Notify parent of state changes (debounced and with significant change detection)
  useEffect(() => {
    if (!onViewStateChange || cursorFollowOnly || isSeeking() || isStopping()) return;

    // Only notify if there's a significant change
    const lastState = lastNotifiedStateRef.current;
    const timeDiff = Math.abs(currentTime - lastState.currentTime);
    const playStateChanged = isPlaying !== lastState.isPlaying;

    if (playStateChanged || timeDiff > 0.2) {
      // Debounce notifications to prevent feedback loops
      const timeoutId = setTimeout(() => {
        onViewStateChange({
          isPlaying,
          currentTime,
          duration
        });
        lastNotifiedStateRef.current = { isPlaying, currentTime };
      }, 50); // 50ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [isPlaying, currentTime, duration, onViewStateChange, cursorFollowOnly, isSeeking, isStopping]);  // Format time helper
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '00:00.0';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="cine-signal-viewer" ref={containerRef}>
      <div className="viewer-header">
        <h3>{title}</h3>
        {signal.length === 0 && <span className="no-signal">No signal loaded</span>}
        {signal.length > 0 && (
          <div className="time-display">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        )}
      </div>

      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          className="signal-canvas"
        />
        {signal.length === 0 && (
          <div className="empty-state">
            <p>No audio signal loaded</p>
            <p className="empty-hint">Upload an audio file to see the waveform</p>
          </div>
        )}
      </div>

      <div className="controls-panel">
        <div className="playback-controls">
          <button
            onClick={play}
            disabled={isPlaying || signal.length === 0}
            className="control-button play-button"
            aria-label="Play"
          >
            <span className="button-icon">▶️</span>
            <span className="button-label">Play</span>
          </button>

          <button
            onClick={pause}
            disabled={!isPlaying}
            className="control-button pause-button"
            aria-label="Pause"
          >
            <span className="button-icon">⏸️</span>
            <span className="button-label">Pause</span>
          </button>

          <button
            onClick={stop}
            disabled={signal.length === 0}
            className="control-button stop-button"
            aria-label="Stop"
          >
            <span className="button-icon">⏹️</span>
            <span className="button-label">Stop</span>
          </button>
        </div>

        <div className="progress-bar-container">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.01"
            value={currentTime}
            onMouseDown={startSeeking}
            onMouseUp={endSeeking}
            onTouchStart={startSeeking}
            onTouchEnd={endSeeking}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="progress-bar"
            disabled={signal.length === 0}
            aria-label="Seek"
            style={{
              '--progress': duration > 0 ? `${(currentTime / duration) * 100}%` : '0%'
            }}
          />
        </div>

        <div className="speed-control">
          <label>Speed: {playbackRate.toFixed(2)}x</label>
          <div className="speed-buttons">
            <button
              onClick={() => changePlaybackRate(Math.max(0.25, playbackRate - 0.25))}
              disabled={signal.length === 0 || playbackRate <= 0.25}
              className="speed-button"
              aria-label="Decrease speed"
            >
              Slower
            </button>
            <button
              onClick={() => changePlaybackRate(1.0)}
              disabled={signal.length === 0}
              className="speed-button"
              aria-label="Normal speed"
            >
              1x
            </button>
            <button
              onClick={() => changePlaybackRate(Math.min(4.0, playbackRate + 0.25))}
              disabled={signal.length === 0 || playbackRate >= 4.0}
              className="speed-button"
              aria-label="Increase speed"
            >
              Faster
            </button>
          </div>
        </div>

        <div className="zoom-control">
          <label>Zoom: {zoom.toFixed(2)}x</label>
          <div className="zoom-buttons">
            <button
              onClick={handleZoomOut}
              disabled={signal.length === 0 || zoom <= 0.5}
              className="zoom-button"
              aria-label="Zoom out"
            >
              🔍− Zoom Out
            </button>
            <button
              onClick={handleResetZoom}
              disabled={signal.length === 0}
              className="zoom-button"
              aria-label="Reset zoom"
            >
              🔄 Reset
            </button>
            <button
              onClick={handleZoomIn}
              disabled={signal.length === 0 || zoom >= 10}
              className="zoom-button"
              aria-label="Zoom in"
            >
              🔍+ Zoom In
            </button>
          </div>
        </div>

        <div className="info-display">
          <span className="info-item">
            ⏱️ Duration: {formatTime(duration)}
          </span>
          <span className="info-item">
            ⚡ {isPlaying ? 'Playing' : 'Paused'}
          </span>
          <span className="info-item">
            🎚️ Speed: {playbackRate.toFixed(2)}x
          </span>
        </div>
      </div>
    </div>
  );
}
