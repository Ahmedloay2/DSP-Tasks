import React, { useRef, useEffect, useCallback, useState } from 'react';
import RealEEGService from '../../services/RealEEGService';
import { CHANNEL_CONFIG, POLAR_MODES, getChannelColor } from '../../constants/MultiChannelConfig';
import './PolarViewer.css';

/**
 * PolarViewer Component
 * Displays EEG signals in polar coordinates (amplitude→radius, time→angle)
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
          const polarCoords = RealEEGService.toPolarCoordinates(channelData, 0, endIndex);
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
      const angle = (i / 12) * 2 * Math.PI; // Start from right (0°), go counter-clockwise
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + maxRadius * Math.cos(angle),
        centerY - maxRadius * Math.sin(angle) // Negative Y for proper orientation
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
        centerY - labelRadius * Math.sin(angle) + 4 // Negative Y for proper orientation
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
      const currentIndex = Math.floor(currentTime * samplingRate);

      if (currentIndex < 0 || currentIndex >= channelData.length) return;

      // Get only the current sample point
      const amplitude = channelData[currentIndex];
      
      // Calculate polar coordinates for this single point
      // Normalize amplitude to radius
      const channelStats = RealEEGService.calculateChannelStats(channelData);
      const r = channelStats.range === 0 ? 0.5 : (amplitude - channelStats.min) / channelStats.range;
      
      // Map current time to angle (rotate over time)
      // Use modulo to keep it cycling within 2π
      const totalDuration = channelData.length / samplingRate;
      const normalizedTime = (currentTime % totalDuration) / totalDuration;
      const theta = normalizedTime * 2 * Math.PI;
      
      // Convert to Cartesian with proper orientation
      // Standard polar: 0° = right, 90° = up, 180° = left, 270° = down
      const x = centerX + r * maxRadius * Math.cos(theta);
      const y = centerY - r * maxRadius * Math.sin(theta); // Negative for proper orientation

      // Draw a larger, more visible point
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();

      // Add a ring around it for better visibility
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, 2 * Math.PI);
      ctx.stroke();

      // Draw a line from center to point
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
      
      // Add label showing r and theta values
      ctx.fillStyle = color;
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`r=${r.toFixed(2)}, θ=${(theta * 180 / Math.PI).toFixed(1)}°`, x + 15, y);
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
        const y = centerY - point.y * maxRadius; // Negative Y for proper orientation

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
        const y = centerY - point.y * maxRadius; // Negative Y for proper orientation

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
    <div className="task2-polar-viewer">
      <div className="task2-viewer-header">
        <h3 className="task2-viewer-title">Polar Graph View</h3>
        <div className="task2-polar-mode-control">
          <label className="task2-mode-label">Mode:</label>
          <div className="task2-mode-buttons">
            <button
              className={`task2-mode-btn ${polarMode === POLAR_MODES.LATEST_FIXED ? 'active' : ''}`}
              onClick={() => onPolarModeChange(POLAR_MODES.LATEST_FIXED)}
            >
              Latest Fixed
            </button>
            <button
              className={`task2-mode-btn ${polarMode === POLAR_MODES.CUMULATIVE ? 'active' : ''}`}
              onClick={() => onPolarModeChange(POLAR_MODES.CUMULATIVE)}
            >
              Cumulative
            </button>
          </div>
        </div>
      </div>

      <div className="task2-polar-canvas-container">
        <canvas
          ref={canvasRef}
          className="task2-polar-canvas"
        />
      </div>

      <div className="task2-polar-legend">
        <h4 className="task2-legend-title">Active Channels:</h4>
        <div className="task2-legend-items">
          {Object.keys(selectedChannels)
            .filter(ch => selectedChannels[ch])
            .map(channelId => (
              <div key={channelId} className="task2-legend-item">
                <div
                  className="task2-legend-color"
                  style={{ backgroundColor: CHANNEL_CONFIG[channelId].color }}
                />
                <span className="task2-legend-label">{CHANNEL_CONFIG[channelId].name}</span>
              </div>
            ))}
        </div>
      </div>

      <div className="task2-polar-info">
        <p className="task2-info-text">
          <strong>Polar View:</strong> Amplitude maps to radius, time maps to angle.
          {polarMode === POLAR_MODES.LATEST_FIXED ? 
            ' Latest Fixed mode shows only the current point position.' : 
            ' Cumulative mode shows all signal points from the beginning.'}
        </p>
      </div>
    </div>
  );
};

export default PolarViewer;

