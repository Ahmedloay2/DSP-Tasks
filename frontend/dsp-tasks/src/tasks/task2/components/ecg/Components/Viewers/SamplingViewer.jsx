import React, { useState, useRef, useEffect, useCallback } from 'react';
import './SamplingViewer.css';

/**
 * SamplingViewer Component
 * 
 * Displays ECG signal with the selected sampling frequency
 * Shows play/pause controls and channel visibility toggle
 */
export default function SamplingViewer({ data, samplingFreq, title = 'ECG Signal Viewer' }) {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleChannels, setVisibleChannels] = useState({});
  const animationRef = useRef(null);

  // Initialize visible channels
  useEffect(() => {
    if (data && data.channels) {
      const channels = {};
      Object.keys(data.channels).forEach(ch => {
        channels[ch] = true;
      });
      setVisibleChannels(channels);
    }
  }, [data]);

  // Draw signal on canvas
  const drawSignal = useCallback(() => {
    if (!canvasRef.current || !data) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!data.channels || Object.keys(data.channels).length === 0) return;

    const channelNames = Object.keys(data.channels);
    const channelHeight = canvas.height / channelNames.length;
    const viewWidth = canvas.width;

    // Draw grid and signals
    channelNames.forEach((channelName, idx) => {
      const yOffset = idx * channelHeight;
      const isVisible = visibleChannels[channelName];

      if (!isVisible) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(0, yOffset, canvas.width, channelHeight);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Hidden', canvas.width / 2, yOffset + channelHeight / 2);
        return;
      }

      const signal = data.channels[channelName];
      if (!signal || signal.length === 0) return;

      // Draw channel background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(0, yOffset, canvas.width, channelHeight);

      // Draw grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 5; i++) {
        const y = yOffset + (i * channelHeight) / 5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw signal
      const minVal = Math.min(...signal);
      const maxVal = Math.max(...signal);
      const range = maxVal - minVal || 1;
      const colors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
        '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
        '#6366f1', '#84cc16', '#06b6d4', '#d946ef'
      ];
      const color = colors[idx % colors.length];

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      const samplesPerPixel = Math.max(1, Math.floor(signal.length / viewWidth));
      let firstPoint = true;

      for (let px = 0; px < viewWidth; px += 2) {
        const startIdx = px * samplesPerPixel;

        if (startIdx >= signal.length) break;

        const sample = signal[startIdx];
        const normalized = (sample - minVal) / range;
        const y = yOffset + channelHeight - normalized * channelHeight;

        if (firstPoint) {
          ctx.moveTo(px, y);
          firstPoint = false;
        } else {
          ctx.lineTo(px, y);
        }
      }

      ctx.stroke();

      // Draw channel label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(channelName, 5, yOffset + 15);

      // Draw frequency info
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${samplingFreq} Hz`, canvas.width - 5, yOffset + 15);
    });

    // Draw playback indicator if playing
    if (isPlaying && currentIndex < viewWidth) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(currentIndex, 0);
      ctx.lineTo(currentIndex, canvas.height);
      ctx.stroke();
    }
  }, [data, samplingFreq, visibleChannels, isPlaying, currentIndex]);

  // Animation loop for playback
  useEffect(() => {
    if (!isPlaying) {
      drawSignal();
      return;
    }

    const animate = () => {
      setCurrentIndex(prev => {
        const next = prev + 2;
        if (canvasRef.current && next >= canvasRef.current.width) {
          setIsPlaying(false);
          return 0;
        }
        return next;
      });
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, drawSignal]);

  // Draw on dependency changes
  useEffect(() => {
    drawSignal();
  }, [drawSignal]);

  const handlePlayPause = () => {
    if (currentIndex >= canvasRef.current?.width) {
      setCurrentIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
    drawSignal();
  };

  const toggleChannel = (channelName) => {
    setVisibleChannels(prev => ({
      ...prev,
      [channelName]: !prev[channelName]
    }));
  };

  if (!data || !data.channels) {
    return (
      <div className="task2-sampling-viewer-container">
        <div className="task2-viewer-empty">
          <p>No signal data available. Please process a signal first.</p>
        </div>
      </div>
    );
  }

  const channelNames = Object.keys(data.channels);

  return (
    <div className="task2-sampling-viewer-container">
      <div className="task2-viewer-header">
        <h3>{title}</h3>
        <div className="task2-viewer-info">
          <span className="task2-info-item">Sampling: {samplingFreq} Hz</span>
          <span className="task2-info-item">Channels: {channelNames.length}</span>
        </div>
      </div>

      <div className="task2-viewer-content">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="task2-signal-canvas"
        />

        <div className="task2-viewer-controls">
          <div className="task2-playback-controls">
            <button
              className="task2-control-btn task2-play-btn"
              onClick={handlePlayPause}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button
              className="task2-control-btn task2-stop-btn"
              onClick={handleStop}
              title="Stop"
            >
              ⏹
            </button>
            <span className="task2-playback-time">
              {((currentIndex / (canvasRef.current?.width || 1)) * 100).toFixed(0)}%
            </span>
          </div>

          <div className="task2-channel-toggles">
            <label className="task2-toggle-label">Show/Hide Channels:</label>
            <div className="task2-toggle-buttons">
              {channelNames.map(ch => (
                <button
                  key={ch}
                  className={`task2-channel-toggle ${visibleChannels[ch] ? 'visible' : 'hidden'}`}
                  onClick={() => toggleChannel(ch)}
                  title={`Toggle ${ch}`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="task2-viewer-footer">
        <p>Current Sampling Frequency: <strong>{samplingFreq} Hz</strong></p>
        <p className="task2-effect-info">
          {samplingFreq < 100 && '⚠ Undersampling - Signal aliasing expected'}
          {samplingFreq >= 100 && samplingFreq < 250 && '⚠ Low sampling rate - Some aliasing possible'}
          {samplingFreq >= 250 && samplingFreq <= 500 && '✓ Standard sampling rate - Good signal quality'}
          {samplingFreq > 500 && '✓ High sampling rate - Excellent signal quality'}
        </p>
      </div>
    </div>
  );
}
