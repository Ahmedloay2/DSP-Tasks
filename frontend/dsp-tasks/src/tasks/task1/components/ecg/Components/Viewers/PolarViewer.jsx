import React, { useRef, useEffect, useCallback, useState } from 'react';
import RealECGDataService from '../../services/RealECGDataService';
import { CHANNEL_CONFIG, POLAR_MODES, getChannelColor } from '../../constants/MultiChannelConfig';
import './PolarViewer.css';

/**
 * PolarViewer Component
 * Displays ECG signals in polar coordinates (amplitude→radius, time→angle)
 */
const PolarViewer = ({
  channels,
  selectedChannels,
  currentTime,
  samplingRate,
  polarMode = POLAR_MODES.LATEST_FIXED,
  onPolarModeChange
}) => {
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [cumulativeData, setCumulativeData] = useState({});

  const VIEWPORT_DURATION = 10; // Fixed 10-second window for Latest Fixed mode

  // Update canvas size
  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height);
        setCanvasSize({ width: size, height: size });
        canvasRef.current.width = size;
        canvasRef.current.height = size;
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Update cumulative data
  useEffect(() => {
    if (polarMode === POLAR_MODES.CUMULATIVE) {
      const selectedChannelIds = Object.keys(selectedChannels).filter(ch => selectedChannels[ch]);
      const newCumulativeData = {};

      selectedChannelIds.forEach(channelId => {
        const channelData = channels[channelId];
        if (channelData) {
          const endIndex = Math.floor(currentTime * samplingRate);
          const polarCoords = RealECGDataService.toPolarCoordinates(channelData, 0, endIndex);
          newCumulativeData[channelId] = polarCoords;
        }
      });

      setCumulativeData(newCumulativeData);
    }
  }, [channels, selectedChannels, currentTime, samplingRate, polarMode]);

  // Draw polar visualization
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

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.48; // Significantly increased for much better visualization

    // Draw polar grid
    drawPolarGrid(ctx, centerX, centerY, maxRadius);

    // Draw data based on mode
    if (polarMode === POLAR_MODES.LATEST_FIXED) {
      drawLatestFixed(ctx, centerX, centerY, maxRadius);
    } else {
      drawCumulative(ctx, centerX, centerY, maxRadius);
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize, channels, selectedChannels, currentTime, samplingRate, polarMode, cumulativeData]);

  const drawPolarGrid = (ctx, centerX, centerY, maxRadius) => {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    // Draw only outer circle (no intermediate circles to avoid separation effect)
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius, 0, 2 * Math.PI);
    ctx.stroke();

    // Radial lines (12 divisions like a clock)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * 2 * Math.PI - Math.PI / 2; // Start from top
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + maxRadius * Math.cos(angle),
        centerY + maxRadius * Math.sin(angle)
      );
      ctx.stroke();

      // Time label
      ctx.fillStyle = '#7f8c8d';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      const labelRadius = maxRadius + 15;
      ctx.fillText(
        `${i}`,
        centerX + labelRadius * Math.cos(angle),
        centerY + labelRadius * Math.sin(angle) + 4
      );
    }

    // Center point
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
    ctx.fill();
  };

  const drawLatestFixed = (ctx, centerX, centerY, maxRadius) => {
    const selectedChannelIds = Object.keys(selectedChannels).filter(ch => selectedChannels[ch]);
    
    selectedChannelIds.forEach(channelId => {
      const channelData = channels[channelId];
      if (!channelData) return;

      const color = getChannelColor(channelId);
      const startTime = Math.max(0, currentTime - VIEWPORT_DURATION);
      const startIndex = Math.floor(startTime * samplingRate);
      const endIndex = Math.floor(currentTime * samplingRate);
      const sampleCount = endIndex - startIndex;

      if (sampleCount <= 0) return;

      const polarCoords = RealECGDataService.toPolarCoordinates(channelData, startIndex, sampleCount);

      // Draw polar trace
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      polarCoords.forEach((point, i) => {
        const x = centerX + point.x * maxRadius;
        const y = centerY + point.y * maxRadius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Mark current position
      if (polarCoords.length > 0) {
        const lastPoint = polarCoords[polarCoords.length - 1];
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(
          centerX + lastPoint.x * maxRadius,
          centerY + lastPoint.y * maxRadius,
          4,
          0,
          2 * Math.PI
        );
        ctx.fill();
      }
    });
  };

  const drawCumulative = (ctx, centerX, centerY, maxRadius) => {
    Object.entries(cumulativeData).forEach(([channelId, polarCoords]) => {
      if (polarCoords.length === 0) return;

      const color = getChannelColor(channelId);

      // Draw cumulative trace with fading effect
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 1;
      ctx.beginPath();

      polarCoords.forEach((point, i) => {
        const x = centerX + point.x * maxRadius;
        const y = centerY + point.y * maxRadius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
      ctx.globalAlpha = 1.0;

      // Highlight recent portion
      const recentCount = Math.min(500, polarCoords.length);
      const recentData = polarCoords.slice(-recentCount);

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      recentData.forEach((point, i) => {
        const x = centerX + point.x * maxRadius;
        const y = centerY + point.y * maxRadius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    });
  };

  // Redraw on changes
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="polar-viewer">
      <div className="viewer-header">
        <h3 className="viewer-title">Polar Graph View</h3>
        <div className="polar-mode-control">
          <label className="mode-label">Mode:</label>
          <div className="mode-buttons">
            <button
              className={`mode-btn ${polarMode === POLAR_MODES.LATEST_FIXED ? 'active' : ''}`}
              onClick={() => onPolarModeChange(POLAR_MODES.LATEST_FIXED)}
            >
              Latest Fixed
            </button>
            <button
              className={`mode-btn ${polarMode === POLAR_MODES.CUMULATIVE ? 'active' : ''}`}
              onClick={() => onPolarModeChange(POLAR_MODES.CUMULATIVE)}
            >
              Cumulative
            </button>
          </div>
        </div>
      </div>

      <div className="polar-canvas-container">
        <canvas
          ref={canvasRef}
          className="polar-canvas"
        />
      </div>

      <div className="polar-legend">
        <h4 className="legend-title">Active Channels:</h4>
        <div className="legend-items">
          {Object.keys(selectedChannels)
            .filter(ch => selectedChannels[ch])
            .map(channelId => (
              <div key={channelId} className="legend-item">
                <div
                  className="legend-color"
                  style={{ backgroundColor: CHANNEL_CONFIG[channelId].color }}
                />
                <span className="legend-label">{CHANNEL_CONFIG[channelId].name}</span>
              </div>
            ))}
        </div>
      </div>

      <div className="polar-info">
        <p className="info-text">
          <strong>Polar View:</strong> Amplitude maps to radius, time maps to angle.
          {polarMode === POLAR_MODES.LATEST_FIXED ? 
            ' Showing last 10 seconds.' : 
            ' Showing cumulative trace from beginning.'}
        </p>
      </div>
    </div>
  );
};

export default PolarViewer;
