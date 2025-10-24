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
 * RecurrenceViewer Component - FIXED color mapping and normalization
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
  const [currentHeatmapData, setCurrentHeatmapData] = useState(null);
  const [lastStoppedTime, setLastStoppedTime] = useState(0);

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
      setCurrentHeatmapData(null);
      return;
    }

    if (!channelX || !channelY) {
      setHeatmapData(null);
      setCurrentHeatmapData(null);
      return;
    }

    const dataX = Array.isArray(channels[channelX]) ? channels[channelX] : [];
    const dataY = Array.isArray(channels[channelY]) ? channels[channelY] : [];

    const maxIndex = Math.min(dataX.length, dataY.length);

    if (maxIndex <= 0) {
      setHeatmapData(null);
      setCurrentHeatmapData(null);
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
        setCurrentHeatmapData(null);
        return;
      }

      const gridSize = points.length > 10000 ? 100 : points.length > 1000 ? 75 : 50;
      const densityResult = createSafeDensityMap(points, gridSize);

      if (!densityResult || !densityResult.grid) {
        console.warn('RecurrenceViewer: Failed to create density map');
        setHeatmapData(null);
        setCurrentHeatmapData(null);
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

      const newHeatmapData = {
        densityMap,
        gridSize,
        points,
        bounds: densityResult.bounds,
        totalPoints: points.length,
        maxDensity,
        minDensity,
        avgDensity: (allDensities.reduce((a, b) => a + b, 0) / allDensities.length).toFixed(2),
      };

      setHeatmapData(newHeatmapData);
      
      // Always start with full dataset for consistency
      setCurrentHeatmapData(newHeatmapData);
    } catch (error) {
      console.error('RecurrenceViewer: Error processing data:', error);
      setHeatmapData(null);
      setCurrentHeatmapData(null);
    }
  }, [channels, channelX, channelY, selectionOrder]);

  // FIXED: Update current heatmap data with proper normalization
  useEffect(() => {
    if (!heatmapData || !heatmapData.points) return;

    // Use a stable maxDensity from the full dataset to prevent color jumps
    const stableMaxDensity = heatmapData.maxDensity || 1;

    if (isPlaying && duration > 0) {
      const progress = Math.min(currentTime / duration, 1);
      const pointsToShow = Math.floor(progress * heatmapData.points.length);
      const subsetPoints = heatmapData.points.slice(0, pointsToShow);
      const subsetDensityResult = createSafeDensityMap(subsetPoints, heatmapData.gridSize);
      
      if (subsetDensityResult && subsetDensityResult.grid) {
        setCurrentHeatmapData({
          ...heatmapData,
          densityMap: subsetDensityResult.grid,
          maxDensity: stableMaxDensity, // Use stable maxDensity to prevent color jumps
          totalPoints: pointsToShow
        });
      }
    } 
    // When stopped, maintain the current view
    else if (!isPlaying && lastStoppedTime !== currentTime) {
      if (currentTime > 0 && duration > 0) {
        const progress = Math.min(currentTime / duration, 1);
        const pointsToShow = Math.floor(progress * heatmapData.points.length);
        const subsetPoints = heatmapData.points.slice(0, pointsToShow);
        const subsetDensityResult = createSafeDensityMap(subsetPoints, heatmapData.gridSize);
        
        if (subsetDensityResult && subsetDensityResult.grid) {
          setCurrentHeatmapData({
            ...heatmapData,
            densityMap: subsetDensityResult.grid,
            maxDensity: stableMaxDensity, // Use stable maxDensity
            totalPoints: pointsToShow
          });
        }
      } else {
        // When at beginning or no duration, show full dataset
        setCurrentHeatmapData(heatmapData);
      }
      setLastStoppedTime(currentTime);
    }
  }, [isPlaying, currentTime, duration, heatmapData, lastStoppedTime]);

  // FIXED: Proper color mapping with correct intensity
  const getDensityColor = useCallback((density, maxDensity) => {
    const colors = DENSITY_COLOR_SCHEMES[colorScheme] || DENSITY_COLOR_SCHEMES.VIRIDIS;
    if (!colors || !Array.isArray(colors)) {
      return '#ffffff';
    }

    // Normalize density with smooth scaling
    const normalizedDensity = maxDensity > 0 ? 
      Math.min(density / maxDensity, 1) : 0;
    
    // Use logarithmic scaling for better visual distribution
    const logNormalized = Math.log1p(normalizedDensity * 10) / Math.log1p(10);
    
    const colorIndex = Math.floor(logNormalized * (colors.length - 1));
    const safeIndex = Math.max(0, Math.min(colors.length - 1, colorIndex));
    const colorObj = colors[safeIndex];
    
    return colorObj?.light || colorObj?.base || '#ffffff';
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

    if (!channelX || !channelY || !currentHeatmapData) {
      ctx.fillStyle = '#7f8c8d';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Select 2 channels to view recurrence heatmap', width / 2, height / 2);
      return;
    }

    const { densityMap, gridSize, maxDensity } = currentHeatmapData;

    if (!Array.isArray(densityMap) || densityMap.length !== gridSize) {
      console.warn('RecurrenceViewer: Invalid density map structure');
      return;
    }

    const padding = 60;
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;

    const cellWidth = plotWidth / gridSize;
    const cellHeight = plotHeight / gridSize;

    // Draw all cells
    for (let i = 0; i < gridSize; i++) {
      if (!Array.isArray(densityMap[i])) continue;
      for (let j = 0; j < gridSize; j++) {
        const density = densityMap[i][j];
        const color = density > 0 ? 
          getDensityColor(density, maxDensity) : 
          'rgba(245, 245, 245, 0.3)'; // Lighter for empty cells
        
        ctx.fillStyle = color;
        const x = padding + j * cellWidth;
        const y = padding + (gridSize - 1 - i) * cellHeight;
        ctx.fillRect(x, y, cellWidth, cellHeight);
      }
    }

    // Draw axes
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, padding, plotWidth, plotHeight);

    // Draw axis labels
    ctx.fillStyle = '#2c3e50';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    // X-axis label
    ctx.fillText(
      CHANNEL_CONFIG[channelX]?.name || 'X Channel',
      padding + plotWidth / 2,
      height - 20
    );
    
    // Y-axis label (rotated)
    ctx.save();
    ctx.translate(20, padding + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(
      CHANNEL_CONFIG[channelY]?.name || 'Y Channel',
      0,
      0
    );
    ctx.restore();

  }, [canvasSize, channelX, channelY, currentHeatmapData, getDensityColor]);

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
              {currentHeatmapData ? currentHeatmapData.totalPoints.toLocaleString() : '0'}
            </span>
          </div>
          <div className="task2-info-row">
            <span className="task2-info-label">Grid Size:</span>
            <span className="task2-info-value">
              {currentHeatmapData ? `${currentHeatmapData.gridSize} × ${currentHeatmapData.gridSize}` : 'N/A'}
            </span>
          </div>
          <div className="task2-info-row">
            <span className="task2-info-label">Max Density:</span>
            <span className="task2-info-value">
              {currentHeatmapData ? currentHeatmapData.maxDensity : 'N/A'}
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
          {!isPlaying && currentHeatmapData && heatmapData && currentHeatmapData.totalPoints < heatmapData.totalPoints && (
            <div className="task2-info-row">
              <span className="task2-info-label">View:</span>
              <span className="task2-info-value">
                Partial ({((currentHeatmapData.totalPoints / heatmapData.totalPoints) * 100).toFixed(1)}%)
              </span>
            </div>
          )}
        </div>

        {/* FIXED: Correct legend with proper color meaning */}
        {DENSITY_COLOR_SCHEMES[colorScheme] && Array.isArray(DENSITY_COLOR_SCHEMES[colorScheme]) && (channelX && channelY) && currentHeatmapData && (
          <div className="task2-recurrence-legend">
            <h5 className="task2-legend-title">📊 Density Legend</h5>
            <div className="task2-legend-gradient">
              {DENSITY_COLOR_SCHEMES[colorScheme]?.map((color, idx) => (
                <div 
                  key={idx}
                  className="task2-legend-color-stop"
                  style={{ 
                    backgroundColor: color?.light || color?.base || '#ffffff',
                    flex: 1
                  }}
                  title={`Density level ${idx + 1}`}
                />
              ))}
            </div>
            <div className="task2-legend-labels">
              <span>Low Density</span>
              <span>Medium</span>
              <span>High Density</span>
            </div>
            <div className="task2-legend-info">
              <p className="task2-legend-description">
                <strong>Color Meaning:</strong> 
              </p>
              <ul className="task2-legend-details">
                <li>
                  <span 
                    className="task2-color-indicator" 
                    style={{ backgroundColor: DENSITY_COLOR_SCHEMES[colorScheme]?.[0]?.light || '#f0f0f0' }}
                  />
                  <strong>Light Colors:</strong> Few points (sparse regions)
                </li>
                <li>
                  <span 
                    className="task2-color-indicator" 
                    style={{ 
                      backgroundColor: DENSITY_COLOR_SCHEMES[colorScheme]?.[Math.floor(DENSITY_COLOR_SCHEMES[colorScheme].length / 2)]?.light || '#ffa500' 
                    }}
                  />
                  <strong>Medium Colors:</strong> Moderate concentration
                </li>
                <li>
                  <span 
                    className="task2-color-indicator" 
                    style={{ 
                      backgroundColor: DENSITY_COLOR_SCHEMES[colorScheme]?.[DENSITY_COLOR_SCHEMES[colorScheme].length - 1]?.light || '#8b0000' 
                    }}
                  />
                  <strong>Dark Colors:</strong> High density - many points clustered
                </li>
              </ul>
              <p className="task2-legend-stats">
                <strong>Current Stats:</strong> Showing {currentHeatmapData.totalPoints.toLocaleString()} of {heatmapData ? heatmapData.totalPoints.toLocaleString() : 0} points. 
                Highest density cell contains <strong>{currentHeatmapData.maxDensity} points</strong>.
              </p>
            </div>
          </div>
        )}

        <div className="task2-recurrence-description">
          <p className="task2-description-text">
            {channelX && channelY && CHANNEL_CONFIG[channelX] && CHANNEL_CONFIG[channelY] ? (
              <>
                <strong>Recurrence Heatmap:</strong> Shows correlation between{' '}
                <strong>{CHANNEL_CONFIG[channelX]?.name}</strong> (X-axis) and{' '}
                <strong>{CHANNEL_CONFIG[channelY]?.name}</strong> (Y-axis).
                Warmer/darker colors indicate higher point density in that region.
              </>
            ) : (
              <>
                <strong>Recurrence Heatmap:</strong> Select exactly 2 channels from the left panel.
                First selection = X-axis, Second selection = Y-axis.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecurrenceViewer;