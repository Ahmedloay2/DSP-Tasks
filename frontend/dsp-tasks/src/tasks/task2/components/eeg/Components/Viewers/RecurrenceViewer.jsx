import React, { useRef, useEffect, useCallback, useState } from 'react';
import { CHANNEL_CONFIG, DENSITY_COLOR_SCHEMES } from '../../constants/MultiChannelConfig';
import './RecurrenceViewer.css';

/**
 * Safe Density Map Calculator
 * Creates a properly structured 2D grid with guaranteed array structure
 */
const createSafeDensityMap = (points, gridSize = 50) => {
  if (!points || !Array.isArray(points) || points.length === 0) {
    return null;
  }

  const xValues = points.map(p => p?.x).filter(v => typeof v === 'number' && !isNaN(v));
  const yValues = points.map(p => p?.y).filter(v => typeof v === 'number' && !isNaN(v));

  if (xValues.length === 0 || yValues.length === 0) {
    return null;
  }

  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);

  const xRange = xMax - xMin;
  const yRange = yMax - yMin;

  const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));

  points.forEach(point => {
    if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
      return;
    }

    let xIndex = xRange === 0 ? Math.floor(gridSize / 2) : Math.floor(((point.x - xMin) / xRange) * (gridSize - 1));
    let yIndex = yRange === 0 ? Math.floor(gridSize / 2) : Math.floor(((point.y - yMin) / yRange) * (gridSize - 1));

    xIndex = Math.max(0, Math.min(gridSize - 1, xIndex));
    yIndex = Math.max(0, Math.min(gridSize - 1, yIndex));

    if (grid[yIndex]?.[xIndex] !== undefined) {
      grid[yIndex][xIndex]++;
    }
  });

  return {
    grid,
    bounds: { xMin, xMax, yMin, yMax },
  };
};

/**
 * RecurrenceViewer Component - COMPLETELY FIXED
 * Displays density-based heatmap showing correlation between two channels
 */
