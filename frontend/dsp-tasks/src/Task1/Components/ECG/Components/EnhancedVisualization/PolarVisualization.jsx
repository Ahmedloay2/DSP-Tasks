import React, { useRef, useEffect, useState, useCallback } from 'react';
import { LEAD_CONFIGURATIONS, LEAD_COLORS } from '../../constants/ECGConstants';
import './PolarVisualization.css';

const PolarVisualization = ({ 
  ecgData, 
  visibleLeads, 
  leadMode, 
  metadata,
  isPlaying,
  currentPosition,
  isLiveMode,
  liveStreamData,
  onLeadToggle
}) => {
  const canvasRef = useRef(null);
  const [polarConfig, setPolarConfig] = useState({
    radius: 150,
    centerX: 0,
    centerY: 0,
    zoom: 1.0,
    rotation: 0,
    selectedLeadX: 'I',
    selectedLeadY: 'aVF'
  });
  const [animationFrame, setAnimationFrame] = useState(0);

  // Get available leads
  const getAvailableLeads = useCallback(() => {
    const leads = LEAD_CONFIGURATIONS[leadMode];
    return leads.filter(lead => visibleLeads[lead]);
  }, [leadMode, visibleLeads]);

  const availableLeads = getAvailableLeads();

  // Get current ECG data
  const getCurrentData = useCallback(() => {
    if (isLiveMode && liveStreamData?.data) {
      return liveStreamData.data;
    }
    return ecgData || {};
  }, [ecgData, isLiveMode, liveStreamData]);

  // Convert ECG leads to polar coordinates
  const calculatePolarCoordinates = useCallback((data, timeIndex) => {
    const availableLeadsList = availableLeads;
    
    if (availableLeadsList.length < 2) return null;

    // Use selected leads or fall back to defaults
    const leadX = availableLeadsList.includes(polarConfig.selectedLeadX) ? 
                  polarConfig.selectedLeadX : availableLeadsList[0];
    const leadY = availableLeadsList.includes(polarConfig.selectedLeadY) ? 
                  polarConfig.selectedLeadY : availableLeadsList[1] || availableLeadsList[0];

    const xData = data[leadX] || [];
    const yData = data[leadY] || [];

    if (timeIndex >= xData.length || timeIndex >= yData.length) return null;

    const x = xData[timeIndex] || 0;
    const y = yData[timeIndex] || 0;

    // Convert to polar coordinates
    const radius = Math.sqrt(x * x + y * y) * 50; // Scale factor
    const angle = Math.atan2(y, x);

    return {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      magnitude: radius,
      angle: angle,
      leadX,
      leadY
    };
  }, [availableLeads, polarConfig.selectedLeadX, polarConfig.selectedLeadY]);

  // Draw polar grid
  const drawGrid = useCallback((ctx, width, height) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 50;

    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1;

    // Draw concentric circles
    for (let r = maxRadius / 6; r <= maxRadius; r += maxRadius / 6) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw radial lines
    for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 6) {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + maxRadius * Math.cos(angle),
        centerY + maxRadius * Math.sin(angle)
      );
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(centerX - maxRadius, centerY);
    ctx.lineTo(centerX + maxRadius, centerY);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - maxRadius);
    ctx.lineTo(centerX, centerY + maxRadius);
    ctx.stroke();

    // Add labels
    ctx.fillStyle = '#666666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    // Angle labels
    const labels = ['0°', '30°', '60°', '90°', '120°', '150°', '180°', '210°', '240°', '270°', '300°', '330°'];
    for (let i = 0; i < 12; i++) {
      const angle = i * Math.PI / 6;
      const labelRadius = maxRadius + 20;
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);
      ctx.fillText(labels[i], x, y + 3);
    }

    return { centerX, centerY, maxRadius };
  }, []);

  // Draw ECG vector trail
  const drawVectorTrail = useCallback((ctx, data, { centerX, centerY }) => {
    if (!data) return;

    const samplingRate = metadata?.sampling_rate || 360;
    const trailLength = Math.min(100, Math.floor(samplingRate / 4)); // 250ms trail
    const currentTime = isLiveMode ? 
      Math.max(0, (data[Object.keys(data)[0]]?.length || 0) - 1) :
      Math.floor(currentPosition * samplingRate / 1000);

    const trail = [];
    
    // Generate trail points
    for (let i = trailLength; i >= 0; i--) {
      const timeIndex = currentTime - i;
      if (timeIndex >= 0) {
        const coords = calculatePolarCoordinates(data, timeIndex);
        if (coords) {
          trail.push({
            x: centerX + coords.x * polarConfig.zoom,
            y: centerY + coords.y * polarConfig.zoom,
            alpha: (trailLength - i) / trailLength,
            magnitude: coords.magnitude
          });
        }
      }
    }

    if (trail.length < 2) return;

    // Draw trail
    ctx.strokeStyle = '#FF4444';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const gradient = ctx.createLinearGradient(
      trail[0].x, trail[0].y,
      trail[trail.length - 1].x, trail[trail.length - 1].y
    );
    gradient.addColorStop(0, 'rgba(255, 68, 68, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 68, 68, 1.0)');

    ctx.strokeStyle = gradient;

    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);
    
    for (let i = 1; i < trail.length; i++) {
      ctx.lineTo(trail[i].x, trail[i].y);
    }
    ctx.stroke();

    // Draw current vector point
    if (trail.length > 0) {
      const current = trail[trail.length - 1];
      
      // Vector point
      ctx.fillStyle = '#FF4444';
      ctx.beginPath();
      ctx.arc(current.x, current.y, 4, 0, 2 * Math.PI);
      ctx.fill();

      // Vector line from center
      ctx.strokeStyle = '#FF6666';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(current.x, current.y);
      ctx.stroke();

      // Magnitude indicator
      ctx.fillStyle = '#333333';
      ctx.font = '12px Arial';
      ctx.fillText(
        `${current.magnitude.toFixed(1)}mV`,
        current.x + 10,
        current.y - 10
      );
    }
  }, [calculatePolarCoordinates, currentPosition, isLiveMode, metadata, polarConfig]);

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#FAFAFA';
    ctx.fillRect(0, 0, width, height);

    // Draw grid and get dimensions
    const gridInfo = drawGrid(ctx, width, height);

    // Get current data
    const currentData = getCurrentData();
    
    // Draw vector trail
    drawVectorTrail(ctx, currentData, gridInfo);

    // Draw lead information
    const leads = LEAD_CONFIGURATIONS[leadMode];
    const visibleLeadsList = leads.filter(lead => visibleLeads[lead]);
    
    if (visibleLeadsList.length >= 2) {
      const leadX = visibleLeadsList.includes('I') ? 'I' : visibleLeadsList[0];
      const leadY = visibleLeadsList.includes('aVF') ? 'aVF' : visibleLeadsList[1];
      
      ctx.fillStyle = '#666666';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`X-axis: Lead ${leadX}`, 20, 30);
      ctx.fillText(`Y-axis: Lead ${leadY}`, 20, 50);
    }

  }, [drawGrid, drawVectorTrail, getCurrentData, leadMode, visibleLeads]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying && !isLiveMode) return;

    const animate = () => {
      draw();
      setAnimationFrame(prev => prev + 1);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [draw, isPlaying, isLiveMode, animationFrame]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      setPolarConfig(prev => ({
        ...prev,
        centerX: rect.width / 2,
        centerY: rect.height / 2
      }));
      
      draw();
    }
  }, [draw]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        setPolarConfig(prev => ({
          ...prev,
          centerX: rect.width / 2,
          centerY: rect.height / 2
        }));
        
        draw();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  // Get visible leads info
  return (
    <div className="polar-visualization">
      <div className="polar-header">
        <h4>ECG Vectorcardiogram</h4>
        <p>Polar coordinate representation showing cardiac electrical vector loops</p>
      </div>

      <div className="polar-controls">
        <div className="control-group">
          <label>X-Axis Lead:</label>
          <select 
            value={polarConfig.selectedLeadX}
            onChange={(e) => setPolarConfig(prev => ({ ...prev, selectedLeadX: e.target.value }))}
          >
            {availableLeads.map(lead => (
              <option key={lead} value={lead}>{lead}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Y-Axis Lead:</label>
          <select 
            value={polarConfig.selectedLeadY}
            onChange={(e) => setPolarConfig(prev => ({ ...prev, selectedLeadY: e.target.value }))}
          >
            {availableLeads.map(lead => (
              <option key={lead} value={lead}>{lead}</option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label>Zoom:</label>
          <input 
            type="range"
            min="0.5"
            max="3.0"
            step="0.1"
            value={polarConfig.zoom}
            onChange={(e) => setPolarConfig(prev => ({ ...prev, zoom: parseFloat(e.target.value) }))}
          />
          <span>{polarConfig.zoom.toFixed(1)}x</span>
        </div>
        
        <div className="leads-info">
          <span>Active Leads: {availableLeads.length}</span>
          {availableLeads.length < 2 && (
            <span className="warning">⚠️ Need at least 2 leads for polar view</span>
          )}
        </div>
      </div>

      <div className="polar-canvas-container">
        <canvas ref={canvasRef} className="polar-canvas" />
        
        {availableLeads.length < 2 && (
          <div className="polar-placeholder">
            <p>Please select at least 2 ECG leads to view the vectorcardiogram</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PolarVisualization;