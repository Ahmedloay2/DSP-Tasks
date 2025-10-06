import React, { useRef, useEffect, useState, useCallback } from 'react';
import ECGApiService from '../../services/ECGApiService';
import MockECGApiService from '../../services/MockECGApiService';
import { LEAD_CONFIGURATIONS, LEAD_COLORS } from '../../constants/ECGConstants';
import './ECGSignalViewer.css';

// Individual subgraph component
const ECGSubgraph = ({ lead, data, isPlaying, currentPosition, metadata, width, height, isLiveMode = false, liveStreamData = null }) => {
  const canvasRef = useRef(null);
  const [leadScale, setLeadScale] = useState({ min: -1, max: 1, range: 2, center: 0 });

  // Optimized auto-scaling algorithm for maximum signal visibility
  const calculateScale = useCallback((leadData) => {
    if (!leadData || leadData.length === 0) return { min: -1.5, max: 1.5, range: 3, center: 0 };
    
    // Use recent data for live mode, adaptive window size based on data length
    const adaptiveWindowSize = Math.min(1500, Math.max(500, leadData.length * 0.3));
    const recentData = isLiveMode && leadData.length > adaptiveWindowSize ? 
      leadData.slice(-adaptiveWindowSize) : leadData;
    
    // Fast percentile calculation for robust outlier handling
    const sortedData = new Float32Array(recentData).sort();
    const len = sortedData.length;
    const p5 = sortedData[Math.floor(len * 0.05)] || 0;
    const p95 = sortedData[Math.floor(len * 0.95)] || 0;
    const median = sortedData[Math.floor(len * 0.5)] || 0;
    
    // Use percentile-based bounds for better outlier resistance
    const dataMin = p5;
    const dataMax = p95;
    const actualRange = dataMax - dataMin;
    
    // Lead-specific optimal scaling factors
    const leadConfig = {
      'I': { minRange: 0.8, topPad: 0.15, bottomPad: 0.05 },
      'II': { minRange: 1.0, topPad: 0.15, bottomPad: 0.05 },
      'III': { minRange: 0.6, topPad: 0.15, bottomPad: 0.05 },
      'aVR': { minRange: 0.5, topPad: 0.12, bottomPad: 0.08 },
      'aVL': { minRange: 0.7, topPad: 0.15, bottomPad: 0.05 },
      'aVF': { minRange: 0.8, topPad: 0.15, bottomPad: 0.05 },
      'V1': { minRange: 0.8, topPad: 0.12, bottomPad: 0.08 },
      'V2': { minRange: 1.2, topPad: 0.15, bottomPad: 0.05 },
      'V3': { minRange: 1.5, topPad: 0.15, bottomPad: 0.05 },
      'V4': { minRange: 1.8, topPad: 0.15, bottomPad: 0.05 },
      'V5': { minRange: 1.3, topPad: 0.15, bottomPad: 0.05 },
      'V6': { minRange: 1.0, topPad: 0.15, bottomPad: 0.05 }
    };
    
    const config = leadConfig[lead] || { minRange: 0.8, topPad: 0.15, bottomPad: 0.05 };
    const effectiveRange = Math.max(actualRange, config.minRange);
    
    // Minimal padding for optimal data visualization
    const topPadding = effectiveRange * config.topPad;
    const bottomPadding = effectiveRange * config.bottomPad;
    
    const scaledMin = dataMin - bottomPadding;
    const scaledMax = dataMax + topPadding;
    const scaledRange = scaledMax - scaledMin;
    
    return {
      min: scaledMin,
      max: scaledMax,
      range: scaledRange,
      center: (scaledMin + scaledMax) / 2,
      median: median
    };
  }, [isLiveMode, lead]);

  // Optimized scaling updates with throttling for performance
  useEffect(() => {
    const currentData = (isLiveMode && liveStreamData && liveStreamData[lead]) ? liveStreamData[lead] : data;
    
    if (currentData && currentData.length > 0) {
      // Throttle scale updates for live mode to reduce CPU usage
      const shouldUpdate = !isLiveMode || currentData.length % 50 === 0 || currentData.length < 100;
      
      if (shouldUpdate) {
        const newScale = calculateScale(currentData);
        setLeadScale(prevScale => {
          // Only update if scale changed significantly (5% threshold)
          const scaleChange = Math.abs(newScale.range - prevScale.range) / prevScale.range;
          return scaleChange > 0.05 ? newScale : prevScale;
        });
      }
    } else if (isLiveMode) {
      setLeadScale({ min: -1.5, max: 1.5, range: 3, center: 0, median: 0 });
    }
  }, [data, liveStreamData, lead, calculateScale, isLiveMode]);

  // Draw grid for this subgraph
  const drawGrid = useCallback((ctx, width, height) => {
    // Minor grid (1mm) - lighter color
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 0.5;
    
    for (let x = 0; x <= width; x += 5) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= height; y += 5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Major grid (5mm) - slightly darker
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= width; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= height; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, []);

  // Draw axes with full width usage
  const drawAxes = useCallback((ctx, width, height) => {
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    
    // Y-axis (left side at x=40 to leave space for labels)
    const yAxisX = 40;
    ctx.beginPath();
    ctx.moveTo(yAxisX, 0);
    ctx.lineTo(yAxisX, height - 30);
    ctx.stroke();
    
    // X-axis (bottom)
    ctx.beginPath();
    ctx.moveTo(yAxisX, height - 30);
    ctx.lineTo(width, height - 30);
    ctx.stroke();
    
    // Optimized Y-axis labels with adaptive precision
    ctx.fillStyle = '#555555';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    
    const ySteps = Math.min(8, Math.max(4, Math.floor((height - 30) / 25))); // Adaptive steps
    const precision = leadScale.range > 5 ? 1 : leadScale.range > 1 ? 2 : 3;
    
    for (let i = 0; i <= ySteps; i++) {
      const y = (height - 30) * (1 - i / ySteps);
      const voltage = leadScale.min + (leadScale.range * i / ySteps);
      
      // Skip labels too close to edges for better readability
      if (y > 15 && y < height - 45) {
        ctx.fillText(voltage.toFixed(precision), yAxisX - 6, y + 3);
      }
    }
    
    // X-axis labels (time) - fewer labels for cleaner look
    ctx.textAlign = 'center';
    const timeWindow = 10; // 10 seconds
    const xSteps = 5; // Fewer steps for cleaner appearance
    
    for (let i = 0; i <= xSteps; i++) {
      const x = yAxisX + ((width - yAxisX) * i / xSteps);
      const time = (timeWindow * i / xSteps).toFixed(0);
      ctx.fillText(`${time}s`, x, height - 10);
    }
  }, [leadScale]);

  // Draw signal with full width usage and live streaming support
  const drawSignal = useCallback((ctx, width, height) => {
    // Use live stream data if available, otherwise use regular data
    const currentData = (isLiveMode && liveStreamData && liveStreamData[lead]) ? liveStreamData[lead] : data;
    
    if (!currentData || currentData.length === 0) {
      // Draw empty baseline for live mode when no data
      if (isLiveMode) {
        const yAxisX = 40;
        ctx.strokeStyle = '#E0E0E0';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(yAxisX, (height - 30) / 2);
        ctx.lineTo(width, (height - 30) / 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Add "Ready to stream" text
        ctx.fillStyle = '#999999';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Ready to stream - Press Play', yAxisX + (width - yAxisX) / 2, (height - 30) / 2 - 10);
      }
      return;
    }
    
    const samplingRate = metadata?.samplingRate || 250;
    const timeWindow = 10; // 10 seconds visible
    const samplesPerWindow = samplingRate * timeWindow;
    
    // For live streaming, show the most recent data
    let startIndex;
    if (isLiveMode) {
      startIndex = Math.max(0, currentData.length - samplesPerWindow);
    } else {
      startIndex = Math.max(0, currentPosition - samplesPerWindow);
    }
    
    const yAxisX = 40; // Match Y-axis position
    const plotWidth = width - yAxisX; // Account for Y-axis space
    const plotHeight = height - 30;
    const pixelsPerSample = plotWidth / samplesPerWindow;
    
    // Optimized signal rendering with adaptive line width
    const signalQuality = Math.min(2.0, Math.max(1.5, 2.0 / Math.log10(samplesPerWindow / 1000 + 1)));
    ctx.strokeStyle = LEAD_COLORS[lead];
    ctx.lineWidth = signalQuality;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Use path2D for better performance on large datasets
    const signalPath = new Path2D();
    let hasData = false;
    let prevY = null;
    
    // Optimize drawing with data decimation for performance
    const drawStep = Math.max(1, Math.floor(samplesPerWindow / (plotWidth * 2)));
    
    for (let i = 0; i < samplesPerWindow && (startIndex + i) < currentData.length; i += drawStep) {
      const dataIndex = startIndex + i;
      const x = yAxisX + (i * pixelsPerSample);
      const voltage = currentData[dataIndex];
      
      // Enhanced voltage normalization with smooth clamping
      const normalizedVoltage = Math.max(0, Math.min(1, (voltage - leadScale.min) / leadScale.range));
      const y = plotHeight * (1 - normalizedVoltage);
      
      if (x <= width && x >= yAxisX) {
        if (!hasData) {
          signalPath.moveTo(x, y);
          hasData = true;
        } else {
          // Anti-aliasing for steep transitions
          if (prevY !== null && Math.abs(y - prevY) > plotHeight * 0.1) {
            const steps = Math.ceil(Math.abs(y - prevY) / 2);
            for (let step = 1; step <= steps; step++) {
              const interpY = prevY + (y - prevY) * (step / steps);
              const interpX = x - pixelsPerSample * drawStep * (1 - step / steps);
              signalPath.lineTo(interpX, interpY);
            }
          } else {
            signalPath.lineTo(x, y);
          }
        }
        prevY = y;
      }
    }
    
    if (hasData) {
      ctx.stroke(signalPath);
      
      // Enhanced baseline reference with median line
      if (leadScale.median !== undefined) {
        const medianY = plotHeight * (1 - (leadScale.median - leadScale.min) / leadScale.range);
        if (medianY >= 0 && medianY <= plotHeight) {
          ctx.strokeStyle = 'rgba(100, 100, 100, 0.25)';
          ctx.lineWidth = 0.8;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(yAxisX, medianY);
          ctx.lineTo(width, medianY);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }
    
    // Enhanced playback indicator with signal quality
    if (isPlaying && !isLiveMode) {
      const indicatorX = yAxisX + (plotWidth * 0.8);
      ctx.strokeStyle = '#FF4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(indicatorX, 0);
      ctx.lineTo(indicatorX, height - 30);
      ctx.stroke();
    }
    
    // Signal quality indicator
    if (hasData && currentData.length > 100) {
      const signalStrength = Math.min(1, leadScale.range / 2);
      const qualityColor = signalStrength > 0.5 ? '#22C55E' : signalStrength > 0.2 ? '#F59E0B' : '#EF4444';
      
      ctx.fillStyle = qualityColor;
      ctx.font = '9px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`${(signalStrength * 100).toFixed(0)}%`, width - 10, 15);
    }
  }, [data, currentPosition, isPlaying, metadata, lead, leadScale, isLiveMode, liveStreamData]);

  // Optimized draw function with performance monitoring
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    
    // Enable anti-aliasing for better visual quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    drawGrid(ctx, width, height);
    
    // Draw axes
    drawAxes(ctx, width, height);
    
    // Draw signal
    drawSignal(ctx, width, height);
  }, [width, height, drawGrid, drawAxes, drawSignal]);

  // Animation loop
  useEffect(() => {
    let animationId;
    
    const animate = () => {
      draw();
      if (isPlaying) {
        animationId = requestAnimationFrame(animate);
      }
    };
    
    animate();
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [draw, isPlaying]);

  return (
    <div className="ecg-subgraph">
      <div className="subgraph-header">
        <span className="lead-name" style={{ color: LEAD_COLORS[lead] }}>
          {lead}
        </span>
        <span className="scale-info">
          Range: {leadScale.range.toFixed(2)}mV
        </span>
      </div>
      <canvas 
        ref={canvasRef} 
        className="subgraph-canvas"
        style={{ border: `2px solid ${LEAD_COLORS[lead]}` }}
      />
    </div>
  );
};

const ECGSignalViewer = ({ 
  sessionId, 
  metadata, 
  isPlaying, 
  currentPosition, 
  visibleLeads,
  leadMode,
  showLegend = false,
  liveStreamData = null
}) => {
  const containerRef = useRef(null);
  const [ecgData, setEcgData] = useState(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Initialize container size
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);
    return () => window.removeEventListener('resize', updateContainerSize);
  }, []);

  // Handle live stream data updates
  useEffect(() => {
    if (liveStreamData && liveStreamData.data) {
      setIsLiveMode(true);
      
      setEcgData(prevData => {
        const newData = { ...prevData };
        
        // For live streaming, append new data
        Object.keys(liveStreamData.data).forEach(lead => {
          if (!newData[lead]) {
            newData[lead] = [];
          }
          
          // Append new chunk
          newData[lead] = [...newData[lead], ...liveStreamData.data[lead]];
          
          // Keep only last 10 seconds of data for display (2500 samples at 250Hz)
          const maxSamples = 2500;
          if (newData[lead].length > maxSamples) {
            newData[lead] = newData[lead].slice(-maxSamples);
          }
        });
        
        return newData;
      });
    } else if (liveStreamData === null && isLiveMode) {
      // Live stream stopped, clear the canvas
      setEcgData({});
      setIsLiveMode(false);
    }
  }, [liveStreamData, isLiveMode]);

  // Load ECG data from API or use simulated data
  useEffect(() => {
    if (!sessionId || isLiveMode) return;
    
    const loadECGData = async () => {
      try {
        // Determine if we're using mock data based on sessionId format
        const isMockSession = sessionId.includes('mock_session') || sessionId.includes('live_stream');
        
        // For empty mock sessions (created but not streaming), start with no data
        if (isMockSession && sessionId.includes('mock_session') && !isLiveMode) {
          setEcgData({}); // Start with empty data for mock sessions
          return;
        }
        
        const ApiService = isMockSession ? MockECGApiService : ECGApiService;
        
        // For file-based sessions, load actual data
        const leads = LEAD_CONFIGURATIONS[leadMode];
        const samplingRate = metadata?.sampling_rate || metadata?.samplingRate || 250;
        const samples = metadata?.samples || samplingRate * 30; // 30 seconds default
        
        // Get ECG data for all leads
        const response = await ApiService.getECGData(
          sessionId, 
          0, // start
          samples, // end
          leads.join(',') // leads
        );
        
        if (response.data) {
          setEcgData(response.data);
        } else {
          // Fallback to simulated data if API fails
          setEcgData(simulateECGData());
        }
      } catch (error) {
        console.warn('Failed to load ECG data from API, using simulated data:', error);
        // For mock sessions, use empty data instead of simulated data
        if (sessionId.includes('mock_session')) {
          setEcgData({});
        } else {
          setEcgData(simulateECGData());
        }
      }
    };

    const simulateECGData = () => {
      const leads = LEAD_CONFIGURATIONS[leadMode];
      const samplingRate = metadata?.sampling_rate || metadata?.samplingRate || 250;
      const duration = 30; // 30 seconds of data
      const samples = samplingRate * duration;
      
      const data = {};
      leads.forEach(lead => {
        data[lead] = [];
        for (let i = 0; i < samples; i++) {
          const t = i / samplingRate;
          // More realistic ECG simulation with different patterns per lead
          let signal = 0;
          
          // Basic heartbeat pattern (simplified QRS complex)
          const heartRate = 75; // 75 BPM
          const beatInterval = 60 / heartRate; // seconds per beat
          const beatPhase = (t % beatInterval) / beatInterval;
          
          if (beatPhase > 0.1 && beatPhase < 0.3) {
            // QRS complex
            const qrsPhase = (beatPhase - 0.1) / 0.2;
            signal = Math.sin(qrsPhase * Math.PI * 4) * 2;
          } else if (beatPhase > 0.3 && beatPhase < 0.5) {
            // T wave
            const tPhase = (beatPhase - 0.3) / 0.2;
            signal = Math.sin(tPhase * Math.PI) * 0.8;
          }
          
          // Add lead-specific variations
          const leadVariation = {
            'I': 1.0,
            'II': 1.2,
            'III': 0.8,
            'aVR': -0.6,
            'aVL': 0.7,
            'aVF': 1.1,
            'V1': 0.9,
            'V2': 1.4,
            'V3': 1.6,
            'V4': 1.8,
            'V5': 1.5,
            'V6': 1.3
          };
          
          signal *= leadVariation[lead] || 1.0;
          
          // Add some realistic noise
          const noise = (Math.random() - 0.5) * 0.05;
          data[lead].push(signal + noise);
        }
      });
      return data;
    };

    // Load data when sessionId or metadata changes
    loadECGData();
  }, [leadMode, metadata, sessionId, isLiveMode]);

  // Get visible leads
  const getVisibleLeads = () => {
    const currentLeads = LEAD_CONFIGURATIONS[leadMode];
    return currentLeads.filter(lead => visibleLeads[lead]);
  };

  const visibleLeadsList = getVisibleLeads();
  
  // Scrolling logic - show max 3 subgraphs at a time
  const MAX_VISIBLE_SUBGRAPHS = 4;
  const totalSubgraphs = visibleLeadsList.length;
  const canScroll = totalSubgraphs > MAX_VISIBLE_SUBGRAPHS;
  const maxScrollPosition = Math.max(0, totalSubgraphs - MAX_VISIBLE_SUBGRAPHS);
  
  // Ensure scroll position is within bounds
  const clampedScrollPosition = Math.min(Math.max(0, scrollPosition), maxScrollPosition);
  
  // Keyboard navigation (removed wheel scrolling, now using scroll bar)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.closest('.ecg-signal-viewer')) {
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            if (clampedScrollPosition > 0) {
              setScrollPosition(clampedScrollPosition - 1);
            }
            break;
          case 'ArrowDown':
            e.preventDefault();
            if (clampedScrollPosition < maxScrollPosition) {
              setScrollPosition(clampedScrollPosition + 1);
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [clampedScrollPosition, maxScrollPosition, setScrollPosition]);

  // Layout calculations with fixed dimensions
  const subgraphHeight = 180; // Fixed height for all subgraphs
  const subgraphWidth = containerSize.width > 0 ? containerSize.width - 40 : 800; // Fixed width with fallback

  return (
    <div className="ecg-signal-viewer" ref={containerRef} tabIndex="0">
      {/* Legend - only show if enabled and there are visible leads */}
      {showLegend && visibleLeadsList.length > 0 && (
        <div className="ecg-legend">
          <h4 className="legend-title">Active Leads ({visibleLeadsList.length})</h4>
          <div className="legend-items">
            {visibleLeadsList.map(lead => (
              <div key={lead} className="legend-item">
                <div 
                  className="legend-color"
                  style={{ backgroundColor: LEAD_COLORS[lead] }}
                />
                <span className="legend-label">{lead}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {visibleLeadsList.length > 0 && (
        <div className="ecg-subgraphs-container">
          {/* Scrollable container showing all subgraphs with proper spacing */}
          <div 
            className="ecg-subgraphs-scroll-container"
            style={{
              height: `${MAX_VISIBLE_SUBGRAPHS * (subgraphHeight + 30)}px`, // Fixed height for 3 subgraphs with spacing
              overflowY: canScroll ? 'auto' : 'hidden',
              overflowX: 'hidden'
            }}
          >
            {visibleLeadsList.map((lead) => {
              const leadData = ecgData?.[lead] || [];
              return (
                <div
                  key={lead}
                  className="ecg-subgraph-item"
                  style={{
                    minHeight: `${subgraphHeight}px`,
                    flex: 'none'
                  }}
                >
                  <ECGSubgraph
                    lead={lead}
                    data={leadData}
                    isPlaying={isPlaying}
                    currentPosition={currentPosition}
                    metadata={metadata}
                    width={subgraphWidth}
                    height={subgraphHeight}
                    isLiveMode={isLiveMode}
                    liveStreamData={liveStreamData}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Show message when no leads are visible */}
      {visibleLeadsList.length === 0 && (
        <div className="ecg-no-leads">
          <p>No ECG leads selected. Use the controls above to select leads to display.</p>
        </div>
      )}
    </div>
  );
};

export default ECGSignalViewer;