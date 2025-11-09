import React, { useRef, useEffect, useCallback, useState } from 'react';
import { CHANNEL_CONFIG } from '../../constants/MultiChannelConfig';
import './XORViewer.css';

/**
 * XORViewer Component
 * Displays XOR visualization by comparing consecutive chunks
 * Shows chunk 1 (blue), chunk 2 (green), and XOR result (highlighting differences)
 */
const XORViewer = ({
  channels,
  selectedChannels,
  currentTime,
  samplingRate,
  chunkSize = 5,
  onChunkSizeChange
}) => {
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [chunk1Data, setChunk1Data] = useState(null);
  const [chunk2Data, setChunk2Data] = useState(null);
  const [xorResult, setXorResult] = useState(null);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);

  // Get the single selected channel
  const selectedChannel = Object.keys(selectedChannels).find(ch => selectedChannels[ch]) || null;

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

  // Process chunks based on current time - continuous streaming with reset per chunk
// Process chunks based on current time - true real-time streaming
  useEffect(() => {
    if (!selectedChannel || !channels[selectedChannel]) {
      setChunk1Data(null);
      setChunk2Data(null);
      setXorResult(null);
      return;
    }

    const channelData = channels[selectedChannel];
    const samplesPerChunk = Math.floor(chunkSize * samplingRate);
    
    // Calculate which pair of chunks we're visualizing
    const pairIndex = Math.floor(currentTime / (chunkSize * 2));
    const timeInPair = currentTime % (chunkSize * 2);
    
    setCurrentChunkIndex(pairIndex);
    
    // Get chunk boundaries
    const chunk1Start = pairIndex * 2 * samplesPerChunk;
    const chunk2Start = chunk1Start + samplesPerChunk;
    
    if (chunk1Start >= channelData.length) {
      setChunk1Data(null);
      setChunk2Data(null);
      setXorResult(null);
      return;
    }
    
    // Phase 1: Stream chunk 1 sample by sample (first chunkSize seconds)
    if (timeInPair < chunkSize) {
      // Calculate how many samples we've streamed based on real time
      const elapsedInChunk1 = timeInPair;
      const samplesToStream = Math.floor(elapsedInChunk1 * samplingRate);
      
      const chunk1End = chunk1Start + samplesPerChunk;
      const fullChunk1 = channelData.slice(chunk1Start, Math.min(chunk1End, channelData.length));
      
      // Stream only the samples we've reached in real time
      const chunk1 = fullChunk1.slice(0, Math.min(samplesToStream, fullChunk1.length));
      
      setChunk1Data(chunk1.length > 0 ? chunk1 : null);
      setChunk2Data(null);
      setXorResult(null);
    } 
    // Phase 2: Keep full chunk 1, stream chunk 2 sample by sample
    else {
      const chunk1End = chunk1Start + samplesPerChunk;
      const fullChunk1 = channelData.slice(chunk1Start, Math.min(chunk1End, channelData.length));
      setChunk1Data(fullChunk1.length > 0 ? fullChunk1 : null);
      
      if (chunk2Start < channelData.length) {
        const elapsedInChunk2 = timeInPair - chunkSize;
        const samplesToStream = Math.floor(elapsedInChunk2 * samplingRate);
        
        const chunk2End = chunk2Start + samplesPerChunk;
        const fullChunk2 = channelData.slice(chunk2Start, Math.min(chunk2End, channelData.length));
        
        // Stream only the samples we've reached in real time
        const chunk2 = fullChunk2.slice(0, Math.min(samplesToStream, fullChunk2.length));
        
        setChunk2Data(chunk2.length > 0 ? chunk2 : null);
        
        // Compute XOR progressively for streamed portion
        if (fullChunk1.length > 0 && chunk2.length > 0) {
          const xor = [];
          for (let i = 0; i < chunk2.length; i++) {
            const diff = Math.abs(fullChunk1[i] - chunk2[i]);
            xor.push(diff);
          }
          setXorResult(xor);
        } else {
          setXorResult(null);
        }
      } else {
        setChunk2Data(null);
        setXorResult(null);
      }
    }
    
  }, [channels, selectedChannel, currentTime, chunkSize, samplingRate]);

  // Draw chunk info overlay - SIMPLIFIED
  const drawChunkInfo = useCallback((ctx) => {
    if (!selectedChannel) return;

    // Draw simple info box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(5, 5, 280, 70);
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.strokeRect(5, 5, 280, 70);
    
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Channel: ${CHANNEL_CONFIG[selectedChannel]?.name || 'None'}`, 15, 25);
    ctx.fillText(`Chunk Size: ${chunkSize}s`, 15, 45);
    ctx.fillText(`Current Chunk: ${currentChunkIndex}`, 15, 65);
  }, [selectedChannel, chunkSize, currentChunkIndex]);

  // Draw XOR visualization
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvasSize;

    if (width === 0 || height === 0) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (!selectedChannel) {
      // Draw empty state message
      ctx.fillStyle = '#7f8c8d';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Select a channel to view XOR visualization', width / 2, height / 2);
      return;
    }

    // Draw grid
    drawGrid(ctx, width, height);

    // Calculate samplesPerChunk for full-width rendering
    const samplesPerChunk = Math.floor(chunkSize * samplingRate);

    // Draw signals - always show when we have data (not just when playing)
    if (selectedChannel && chunk1Data) {
      // Draw chunk 1 (blue)
      drawChunkSignal(ctx, chunk1Data, width, height, 'rgba(52, 152, 219, 0.7)', samplesPerChunk);
      
      // If we have chunk 2 and XOR result, overlay them
      if (chunk2Data && xorResult) {
        // Draw chunk 2 (green, semi-transparent)
        drawChunkSignal(ctx, chunk2Data, width, height, 'rgba(46, 204, 113, 0.5)', samplesPerChunk);
        
        // Draw XOR result (red/yellow where different, faded where same)
        drawXORSignal(ctx, xorResult, width, height, samplesPerChunk);
      }
    } else if (!selectedChannel) {
      // Only show message when no channel selected
      ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#3498db';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Select a channel to view XOR visualization', width / 2, height / 2);
      ctx.font = '14px Arial';
      ctx.fillStyle = '#7f8c8d';
      ctx.fillText('Streaming comparison will start when you play', width / 2, height / 2 + 30);
    }

    // Draw chunk info
    drawChunkInfo(ctx);

  }, [canvasSize, selectedChannel, chunk1Data, chunk2Data, xorResult, chunkSize, samplingRate, drawChunkInfo]);

  const drawGrid = (ctx, width, height) => {
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

    // Horizontal grid lines
    const numHorizontalLines = 8;
    for (let i = 0; i <= numHorizontalLines; i++) {
      const y = (i / numHorizontalLines) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Center line
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  };

  const drawChunkSignal = (ctx, data, width, height, color, totalSamples) => {
    if (!data || data.length === 0) return;

    // Use totalSamples (full chunk size) for X-axis mapping to prevent compression
    const samplesForWidth = totalSamples || data.length;
    
    // Calculate scaling
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const verticalScale = (height * 0.7) / range;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < data.length; i++) {
      const x = (i / samplesForWidth) * width;  // Map to full chunk width
      const y = height / 2 - ((data[i] - min - range / 2) * verticalScale);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  };

  const drawXORSignal = (ctx, data, width, height, totalSamples) => {
    if (data.length === 0) return;

    // Use totalSamples for X-axis mapping
    const samplesForWidth = totalSamples || data.length;
    
    // Simple XOR logic: where difference is near zero, erase (white)
    // where difference exists, keep visible
    
    const max = Math.max(...data);
    const threshold = max * 0.05; // 5% threshold for "same"

    // Draw erasure effect
    for (let i = 0; i < data.length; i++) {
      const x = (i / samplesForWidth) * width;  // Map to full chunk width
      const diff = data[i];
      
      if (diff < threshold) {
        // Same values - erase by drawing white vertical line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }
  };

  // Redraw on changes
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="xor-viewer">
      <div className="viewer-header">
        <h3 className="viewer-title">XOR Graph View</h3>
        <div className="chunk-size-control">
          <label className="chunk-label">Chunk Size:</label>
          <input
            type="range"
            min={1}
            max={10}
            step={0.5}
            value={chunkSize}
            onChange={(e) => onChunkSizeChange(parseFloat(e.target.value))}
            className="chunk-slider"
          />
          <span className="chunk-value">{chunkSize}s</span>
        </div>
      </div>

      <div className="xor-content">

        <div className="xor-right">
          <canvas
            ref={canvasRef}
            className="xor-canvas"
          />

          <div className="xor-info">
            <div className="selected-channel-info">
              {selectedChannel ? (
                <>
                  <div
                    className="channel-indicator"
                    style={{ backgroundColor: CHANNEL_CONFIG[selectedChannel].color }}
                  />
                  <span className="channel-text">
                    <strong>Selected:</strong> {CHANNEL_CONFIG[selectedChannel].name}
                  </span>
                </>
              ) : (
                <span className="no-channel-text">← Select 1 channel to view XOR</span>
              )}
            </div>
            
            {chunk1Data && chunk2Data && (
              <div className="xor-statistics">
                <p className="stat-item">
                  <strong>Chunk 1 Length:</strong> {chunk1Data.length} samples
                </p>
                <p className="stat-item">
                  <strong>Chunk 2 Length:</strong> {chunk2Data.length} samples
                </p>
                <p className="stat-item">
                  <strong>XOR Result:</strong> {xorResult ? xorResult.length : 0} samples
                </p>
              </div>
            )}
            
            <p className="info-text">
              <strong>XOR Visualization:</strong> Signal divided into {chunkSize}s chunks. 
              Chunk 1 (blue) displays fully, then Chunk 2 (green) overlays progressively. 
              Where signals match, they erase each other (white). Where different, both remain visible.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XORViewer;
