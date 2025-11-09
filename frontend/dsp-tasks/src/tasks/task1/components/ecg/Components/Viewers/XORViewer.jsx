import React, { useRef, useEffect, useCallback, useState } from 'react';
import XORProcessor from '../../services/XORProcessor';
import { CHANNEL_CONFIG } from '../../constants/MultiChannelConfig';
import './XORViewer.css';

/**
 * XORViewer Component
 * Enhanced XOR visualization with odd/even chunk orga            <p className="info-text">
              <strong>XOR Visualization:</strong> Signal divided into {chunkSize}s chunks. 
              Chunks organized into odd/even arrays. Results displayed in real-time during playback.
            </p>tion and alternating comparisons
 * Implements: odd[0]⊕even[0], even[0]⊕odd[1], odd[1]⊕even[1], ... pattern
 */
const XORViewer = ({
  channels,
  selectedChannels, // Object format - expects single channel selected
  currentTime,
  samplingRate,
  chunkSize = 5,
  onChunkSizeChange,
  isPlaying = false // NEW: Track playback state
}) => {
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [processedXORData, setProcessedXORData] = useState(null);
  const [currentXORChunk, setCurrentXORChunk] = useState(null);

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

  // Process XOR data using the enhanced processor
  useEffect(() => {
    if (!selectedChannel || !channels[selectedChannel]) {
      setProcessedXORData(null);
      setCurrentXORChunk(null);
      return;
    }

    const channelData = channels[selectedChannel];
    
    // Use XORProcessor to compute odd/even chunks and alternating XOR pattern
    const result = XORProcessor.processSignal(
      channelData,
      samplingRate,
      chunkSize,
      currentTime
    );
    
    setProcessedXORData(result);
  }, [channels, selectedChannel, currentTime, chunkSize, samplingRate]);

  // Update current XOR chunk based on playback time
  useEffect(() => {
    if (!processedXORData || !isPlaying) {
      // Only show XOR results during playback
      if (!isPlaying) {
        setCurrentXORChunk(null);
      }
      return;
    }

    // Get current chunk to display
    const chunk = XORProcessor.getCurrentXORChunk(
      processedXORData,
      currentTime,
      chunkSize
    );
    
    setCurrentXORChunk(chunk);
  }, [processedXORData, currentTime, chunkSize, isPlaying]);

  // Draw chunk info overlay
  const drawChunkInfo = useCallback((ctx) => {
    if (!processedXORData) return;

    const { metadata } = processedXORData;
    
    // Draw info box in top-left
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(5, 5, 300, 110);
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.strokeRect(5, 5, 300, 110);
    
    // Draw text info
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Chunk Size: ${chunkSize}s`, 15, 25);
    ctx.fillText(`Channel: ${CHANNEL_CONFIG[selectedChannel]?.name || 'None'}`, 15, 45);
    
    // Show chunk organization
    ctx.fillText(`Odd Chunks: ${metadata.oddCount}`, 15, 65);
    ctx.fillText(`Even Chunks: ${metadata.evenCount}`, 15, 85);
    ctx.fillText(`XOR Comparisons: ${metadata.totalComparisons}`, 15, 105);
  }, [chunkSize, selectedChannel, processedXORData]);

  // Draw current XOR comparison info
  const drawCurrentComparison = useCallback((ctx, width) => {
    if (!currentXORChunk || !isPlaying) {
      // Don't show message if we have processed data (just waiting for play)
      return;
    }

    const { comparison, chunkIndex, totalChunks } = currentXORChunk;
    
    // Draw comparison label box
    const boxWidth = 320;
    const boxHeight = 80;
    const boxX = width - boxWidth - 10;
    const boxY = 10;
    
    ctx.fillStyle = 'rgba(52, 152, 219, 0.95)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeStyle = '#2980b9';
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    
    // Draw comparison text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Current XOR Comparison', boxX + boxWidth / 2, boxY + 25);
    
    ctx.font = 'bold 18px Courier New';
    ctx.fillText(comparison.label, boxX + boxWidth / 2, boxY + 50);
    
    ctx.font = '12px Arial';
    ctx.fillText(`Chunk ${chunkIndex + 1} of ${totalChunks}`, boxX + boxWidth / 2, boxY + 70);
  }, [currentXORChunk, isPlaying]);

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

    if (!selectedChannel || !processedXORData) {
      // Draw empty state message
      ctx.fillStyle = '#7f8c8d';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Select a channel to view XOR visualization', width / 2, height / 2);
      return;
    }

    // Draw grid
    drawGrid(ctx, width, height);

    // Draw XOR signal only if playing
    if (isPlaying && currentXORChunk && currentXORChunk.data) {
      drawXORSignal(ctx, currentXORChunk.data, width, height);
    } else if (processedXORData && !isPlaying) {
      // Show helpful message when data is ready but not playing
      ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#3498db';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('▶ Press Play to view XOR results', width / 2, height / 2);
      ctx.font = '14px Arial';
      ctx.fillStyle = '#7f8c8d';
      ctx.fillText('XOR analysis ready • ' + processedXORData.metadata.totalComparisons + ' comparisons available', width / 2, height / 2 + 30);
    }

    // Draw chunk info
    drawChunkInfo(ctx);
    
    // Draw current comparison info
    drawCurrentComparison(ctx, width);

  }, [canvasSize, selectedChannel, processedXORData, currentXORChunk, isPlaying, drawChunkInfo, drawCurrentComparison]);

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
            
            {processedXORData && (
              <div className="xor-statistics">
                <p className="stat-item">
                  <strong>Odd Chunks:</strong> {processedXORData.metadata.oddCount}
                </p>
                <p className="stat-item">
                  <strong>Even Chunks:</strong> {processedXORData.metadata.evenCount}
                </p>
                <p className="stat-item">
                  <strong>XOR Comparisons:</strong> {processedXORData.metadata.totalComparisons}
                </p>
              </div>
            )}
            
            <p className="info-text">
              <strong>XOR Visualization:</strong> Signal divided into {chunkSize}s chunks.
              Chunks organized into odd/even arrays., Results displayed in real-time during playback.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XORViewer;