const RecurrenceViewer = ({
  channels,
  selectionOrder,
  isPlaying,
  currentTime,
  duration,
  colorScheme = 'VIRIDIS',
}) => {
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [heatmapData, setHeatmapData] = useState(null);

  const channelX = selectionOrder?.[0] || null;
  const channelY = selectionOrder?.[1] || null;

  // Update canvas size
  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const newWidth = rect.width || 800;
        const newHeight = rect.height || 600;
        setCanvasSize({ width: newWidth, height: newHeight });
        canvasRef.current.width = newWidth;
        canvasRef.current.height = newHeight;
      }
    };

    const timer = setTimeout(updateSize, 100);
    updateSize();
    
    window.addEventListener('resize', updateSize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Compute heatmap data when channels change
  useEffect(() => {
    if (!channels || !selectionOrder) {
      setHeatmapData(null);
      return;
    }

    if (!channelX || !channelY) {
      setHeatmapData(null);
      return;
    }

    const dataX = Array.isArray(channels[channelX]) ? channels[channelX] : [];
    const dataY = Array.isArray(channels[channelY]) ? channels[channelY] : [];

    const maxIndex = Math.min(dataX.length, dataY.length);

    if (maxIndex <= 0) {
      setHeatmapData(null);
      return;
    }

    try {
      const points = [];
      for (let i = 0; i < maxIndex; i++) {
        if (typeof dataX[i] === 'number' && typeof dataY[i] === 'number' && !isNaN(dataX[i]) && !isNaN(dataY[i])) {
          points.push({ x: dataX[i], y: dataY[i], index: i });
        }
      }

      if (points.length === 0) {
        console.warn('RecurrenceViewer: No valid points');
        setHeatmapData(null);
        return;
      }

      const gridSize = points.length > 10000 ? 100 : points.length > 1000 ? 75 : 50;
      const densityResult = createSafeDensityMap(points, gridSize);

      if (!densityResult || !densityResult.grid) {
        console.warn('RecurrenceViewer: Failed to create density map');
        setHeatmapData(null);
        return;
      }

      const densityMap = densityResult.grid;

      let maxDensity = 0;
      let minDensity = Infinity;
      const allDensities = [];

      for (let i = 0; i < gridSize; i++) {
        if (!Array.isArray(densityMap[i])) continue;
        for (let j = 0; j < gridSize; j++) {
          const value = densityMap[i][j];
          if (typeof value === 'number') {
            allDensities.push(value);
            if (value > 0) {
              maxDensity = Math.max(maxDensity, value);
              minDensity = Math.min(minDensity, value);
            }
          }
        }
      }

      if (minDensity === Infinity) minDensity = 0;

      setHeatmapData({
        densityMap,
        gridSize,
        points,
        bounds: densityResult.bounds,
        totalPoints: points.length,
        maxDensity,
        minDensity,
        avgDensity: (allDensities.reduce((a, b) => a + b, 0) / allDensities.length).toFixed(2),
      });
    } catch (error) {
      console.error('RecurrenceViewer: Error processing data:', error);
      setHeatmapData(null);
    }
  }, [channels, channelX, channelY, selectionOrder]);

  // Get color from density value
  const getDensityColor = useCallback((density, maxDensity) => {
    const colors = DENSITY_COLOR_SCHEMES[colorScheme] || DENSITY_COLOR_SCHEMES.VIRIDIS;
    if (!colors || !Array.isArray(colors)) {
      return '#ffffff'; // fallback
    }
    const normalizedDensity = maxDensity > 0 ? density / maxDensity : 0;
    const colorIndex = Math.floor(normalizedDensity * (colors.length - 1));
    const colorObj = colors[Math.min(colorIndex, colors.length - 1)];
    return colorObj?.light || '#ffffff';
  }, [colorScheme]);

  // Main draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvasSize;

    if (width === 0 || height === 0) return;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (!channelX || !channelY || !heatmapData) {
      ctx.fillStyle = '#7f8c8d';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Select 2 channels to view recurrence heatmap', width / 2, height / 2);
      return;
    }

    const { densityMap, gridSize } = heatmapData;

    // Determine which density data to use for animation
    let currentDensityMap = densityMap;
    let currentMaxDensity = heatmapData.maxDensity;

    if (isPlaying && duration > 0 && heatmapData.points) {
      const progress = Math.min(currentTime / duration, 1);
      const pointsToShow = Math.floor(progress * heatmapData.points.length);
      const subsetPoints = heatmapData.points.slice(0, pointsToShow);
      const subsetDensityResult = createSafeDensityMap(subsetPoints, gridSize);
      if (subsetDensityResult && subsetDensityResult.grid) {
        currentDensityMap = subsetDensityResult.grid;
        // Recalculate maxDensity for subset
        let subsetMaxDensity = 0;
        for (let i = 0; i < gridSize; i++) {
          if (!Array.isArray(currentDensityMap[i])) continue;
          for (let j = 0; j < gridSize; j++) {
            const value = currentDensityMap[i][j];
            if (typeof value === 'number' && value > 0) {
              subsetMaxDensity = Math.max(subsetMaxDensity, value);
            }
          }
        }
        currentMaxDensity = subsetMaxDensity || 1; // Avoid division by zero
      }
    }

    if (!Array.isArray(currentDensityMap) || currentDensityMap.length !== gridSize) {
      console.warn('RecurrenceViewer: Invalid density map structure');
      return;
    }

    const padding = 60;
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;

    const cellWidth = plotWidth / gridSize;
    const cellHeight = plotHeight / gridSize;

    for (let i = 0; i < gridSize; i++) {
      if (!Array.isArray(densityMap[i])) continue;
      for (let j = 0; j < gridSize; j++) {
        const density = densityMap[i][j];
        const color = density > 0 ? getDensityColor(density, currentMaxDensity) : 'rgba(245, 245, 245, 0.5)';
        ctx.fillStyle = color;

        const x = padding + j * cellWidth;
        const y = padding + (gridSize - 1 - i) * cellHeight;
        ctx.fillRect(x, y, cellWidth, cellHeight);
      }
    }
  }, [canvasSize, channelX, channelY, heatmapData, getDensityColor, isPlaying, currentTime, duration]);

  // Redraw when anything changes
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="task2-recurrence-viewer">
      <div className="task2-viewer-header">
        <h3 className="task2-viewer-title">Recurrence Heatmap Viewer</h3>
        <div className="task2-axis-info">
          {channelX && channelY && (
            <span className="task2-axis-text">
              <span className="task2-axis-label task2-x-axis">X:</span> {CHANNEL_CONFIG[channelX]?.name}
              {' | '}
              <span className="task2-axis-label task2-y-axis">Y:</span> {CHANNEL_CONFIG[channelY]?.name}
            </span>
          )}
          {(!channelX || !channelY) && (
            <span className="task2-axis-hint">← Select 2 channels (X → Y)</span>
          )}
        </div>
      </div>

      <div className="task2-recurrence-content">
        <div className="task2-canvas-grid task2-single-column">
          <div className="task2-canvas-container">
            <canvas
              ref={canvasRef}
              className="task2-recurrence-canvas"
            />
          </div>
        </div>

        <div className="task2-recurrence-info-panel">
          <div className="task2-info-row">
            <span className="task2-info-label">Data Points:</span>
            <span className="task2-info-value">
              {heatmapData ? heatmapData.totalPoints.toLocaleString() : '0'}
            </span>
          </div>
          <div className="task2-info-row">
            <span className="task2-info-label">Grid Size:</span>
            <span className="task2-info-value">
              {heatmapData ? `${heatmapData.gridSize} × ${heatmapData.gridSize}` : 'N/A'}
            </span>
          </div>
          <div className="task2-info-row">
            <span className="task2-info-label">Color Scheme:</span>
            <span className="task2-info-value">{colorScheme}</span>
          </div>
          {isPlaying && duration > 0 && (
            <div className="task2-info-row">
              <span className="task2-info-label">Progress:</span>
              <span className="task2-info-value">
                {((currentTime / duration) * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        <div className="task2-recurrence-description">
          <p className="task2-description-text">
            {channelX && channelY && CHANNEL_CONFIG[channelX] && CHANNEL_CONFIG[channelY] ? (
              <>
                <strong>Recurrence Heatmap:</strong> Density-based visualization showing correlation between{' '}
                <strong>{CHANNEL_CONFIG[channelX]?.name}</strong> (X-axis) and{' '}
                <strong>{CHANNEL_CONFIG[channelY]?.name}</strong> (Y-axis).
                Colors represent density of recurrence points - warmer colors indicate higher density.
                {isPlaying && ' Progressive animation showing how the heatmap builds up over time.'}
              </>
            ) : (
              <>
                <strong>Recurrence Heatmap:</strong> Select exactly 2 channels from the left panel.
                First selection = X-axis, Second selection = Y-axis.
              </>
            )}
          </p>
        </div>

        {DENSITY_COLOR_SCHEMES[colorScheme] && Array.isArray(DENSITY_COLOR_SCHEMES[colorScheme]) && (channelX && channelY) && heatmapData && (
          <div className="task2-recurrence-legend">
            <h5 className="task2-legend-title">🔥 Density Legend (Points per Grid Cell)</h5>
            <div className="task2-legend-gradient">
              {DENSITY_COLOR_SCHEMES[colorScheme]?.map((color, idx) => (
                <div 
                  key={idx}
                  className="task2-legend-color-stop"
                  style={{ backgroundColor: color?.light || '#ffffff' }}
                  title={`Density level ${idx + 1} of ${DENSITY_COLOR_SCHEMES[colorScheme]?.length || 0}`}
                />
              ))}
            </div>
            <div className="task2-legend-labels">
              <span>High Density</span>
              <span>Medium Density</span>
              <span>0 (Empty)</span>
            </div>
            <div className="task2-legend-info">
              <p className="task2-legend-description">
                <strong>What is density?</strong> Each square represents a region in the 2D space formed by the two selected EEG channels.
                The color intensity shows how many data points fall within that region:
              </p>
              <ul className="task2-legend-details">
                <li><strong>Light/White squares:</strong> Few or no points (sparse regions)</li>
                <li><strong>Warm colors (yellow/orange):</strong> Moderate concentration of points</li>
                <li><strong>Hot colors (red/dark red):</strong> High density - many points clustered together</li>
              </ul>
              <p className="task2-legend-stats">
                <strong>Current Stats:</strong> Grid has {heatmapData.gridSize}×{heatmapData.gridSize} cells. 
                Highest density cell contains <strong>{heatmapData.maxDensity} points</strong>.
                {heatmapData.minDensity > 0 && ` Minimum (non-empty): ${heatmapData.minDensity} points.`}
                {` Average density: ${heatmapData.avgDensity} points per cell.`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecurrenceViewer;