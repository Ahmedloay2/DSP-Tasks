import React, { useRef, useEffect, useCallback, useState } from 'react';
import RealEEGDataService from '../../services/RealEEGDataService';
import { CHANNEL_CONFIG, DENSITY_COLOR_SCHEMES } from '../../constants/MultiChannelConfig';
import './RecurrenceViewer.css';

/**
 * RecurrenceViewer Component
 * Displays both static (complete) and animated (progressive) recurrence plots
 * First selected channel = X-axis, Second selected channel = Y-axis
 */
const RecurrenceViewer = ({
  channels,
  selectionOrder, // Array of channel IDs in order of selection [channelX, channelY]
  samplingRate,
  isPlaying,     // From parent's TimeControlPanel
  currentTime,   // From parent's TimeControlPanel
  duration,      // From parent's TimeControlPanel
  colorScheme = 'HEAT',
}) => {
  const staticCanvasRef = useRef(null);
  const animatedCanvasRef = useRef(null);
  
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [scatterPoints, setScatterPoints] = useState([]);
  const [densityMap, setDensityMap] = useState([]);
  
  // Animation states (controlled by parent via isPlaying)
  const [animationProgress, setAnimationProgress] = useState(0);
  const [showAnimated, setShowAnimated] = useState(false); // Show animated view when true

  // Extract X and Y channels from selection order
  const channelX = selectionOrder[0] || null;
  const channelY = selectionOrder[1] || null;

  // Update canvas size
  useEffect(() => {
    const updateSize = () => {
      if (staticCanvasRef.current) {
        const rect = staticCanvasRef.current.getBoundingClientRect();
        const newWidth = rect.width || 800; // Fallback width
        const newHeight = rect.height || 600; // Fallback height
        setCanvasSize({ width: newWidth, height: newHeight });
        staticCanvasRef.current.width = newWidth;
        staticCanvasRef.current.height = newHeight;
      }
      if (animatedCanvasRef.current) {
        const rect = animatedCanvasRef.current.getBoundingClientRect();
        const newWidth = rect.width || 800;
        const newHeight = rect.height || 600;
        animatedCanvasRef.current.width = newWidth;
        animatedCanvasRef.current.height = newHeight;
      }
    };

    // Initial update with slight delay to ensure DOM is ready
    const timer = setTimeout(updateSize, 100);
    updateSize();
    
    window.addEventListener('resize', updateSize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSize);
    };
  }, [showAnimated]);

  // Compute recurrence data - generate scatter points
  useEffect(() => {
    if (!channelX || !channelY) {
      setScatterPoints([]);
      setDensityMap([]);
      return;
    }

    const dataX = channels[channelX];
    const dataY = channels[channelY];

    if (!dataX || !dataY) {
      setScatterPoints([]);
      setDensityMap([]);
      return;
    }

    const maxIndex = Math.min(dataX.length, dataY.length);
    
    if (maxIndex <= 0) {
      setScatterPoints([]);
      setDensityMap([]);
      return;
    }

    const points = RealEEGDataService.createRecurrencePlot(dataX, dataY, 0, maxIndex);
    
    setScatterPoints(points);
    setAnimationProgress(0);

    // Calculate density map for static view (only for large datasets)
    if (points.length > 100) {
      try {
        const density = RealEEGDataService.calculateDensityMap(points, 50);
        setDensityMap(Array.isArray(density) ? density : []);
      } catch (error) {
        console.error('RecurrenceViewer: Error calculating density map:', error);
        setDensityMap([]);
      }
    } else {
      setDensityMap([]);
    }

  }, [channels, channelX, channelY, samplingRate]);

  // Sync animation progress with parent's currentTime
  useEffect(() => {
    if (scatterPoints.length === 0 || !duration) return;

    // Convert currentTime to animation progress (point index)
    const progress = (currentTime / duration) * scatterPoints.length;
    setAnimationProgress(progress);

    // Show animated view when playing, static when stopped
    if (isPlaying) {
      setShowAnimated(true);
    } else if (currentTime === 0) {
      setShowAnimated(false); // Return to static view when stopped
    }
  }, [isPlaying, currentTime, duration, scatterPoints.length]);

  // Get color from density value
  const getDensityColor = useCallback((density, maxDensity) => {
    const colors = DENSITY_COLOR_SCHEMES[colorScheme] || DENSITY_COLOR_SCHEMES.HEAT;
    const normalizedDensity = maxDensity > 0 ? density / maxDensity : 0;
    const colorIndex = Math.floor(normalizedDensity * (colors.length - 1));
    return colors[Math.min(colorIndex, colors.length - 1)];
  }, [colorScheme]);

  // Draw STATIC recurrence visualization (complete graph)
  const drawStatic = useCallback(() => {
    const canvas = staticCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvasSize;

    if (width === 0 || height === 0) {
      return;
    }
    
    if (scatterPoints.length === 0) {
      // Clear and show empty state
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#7f8c8d';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Select 2 channels to view recurrence plot', width / 2, height / 2);
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Calculate bounds with padding
    const padding = 60;
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;

    // Calculate data bounds
    const xValues = scatterPoints.map(p => p.x);
    const yValues = scatterPoints.map(p => p.y);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;

    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * plotWidth;
      const y = padding + (i / 10) * plotHeight;
      
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    
    const chXName = CHANNEL_CONFIG[channelX]?.name || 'X';
    const chYName = CHANNEL_CONFIG[channelY]?.name || 'Y';
    
    ctx.fillText(chXName, padding + plotWidth / 2, height - 20);
    
    ctx.save();
    ctx.translate(20, padding + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(chYName, 0, 0);
    ctx.restore();

    // Draw density map or scatter points
    if (densityMap.length > 0) {
      try {
        const gridSize = densityMap.length;
        const cellWidth = plotWidth / gridSize;
        const cellHeight = plotHeight / gridSize;
        const maxDensity = Math.max(...densityMap.flat().filter(d => typeof d === 'number'));

        for (let i = 0; i < gridSize; i++) {
          if (!densityMap[i] || !Array.isArray(densityMap[i])) continue;
          for (let j = 0; j < gridSize; j++) {
            const density = densityMap[i][j];
            if (density === 0 || density === undefined || typeof density !== 'number') continue;

            const color = getDensityColor(density, maxDensity);
            ctx.fillStyle = color;

            const x = padding + j * cellWidth;
            const y = padding + (gridSize - 1 - i) * cellHeight;

            ctx.fillRect(x, y, cellWidth, cellHeight);
          }
        }
      } catch (error) {
        console.error('Error drawing density map:', error);
      }
    } else {
      // Draw all points
      ctx.fillStyle = 'rgba(52, 152, 219, 0.7)';
      scatterPoints.forEach(point => {
        const x = padding + ((point.x - xMin) / xRange) * plotWidth;
        const y = padding + plotHeight - ((point.y - yMin) / yRange) * plotHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Add title
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Complete Recurrence Plot', width / 2, 30);
    ctx.font = '12px Arial';
    ctx.fillText(`${scatterPoints.length.toLocaleString()} points`, width / 2, 50);

  }, [canvasSize, scatterPoints, densityMap, channelX, channelY, getDensityColor]);

  // Draw ANIMATED recurrence visualization (progressive)
  const drawAnimated = useCallback(() => {
    const canvas = animatedCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    if (width === 0 || height === 0 || scatterPoints.length === 0) {
      // Clear and show empty state
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#7f8c8d';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No data available', width / 2, height / 2);
      return;
    }

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const padding = 60;
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;

    // Calculate data bounds (same as static for consistency)
    const xValues = scatterPoints.map(p => p.x);
    const yValues = scatterPoints.map(p => p.y);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;

    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * plotWidth;
      const y = padding + (i / 10) * plotHeight;
      
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    
    const chXName = CHANNEL_CONFIG[channelX]?.name || 'X';
    const chYName = CHANNEL_CONFIG[channelY]?.name || 'Y';
    
    ctx.fillText(chXName, padding + plotWidth / 2, height - 20);
    
    ctx.save();
    ctx.translate(20, padding + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(chYName, 0, 0);
    ctx.restore();

    // Draw points up to current progress
    const pointsToDraw = Math.floor(animationProgress);
    
    for (let i = 0; i < pointsToDraw; i++) {
      const point = scatterPoints[i];
      const x = padding + ((point.x - xMin) / xRange) * plotWidth;
      const y = padding + plotHeight - ((point.y - yMin) / yRange) * plotHeight;
      
      // Fade in effect for recent points
      const age = pointsToDraw - i;
      const opacity = age < 100 ? 0.3 + (age / 100) * 0.4 : 0.7;
      
      ctx.fillStyle = `rgba(231, 76, 60, ${opacity})`;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw current point being added (highlighted)
    if (pointsToDraw < scatterPoints.length) {
      const currentPoint = scatterPoints[pointsToDraw];
      const x = padding + ((currentPoint.x - xMin) / xRange) * plotWidth;
      const y = padding + plotHeight - ((currentPoint.y - yMin) / yRange) * plotHeight;
      
      ctx.fillStyle = 'rgba(46, 204, 113, 0.8)';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(46, 204, 113, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Add title with progress
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Animated Recurrence Plot', width / 2, 30);
    ctx.font = '12px Arial';
    const progress = ((pointsToDraw / scatterPoints.length) * 100).toFixed(1);
    ctx.fillText(`${pointsToDraw.toLocaleString()} / ${scatterPoints.length.toLocaleString()} points (${progress}%)`, width / 2, 50);

  }, [scatterPoints, animationProgress, channelX, channelY]);

  // Redraw static canvas when needed
  useEffect(() => {
    if (!showAnimated) {
      drawStatic();
    }
  }, [drawStatic, showAnimated]);

  // Redraw animated canvas when needed
  useEffect(() => {
    if (showAnimated) {
      drawAnimated();
    }
  }, [drawAnimated, showAnimated]);

  // All control handlers are now in parent (MultiChannelEEGViewer)

  return (
    <div className="recurrence-viewer">
      <div className="viewer-header">
        <h3 className="viewer-title">Recurrence Graph Viewer</h3>
        <div className="axis-info">
          {channelX && channelY && (
            <span className="axis-text">
              <span className="axis-label x-axis">X:</span> {CHANNEL_CONFIG[channelX]?.name}
              {' | '}
              <span className="axis-label y-axis">Y:</span> {CHANNEL_CONFIG[channelY]?.name}
            </span>
          )}
          {(!channelX || !channelY) && (
            <span className="axis-hint">← Select 2 channels (X → Y)</span>
          )}
        </div>
      </div>

      {/* Controls are in parent's sidebar TimeControlPanel */}

      <div className="recurrence-content">
        {/* Single Canvas View - switches between static and animated */}
        <div className="canvas-grid single-column">
          {/* Static Canvas - shown initially and after reset */}
          {!showAnimated && (
            <div className="canvas-container">
              <canvas
                ref={staticCanvasRef}
                className="recurrence-canvas"
              />
            </div>
          )}

          {/* Animated Canvas - shown during animation */}
          {showAnimated && (
            <div className="canvas-container">
              <canvas
                ref={animatedCanvasRef}
                className="recurrence-canvas"
              />
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="recurrence-info-panel">
          <div className="info-row">
            <span className="info-label">Data Points:</span>
            <span className="info-value">{scatterPoints.length.toLocaleString()}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Color Scheme:</span>
            <span className="info-value">{colorScheme}</span>
          </div>
          {showAnimated && (
            <div className="info-row">
              <span className="info-label">Animation Progress:</span>
              <span className="info-value">
                {((Math.floor(animationProgress) / scatterPoints.length) * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        <div className="recurrence-description">
          <p className="description-text">
            {channelX && channelY && CHANNEL_CONFIG[channelX] && CHANNEL_CONFIG[channelY] ? (
              <>
                <strong>Recurrence Plot:</strong> Scatter plot showing correlation between{' '}
                <strong>{CHANNEL_CONFIG[channelX]?.name}</strong> (X-axis) and{' '}
                <strong>{CHANNEL_CONFIG[channelY]?.name}</strong> (Y-axis).
                {!showAnimated && ' Complete static view with density-based coloring.'}
                {showAnimated && ' Progressive animation showing how points are plotted over time.'}
              </>
            ) : (
              <>
                <strong>Recurrence Plot:</strong> Select exactly 2 channels from the left panel.
                First selection = X-axis, Second selection = Y-axis.
              </>
            )}
          </p>
        </div>

        {/* Color Legend - only for static view with density map */}
        {densityMap.length > 0 && !showAnimated && DENSITY_COLOR_SCHEMES[colorScheme] && (
          <div className="recurrence-legend">
            <h5 className="legend-title">Density Level:</h5>
            <div className="legend-gradient">
              {DENSITY_COLOR_SCHEMES[colorScheme].map((color, idx) => (
                <div 
                  key={idx}
                  className="legend-color-stop"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="legend-labels">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecurrenceViewer;
