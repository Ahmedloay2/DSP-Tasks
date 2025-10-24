import React, { useRef, useEffect, useCallback, useState } from 'react';
import { CHANNEL_CONFIG, getChannelColor } from '../../constants/MultiChannelConfig';
import './ContinuousViewer.css';

/**
 * ContinuousViewer Component
 * Real-time ECG monitor with streaming data and circular buffers
 * Data scrolls RIGHT TO LEFT like traditional ECG monitors
 */
const ContinuousViewer = ({
  channels,
  selectedChannels,
  samplingRate,
  zoomLevel,
  isPlaying,
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(Date.now());
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [cursorPosition, setCursorPosition] = useState(null);
  const [amplitudes, setAmplitudes] = useState({});

  // Circular buffers for each channel (stores viewport data)
  const [signalBuffers, setSignalBuffers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);

  // Viewport duration (10 seconds of data visible)
  const VIEWPORT_DURATION = 10;
  const maxBufferSize = Math.floor(VIEWPORT_DURATION * samplingRate);

  // Initialize buffers when channels change
  useEffect(() => {
    const buffers = {};
    Object.keys(channels).forEach(chId => {
      buffers[chId] = [];
    });
    setSignalBuffers(buffers);
    setCurrentIndex(0);
    lastTimeRef.current = Date.now();
  }, [channels]);

  // Update canvas size
  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Animation loop - streams data into circular buffers
  useEffect(() => {
    if (!isPlaying || !channels || Object.keys(channels).length === 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      // Calculate how many samples to advance based on real time
      const samplesToAdvance = Math.floor(deltaTime * samplingRate);
      
      if (samplesToAdvance > 0) {
        setCurrentIndex(prevIndex => {
          const newIndex = prevIndex + samplesToAdvance;
          
          // Get the total length of data
          const firstChannelData = Object.values(channels)[0];
          if (!firstChannelData) return prevIndex;
          
          // Loop back to start if we reach the end
          if (newIndex >= firstChannelData.length) {
            return 0;
          }
          
          return newIndex;
        });

        // Update buffers with new samples (streaming effect)
        setSignalBuffers(prevBuffers => {
          const newBuffers = { ...prevBuffers };
          
          Object.keys(selectedChannels).forEach(chId => {
            if (!selectedChannels[chId] || !channels[chId]) return;
            
            const buffer = [...(newBuffers[chId] || [])];
            const channelData = channels[chId];
            
            // Add new samples from the data stream
            for (let i = 0; i < samplesToAdvance; i++) {
              const dataIndex = (currentIndex + i) % channelData.length;
              buffer.push(channelData[dataIndex]);
              
              // Remove old samples when buffer is full (circular buffer)
              if (buffer.length > maxBufferSize) {
                buffer.shift();
              }
            }
            
            newBuffers[chId] = buffer;
          });
          
          return newBuffers;
        });
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, channels, selectedChannels, currentIndex, samplingRate, maxBufferSize]);

  // Handle mouse move for cursor and amplitude measurement
  const handleMouseMove = useCallback((e) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCursorPosition({ x, y });

    // Calculate sample index from cursor position
    const sampleIndex = Math.floor((x / canvasSize.width) * maxBufferSize);
    const newAmplitudes = {};
    
    Object.keys(signalBuffers).forEach(chId => {
      if (selectedChannels[chId] && signalBuffers[chId] && signalBuffers[chId][sampleIndex] !== undefined) {
        newAmplitudes[chId] = signalBuffers[chId][sampleIndex];
      }
    });
    
    setAmplitudes(newAmplitudes);
  }, [canvasSize.width, maxBufferSize, signalBuffers, selectedChannels]);

  const handleMouseLeave = useCallback(() => {
    setCursorPosition(null);
    setAmplitudes({});
  }, []);

  // Helper drawing functions (defined before draw to avoid initialization errors)
  const drawGrid = useCallback((ctx, width, height) => {
    // Grid with gray lines on white background
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    const numVerticalLines = 10;
    for (let i = 0; i <= numVerticalLines; i++) {
      const x = (i / numVerticalLines) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal grid lines based on number of channels
    const selectedCount = Object.values(selectedChannels).filter(Boolean).length;
    if (selectedCount > 0) {
      const channelHeight = height / selectedCount;
      for (let i = 0; i <= selectedCount; i++) {
        const y = i * channelHeight;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
  }, [selectedChannels]);

  const drawSignalWithBuffer = useCallback((ctx, buffer, centerY, channelHeight, width, color) => {
    if (!buffer || buffer.length === 0) return;

    // Calculate scaling
    const bufferMin = Math.min(...buffer);
    const bufferMax = Math.max(...buffer);
    const range = bufferMax - bufferMin || 1;
    const scale = (channelHeight * 0.4 * zoomLevel) / range;

    // Resolve CSS variable to actual color
    const resolvedColor = color.startsWith('var(') 
      ? getComputedStyle(document.documentElement).getPropertyValue(color.slice(4, -1)).trim() 
      : color;

    // Draw baseline
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw signal (LEFT = old data, RIGHT = new data)
    ctx.strokeStyle = resolvedColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const pixelsPerSample = width / maxBufferSize;
    
    for (let i = 0; i < buffer.length; i++) {
      // Position: left side = oldest data, right side = newest data
      const x = i * pixelsPerSample;
      const value = buffer[i];
      const y = centerY - ((value - (bufferMin + range / 2)) * scale);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  }, [maxBufferSize, zoomLevel]);

  const drawCursor = useCallback((ctx, x, height) => {
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    ctx.setLineDash([]);
  }, []);

  const drawSweepLine = useCallback((ctx, x, height) => {
    // Red sweep line at right edge where new data enters
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();

    // Triangle indicator at top
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - 6, 10);
    ctx.lineTo(x + 6, 10);
    ctx.closePath();
    ctx.fill();
  }, []);

  // Draw the continuous view with real-time streaming
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvasSize;

    if (width === 0 || height === 0) return;

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    drawGrid(ctx, width, height);

    // Get selected channels
    const selectedChannelIds = Object.keys(selectedChannels).filter(ch => selectedChannels[ch]);
    
    if (selectedChannelIds.length === 0) {
      // Show empty state
      ctx.fillStyle = '#7f8c8d';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Select channels to view continuous ECG', width / 2, height / 2);
      return;
    }

    // Calculate layout
    const channelHeight = height / selectedChannelIds.length;
    
    // Draw each channel from circular buffer
    selectedChannelIds.forEach((channelId, index) => {
      const buffer = signalBuffers[channelId];
      if (!buffer) return;

      // Get unique color for each channel from CHANNEL_CONFIG
      const color = CHANNEL_CONFIG[channelId]?.color || getChannelColor(channelId);
      
      // Calculate channel vertical position (stack channels)
      const centerY = channelHeight * index + channelHeight / 2;

      // Draw the signal from circular buffer
      drawSignalWithBuffer(ctx, buffer, centerY, channelHeight, width, color);
    });

    // Draw sweep line at right edge (where new data enters)
    const sweepX = width - 2;
    drawSweepLine(ctx, sweepX, height);

    // Draw cursor for hover
    if (cursorPosition) {
      drawCursor(ctx, cursorPosition.x, height);
    }

  }, [canvasSize, signalBuffers, selectedChannels, cursorPosition, drawGrid, drawSignalWithBuffer, drawCursor, drawSweepLine]);

  // Redraw on changes
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="task2-continuous-viewer" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="task2-viewer-header" style={{ backgroundColor: 'transparent', borderBottom: '1px solid #444' }}>
        <h3 className="task2-viewer-title" style={{ color: '#fff' }}>Real-Time ECG Monitor</h3>
        <div className="task2-viewer-info">
          <span className="task2-info-item" style={{ color: '#aaa' }}>
            Window: {VIEWPORT_DURATION}s
          </span>
          <span className="task2-info-item" style={{ color: '#aaa' }}>
            Channels: {Object.values(selectedChannels).filter(Boolean).length}
          </span>
          <span className="task2-info-item" style={{ color: '#aaa' }}>
            Zoom: {zoomLevel.toFixed(1)}x
          </span>
          <span className="task2-info-item" style={{ color: '#aaa' }}>
            Buffer: {Object.values(signalBuffers)[0]?.length || 0} / {maxBufferSize} samples
          </span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="task2-continuous-canvas"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {/* Amplitude display - Always visible for selected channels */}
      {Object.keys(selectedChannels).filter(ch => selectedChannels[ch]).length > 0 && (
        <div className="task2-amplitude-display" style={{ backgroundColor: '#2a2a2a', borderTop: '1px solid #444' }}>
          <h4 className="task2-amplitude-title" style={{ color: '#fff' }}>
            {Object.keys(amplitudes).length > 0 ? 'Amplitude at Cursor:' : 'Hover to see amplitude'}
          </h4>
          <div className="task2-amplitude-grid">
            {Object.keys(selectedChannels)
              .filter(ch => selectedChannels[ch])
              .map((channelId) => (
                <div key={channelId} className="task2-amplitude-item">
                  <div
                    className="task2-amplitude-color"
                    style={{ backgroundColor: CHANNEL_CONFIG[channelId]?.color || getChannelColor(channelId) }}
                  />
                  <span className="task2-amplitude-label" style={{ color: '#aaa' }}>
                    {CHANNEL_CONFIG[channelId]?.name || channelId}:
                  </span>
                  <span className="task2-amplitude-value" style={{ color: '#fff' }}>
                    {amplitudes[channelId] !== undefined 
                      ? amplitudes[channelId].toFixed(4) 
                      : '---'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContinuousViewer;
