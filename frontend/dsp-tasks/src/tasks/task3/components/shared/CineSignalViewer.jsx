/**
 * Cine Signal Viewer Component
 * Displays time-domain signal with animation (cine mode)
 * Features: play/pause/stop, speed control, zoom, pan, reset
 * Supports linked viewing with another viewer
 * Uses actual audio playback like DopplerSignalViewer
 */
import { useRef, useEffect, useState, useCallback } from 'react';
import './CineSignalViewer.css';

export default function CineSignalViewer({
  signal = [],
  sampleRate = 44100,
  title = 'Signal',
  audioUrl = null,
  linkedViewerState = null,
  onViewStateChange = null
}) {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isSyncingRef = useRef(false); // Prevent feedback loops
  
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [duration, setDuration] = useState(0);
  
  // View state (zoom/pan)
  const [zoom, setZoom] = useState(1.0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Signal scaling for auto-scaling
  const [signalScale, setSignalScale] = useState({ min: -1, max: 1, range: 2, center: 0, median: 0 });

  // Calculate duration when signal changes
  useEffect(() => {
    if (signal && signal.length > 0) {
      setDuration(signal.length / sampleRate);
    } else {
      setDuration(0);
    }
  }, [signal, sampleRate]);

  // Calculate auto-scaling
  const calculateScale = useCallback((data) => {
    if (!data || data.length === 0) return { min: -1.5, max: 1.5, range: 3, center: 0, median: 0 };
    
    // Use percentile-based scaling
    const sortedData = new Float32Array(data).sort();
    const len = sortedData.length;
    const p5 = sortedData[Math.floor(len * 0.05)] || 0;
    const p95 = sortedData[Math.floor(len * 0.95)] || 0;
    const median = sortedData[Math.floor(len * 0.5)] || 0;
    
    const dataMin = p5;
    const dataMax = p95;
    const actualRange = dataMax - dataMin;
    
    // Add padding for better visualization
    const minRange = 0.8;
    const effectiveRange = Math.max(actualRange, minRange);
    const topPadding = effectiveRange * 0.15;
    const bottomPadding = effectiveRange * 0.05;
    
    const scaledMin = dataMin - bottomPadding;
    const scaledMax = dataMax + topPadding;
    const scaledRange = scaledMax - scaledMin;
    
    return {
      min: scaledMin,
      max: scaledMax,
      range: scaledRange,
      center: (scaledMin + scaledMax) / 2,
      median: median
    };
  }, []);

  // Update scaling when signal changes
  useEffect(() => {
    if (signal && signal.length > 0) {
      const newScale = calculateScale(signal);
      setSignalScale(newScale);
      setDuration(signal.length / sampleRate);
    }
  }, [signal, calculateScale, sampleRate]);

  // Audio setup and event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    // Reset states when audio changes
    setIsPlaying(false);
    setCurrentTime(0);

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      if (!audio.paused && audio.currentTime !== undefined && !isNaN(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    // Add event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    // Set playback rate
    audio.playbackRate = playbackSpeed;

    // Cleanup
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audioUrl, playbackSpeed]);

  // Update audio playback rate when speed changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audioUrl) {
      audio.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, audioUrl]);

  // Sync with linked viewer
  useEffect(() => {
    if (linkedViewerState && !isDragging && !isSyncingRef.current) {
      isSyncingRef.current = true;
      
      if (linkedViewerState.zoom !== zoom) {
        setZoom(linkedViewerState.zoom);
      }
      if (linkedViewerState.panX !== panX) {
        setPanX(linkedViewerState.panX);
      }
      if (linkedViewerState.panY !== panY) {
        setPanY(linkedViewerState.panY);
      }
      if (linkedViewerState.currentTime !== currentTime) {
        setCurrentTime(linkedViewerState.currentTime);
      }
      if (linkedViewerState.playbackSpeed !== playbackSpeed) {
        setPlaybackSpeed(linkedViewerState.playbackSpeed);
      }
      if (linkedViewerState.isPlaying !== isPlaying) {
        setIsPlaying(linkedViewerState.isPlaying);
      }
      
      // Reset sync flag after a short delay
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedViewerState]);

  // Notify parent of view state changes
  useEffect(() => {
    if (onViewStateChange && !isDragging && !isSyncingRef.current) {
      onViewStateChange({ 
        zoom, 
        panX, 
        panY, 
        currentTime, 
        playbackSpeed,
        isPlaying 
      });
    }
  }, [zoom, panX, panY, currentTime, playbackSpeed, isPlaying, onViewStateChange, isDragging]);

  // Draw grid
  const drawGrid = useCallback((ctx, width, height) => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // Minor grid
    ctx.strokeStyle = isDark ? '#334155' : '#F0F0F0';
    ctx.lineWidth = 0.5;
    
    for (let x = 0; x <= width; x += 5) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= height; y += 5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Major grid
    ctx.strokeStyle = isDark ? '#475569' : '#E0E0E0';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= width; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= height; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, []);

  // Draw axes
  const drawAxes = useCallback((ctx, width, height) => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    ctx.strokeStyle = isDark ? '#e2e8f0' : '#333333';
    ctx.lineWidth = 2;
    
    // Y-axis
    const yAxisX = 40;
    ctx.beginPath();
    ctx.moveTo(yAxisX, 0);
    ctx.lineTo(yAxisX, height - 30);
    ctx.stroke();
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(yAxisX, height - 30);
    ctx.lineTo(width, height - 30);
    ctx.stroke();
    
    // Y-axis labels
    ctx.fillStyle = isDark ? '#d1d5db' : '#555555';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    
    const ySteps = 8;
    const precision = signalScale.range > 5 ? 1 : signalScale.range > 1 ? 2 : 3;
    
    for (let i = 0; i <= ySteps; i++) {
      const y = (height - 30) * (1 - i / ySteps);
      const value = signalScale.min + (signalScale.range * i / ySteps);
      
      if (y > 15 && y < height - 45) {
        ctx.fillText(value.toFixed(precision), yAxisX - 6, y + 3);
      }
    }
    
    // X-axis labels (time)
    ctx.textAlign = 'center';
    const currentSecond = Math.floor(currentTime ?? 0);
    const xSteps = 10;
    
    for (let i = 0; i <= xSteps; i++) {
      const x = yAxisX + ((width - yAxisX) * i / xSteps);
      const timeLabel = currentSecond + (i * 0.1);
      ctx.fillText(`${timeLabel.toFixed(1)}s`, x, height - 10);
    }
  }, [signalScale, currentTime]);

  // Draw signal
  const drawSignal = useCallback((ctx, width, height) => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    if (!signal || signal.length === 0) {
      const yAxisX = 40;
      const plotWidth = width - yAxisX;
      const plotHeight = height - 30;
      
      ctx.strokeStyle = isDark ? '#475569' : '#E0E0E0';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(yAxisX, plotHeight / 2);
      ctx.lineTo(yAxisX + plotWidth, plotHeight / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = isDark ? '#94a3b8' : '#999999';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No signal loaded', yAxisX + plotWidth / 2, plotHeight / 2 - 10);
      return;
    }

    const safeZoom = zoom ?? 1.0;
    const safeCurrentTime = currentTime ?? 0;
    const safePanX = panX ?? 0;
    const safePanY = panY ?? 0;
    
    const timeWindow = 1 / safeZoom; // Zoom affects time window
    const samplesPerWindow = sampleRate * timeWindow;
    
    const yAxisX = 40;
    const plotWidth = width - yAxisX;
    const plotHeight = height - 30;
    
    // Calculate window based on current time and zoom
    const currentSample = safeCurrentTime * sampleRate;
    const windowStartSample = Math.max(0, Math.floor(currentSample - samplesPerWindow / 2 + safePanX * 100));
    
    // Calculate how much of the signal to show (for animation effect)
    const fractionIntoWindow = (safeCurrentTime % timeWindow) / timeWindow;
    const recordedSamples = Math.floor(fractionIntoWindow * samplesPerWindow);
    const recordedPixels = (recordedSamples / samplesPerWindow) * plotWidth;
    
    // Draw signal
    ctx.strokeStyle = isDark ? '#60a5fa' : '#3B82F6';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const signalPath = new Path2D();
    let hasData = false;
    let prevY = null;
    
    const pixelsPerSample = plotWidth / samplesPerWindow;
    
    // Adaptive downsampling for performance with large signals
    // Max points to render: 2 points per pixel for smooth rendering
    const MAX_POINTS = plotWidth * 2;
    const drawStep = Math.max(1, Math.floor(samplesPerWindow / MAX_POINTS));
    
    // Only draw up to current position when playing
    const samplesToShow = isPlaying ? recordedSamples : samplesPerWindow;
    
    // Use min-max decimation for better visual representation when heavily downsampled
    const useMinMaxDecimation = drawStep > 4;
    
    for (let i = 0; i < samplesToShow; i += drawStep) {
      const dataIndex = windowStartSample + i;
      
      if (dataIndex >= 0 && dataIndex < signal.length) {
        const x = yAxisX + (i * pixelsPerSample);
        
        let value;
        if (useMinMaxDecimation && dataIndex + drawStep < signal.length) {
          // For heavily downsampled view, show both min and max in the range
          let min = signal[Math.floor(dataIndex)];
          let max = min;
          for (let j = 0; j < drawStep && dataIndex + j < signal.length; j++) {
            const sample = signal[Math.floor(dataIndex + j)];
            if (sample < min) min = sample;
            if (sample > max) max = sample;
          }
          // Alternate between min and max for visual accuracy
          value = (i / drawStep) % 2 === 0 ? min : max;
        } else {
          value = signal[Math.floor(dataIndex)];
        }
        
        // Apply panY offset
        const adjustedValue = value + (safePanY * signalScale.range * 0.01);
        const normalizedValue = Math.max(0, Math.min(1, (adjustedValue - signalScale.min) / signalScale.range));
        const y = plotHeight * (1 - normalizedValue);
        
        const maxX = isPlaying ? yAxisX + recordedPixels : yAxisX + plotWidth;
        if (x <= maxX && x >= yAxisX) {
          if (!hasData) {
            signalPath.moveTo(x, y);
            hasData = true;
          } else {
            // Smooth transitions for steep changes
            if (prevY !== null && Math.abs(y - prevY) > plotHeight * 0.1) {
              const steps = Math.ceil(Math.abs(y - prevY) / 2);
              for (let step = 1; step <= steps; step++) {
                const interpY = prevY + (y - prevY) * (step / steps);
                const interpX = x - pixelsPerSample * drawStep * (1 - step / steps);
                if (interpX <= maxX) {
                  signalPath.lineTo(interpX, interpY);
                }
              }
            } else {
              signalPath.lineTo(x, y);
            }
          }
          prevY = y;
        }
      }
    }
    
    if (hasData) {
      ctx.stroke(signalPath);
      
      // Median baseline
      const displayPixels = isPlaying ? recordedPixels : plotWidth;
      if (displayPixels > 0) {
        const medianY = plotHeight * (1 - (signalScale.median - signalScale.min) / signalScale.range);
        if (medianY >= 0 && medianY <= plotHeight) {
          ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(100, 100, 100, 0.25)';
          ctx.lineWidth = 0.8;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(yAxisX, medianY);
          ctx.lineTo(yAxisX + displayPixels, medianY);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }
    
    // Recording sweep line
    if (isPlaying && recordedPixels >= 0 && recordedPixels <= plotWidth) {
      const currentX = yAxisX + recordedPixels;
      
      ctx.strokeStyle = isDark ? '#f87171' : '#FF4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(currentX, 0);
      ctx.lineTo(currentX, plotHeight);
      ctx.stroke();
      
      // Glow effect
      ctx.strokeStyle = isDark ? 'rgba(248, 113, 113, 0.3)' : 'rgba(255, 68, 68, 0.3)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(currentX, 0);
      ctx.lineTo(currentX, plotHeight);
      ctx.stroke();
    }
    
    // Display info
    ctx.fillStyle = isDark ? '#94a3b8' : '#6b7280';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    const safePlaybackSpeed = playbackSpeed ?? 1.0;
    const safeDuration = duration ?? 0;
    const windowInfo = `Zoom: ${safeZoom.toFixed(2)}x | Speed: ${safePlaybackSpeed.toFixed(1)}x | Time: ${safeCurrentTime.toFixed(2)}s / ${safeDuration.toFixed(2)}s`;
    ctx.fillText(windowInfo, yAxisX + 10, 20);
  }, [signal, sampleRate, currentTime, zoom, panX, panY, signalScale, isPlaying, playbackSpeed, duration]);

  // Main canvas drawing function
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw components
    drawGrid(ctx, width, height);
    drawAxes(ctx, width, height);
    drawSignal(ctx, width, height);
  }, [drawGrid, drawAxes, drawSignal]);

  // Animation loop for real-time updates during playback
  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        drawCanvas();
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, drawCanvas]);

  // Canvas resize and redraw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = 300; // Fixed height
        drawCanvas();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [drawCanvas]);

  // Redraw when relevant state changes
  useEffect(() => {
    if (!isPlaying) {
      drawCanvas();
    }
  }, [drawCanvas, currentTime, signalScale, zoom, panX, panY, isPlaying]);

  // Control handlers
  const handlePlay = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audioUrl) {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(error => {
        console.error('Play failed:', error);
      });
    } else {
      // Fallback for when there's no audio
      setIsPlaying(true);
    }
  }, [audioUrl]);

  const handlePause = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audioUrl) {
      audio.pause();
    }
    setIsPlaying(false);
  }, [audioUrl]);

  const handleStop = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audioUrl) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  }, [audioUrl]);

  const handleSpeedChange = useCallback((e) => {
    const newSpeed = parseFloat(e.target.value);
    setPlaybackSpeed(newSpeed);
    const audio = audioRef.current;
    if (audio && audioUrl) {
      audio.playbackRate = newSpeed;
    }
  }, [audioUrl]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.5, 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.5, 0.1));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
    setCurrentTime(0);
    setIsPlaying(false);
  }, []);

  // Mouse handlers for panning
  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    setPanX(prev => prev - dx * 10);
    setPanY(prev => prev + dy * 0.5);
    
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e) => {
    if (e.cancelable) e.preventDefault();
    
    const delta = -e.deltaY / 1000;
    setZoom(prev => Math.max(0.1, Math.min(10, prev + delta)));
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Format time display
  const formatTime = useCallback((seconds) => {
    if (seconds === undefined || seconds === null || isNaN(seconds)) {
      return '00:00.0';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  }, []);

  return (
    <div className="cine-signal-viewer">
      {/* Hidden audio element for playback */}
      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          preload="metadata"
          style={{ display: 'none' }}
        />
      )}

      <div className="viewer-header">
        <h3>{title}</h3>
        {signal.length === 0 && <span className="no-signal">No signal loaded</span>}
        {signal.length > 0 && (
          <div className="time-display-header">
            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        className="signal-canvas"
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      />

      <div className="control-panel-viewer">
        {/* Playback controls */}
        <div className="control-group">
          <button onClick={handlePlay} disabled={isPlaying || signal.length === 0} className="ctrl-btn">
            ▶️ Play
          </button>
          <button onClick={handlePause} disabled={!isPlaying} className="ctrl-btn">
            ⏸️ Pause
          </button>
          <button onClick={handleStop} disabled={signal.length === 0} className="ctrl-btn">
            ⏹️ Stop
          </button>
        </div>

        {/* Speed control */}
        <div className="control-group">
          <label>Speed: {(playbackSpeed ?? 1.0).toFixed(1)}x</label>
          <input
            type="range"
            min="0.25"
            max="4"
            step="0.25"
            value={playbackSpeed ?? 1.0}
            onChange={handleSpeedChange}
            className="speed-slider"
            disabled={signal.length === 0}
          />
        </div>

        {/* Zoom controls */}
        <div className="control-group">
          <button onClick={handleZoomIn} className="ctrl-btn" disabled={signal.length === 0}>
            🔍+ Zoom In
          </button>
          <button onClick={handleZoomOut} className="ctrl-btn" disabled={signal.length === 0}>
            🔍- Zoom Out
          </button>
          <button onClick={handleReset} className="ctrl-btn" disabled={signal.length === 0}>
            🔄 Reset
          </button>
        </div>

        {/* Zoom and Pan info */}
        {signal.length > 0 && (
          <div className="view-info">
            <span>Zoom: {(zoom ?? 1.0).toFixed(2)}x</span>
            <span>Pan X: {(panX ?? 0).toFixed(0)}</span>
            <span>Pan Y: {(panY ?? 0).toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
