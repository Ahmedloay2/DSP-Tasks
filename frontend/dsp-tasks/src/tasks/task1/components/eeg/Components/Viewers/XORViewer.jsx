import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import RealEEGDataService from '../../services/RealEEGDataService';
import { CHANNEL_CONFIG, getDynamicChannelConfig } from '../../constants/MultiChannelConfig';
import './XORViewer.css';

/**
 * XORViewer Component
 * Displays XOR visualization of a single EEG channel with configurable time chunks
 */
const XORViewer = ({
  channels,
  selectedChannels, // Object format - expects single channel selected
  currentTime,
  samplingRate,
  chunkSize = 5,
  onChunkSizeChange,
  channelMetadata = null,
  channelNames = []
}) => {
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [xorData, setXorData] = useState([]);

  // Get the single selected channel
  const selectedChannel = Object.keys(selectedChannels).find(ch => selectedChannels[ch]) || null;

  // Get channel config (static or dynamic)
  const channelConfig = useMemo(() => {
    if (!selectedChannel) return null;
    const channelIndex = channelNames.indexOf(selectedChannel);
    return getDynamicChannelConfig(
      selectedChannel,
      channelIndex,
      channelMetadata?.channelNames
    );
  }, [selectedChannel, channelNames, channelMetadata]);

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

  // Compute XOR overlay data - divide signal into time chunks and overlay them
  useEffect(() => {
    if (!selectedChannel || !channels[selectedChannel]) {
      setXorData([]);
      return;
    }

    const channelData = channels[selectedChannel];
    const chunkDuration = chunkSize; // in seconds (viewer time window)
    const samplesPerChunk = Math.floor(chunkDuration * samplingRate);
    
    if (samplesPerChunk === 0) {
      setXorData([]);
      return;
    }
    
    // Calculate how many complete chunks we have up to currentTime
    const endSample = Math.floor(currentTime * samplingRate);
    const numChunks = Math.max(1, Math.floor(endSample / samplesPerChunk));
    
    if (numChunks === 0) {
      setXorData([]);
      return;
    }
    
    // Store all chunks for XOR overlay
    const chunks = [];
    for (let chunkIdx = 0; chunkIdx < numChunks; chunkIdx++) {
      const startIdx = chunkIdx * samplesPerChunk;
      const endIdx = Math.min(startIdx + samplesPerChunk, channelData.length);
      const chunk = channelData.slice(startIdx, endIdx);
      
      // Pad chunk if it's shorter than samplesPerChunk
      if (chunk.length < samplesPerChunk) {
        const padding = new Array(samplesPerChunk - chunk.length).fill(0);
        chunks.push([...chunk, ...padding]);
      } else {
        chunks.push(chunk);
      }
    }
    
    // XOR Operation: Plot chunks on top of each other
    // Where signals are identical, they cancel out (subtract)
    // Where signals differ, the difference is visible (accumulate)
    const xorResult = new Array(samplesPerChunk).fill(0);
    
    for (let i = 0; i < samplesPerChunk; i++) {
      // Start with first chunk
      let accumulated = chunks[0][i];
      
      // For each subsequent chunk, apply XOR-like operation
      for (let chunkIdx = 1; chunkIdx < chunks.length; chunkIdx++) {
        const currentValue = chunks[chunkIdx][i];
        
        // XOR logic: if values are similar (within threshold), they cancel
        // if different, accumulate the difference
        const threshold = 0.01; // similarity threshold
        const diff = Math.abs(accumulated - currentValue);
        
        if (diff < threshold) {
          // Similar values cancel out
          accumulated = accumulated * 0.1; // reduce to near zero
        } else {
          // Different values accumulate
          accumulated += (currentValue - accumulated) * 0.5;
        }
      }
      
      xorResult[i] = accumulated;
    }
    
    setXorData(xorResult);
  }, [channels, selectedChannel, currentTime, chunkSize, samplingRate]);

  // Draw chunk info overlay
  const drawChunkInfo = useCallback((ctx) => {
    // Draw info box in top-left
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(5, 5, 280, 90);
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.strokeRect(5, 5, 280, 90);
    
    // Draw text info
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Chunk Size: ${chunkSize}s`, 15, 25);
    ctx.fillText(`Channel: ${channelConfig?.name || 'None'}`, 15, 45);
    
    // Calculate number of chunks
    const samplesPerChunk = Math.floor(chunkSize * samplingRate);
    const endSample = Math.floor(currentTime * samplingRate);
    const numChunks = Math.floor(endSample / samplesPerChunk);
    ctx.fillText(`Overlaid Chunks: ${numChunks}`, 15, 65);
    
    // Draw XOR description
    ctx.font = '11px Arial';
    ctx.fillStyle = '#7f8c8d';
    ctx.fillText('Identical regions cancel, differences remain', 15, 85);
  }, [chunkSize, currentTime, samplingRate, channelConfig]);

  // Draw XOR visualization with sweep animation
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

    if (xorData.length === 0 || !selectedChannel) {
      // Draw empty state message
      ctx.fillStyle = '#7f8c8d';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Select a channel to view XOR visualization', width / 2, height / 2);
      return;
    }

    // Draw grid
    drawGrid(ctx, width, height);

    // Draw XOR signal (no animation, show full graph)
    drawXORSignal(ctx, xorData, width, height);

    // Draw chunk info
    drawChunkInfo(ctx, width);

  }, [canvasSize, xorData, selectedChannel, drawChunkInfo]);

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

  const drawXORSignal = (ctx, data, width, height) => {
    if (data.length === 0) return;

    // Calculate scaling
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const verticalScale = (height * 0.8) / range;

    // Draw complete XOR waveform with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#e74c3c');
    gradient.addColorStop(0.5, '#f39c12');
    gradient.addColorStop(1, '#27ae60');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < data.length; i++) {
      const x = (i / data.length) * width;
      const y = height / 2 - ((data[i] - min - range / 2) * verticalScale);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
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
              {selectedChannel && channelConfig ? (
                <>
                  <div
                    className="channel-indicator"
                    style={{ backgroundColor: channelConfig.color }}
                  />
                  <span className="channel-text">
                    <strong>Selected:</strong> {channelConfig.name}
                  </span>
                </>
              ) : (
                <span className="no-channel-text">← Select 1 channel to view XOR</span>
              )}
            </div>
            <p className="info-text">
              <strong>XOR Visualization:</strong> Signal divided into {chunkSize}s time chunks. 
              Each chunk is overlaid on previous ones - identical regions cancel out, differences remain visible.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XORViewer;
