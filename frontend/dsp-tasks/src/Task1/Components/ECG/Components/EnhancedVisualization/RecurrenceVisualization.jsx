import React, { useRef, useEffect, useState, useCallback } from 'react';
import { LEAD_CONFIGURATIONS, LEAD_COLORS } from '../../constants/ECGConstants';
import './RecurrenceVisualization.css';

const RecurrenceVisualization = ({ 
  ecgData, 
  visibleLeads, 
  leadMode, 
  metadata,
  isPlaying,
  currentPosition,
  isLiveMode,
  liveStreamData 
}) => {
  const canvasRef = useRef(null);
  const [recurrenceConfig, setRecurrenceConfig] = useState({
    threshold: 0.1,
    embeddingDim: 3,
    timeDelay: 1,
    selectedLead: 'II'
  });
  const [rqaMetrics, setRqaMetrics] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

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

  // Phase space reconstruction
  const phaseSpaceReconstruction = useCallback((timeSeries, embeddingDim, timeDelay) => {
    if (!timeSeries || timeSeries.length < embeddingDim * timeDelay) {
      return [];
    }

    const reconstructed = [];
    for (let i = 0; i < timeSeries.length - (embeddingDim - 1) * timeDelay; i++) {
      const vector = [];
      for (let j = 0; j < embeddingDim; j++) {
        vector.push(timeSeries[i + j * timeDelay]);
      }
      reconstructed.push(vector);
    }
    return reconstructed;
  }, []);

  // Calculate Euclidean distance between vectors
  const euclideanDistance = useCallback((vec1, vec2) => {
    if (vec1.length !== vec2.length) return Infinity;
    return Math.sqrt(vec1.reduce((sum, val, idx) => sum + Math.pow(val - vec2[idx], 2), 0));
  }, []);

  // Generate recurrence matrix
  const generateRecurrenceMatrix = useCallback((vectors, threshold) => {
    const n = vectors.length;
    const matrix = Array(n).fill().map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const distance = euclideanDistance(vectors[i], vectors[j]);
        matrix[i][j] = distance < threshold ? 1 : 0;
      }
    }
    
    return matrix;
  }, [euclideanDistance]);

  // Calculate RQA metrics
  const calculateRQAMetrics = useCallback((matrix) => {
    const n = matrix.length;
    if (n === 0) return null;

    let recurrencePoints = 0;
    let diagonalLines = [];
    let verticalLines = [];

    // Count recurrence points
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (matrix[i][j] === 1) recurrencePoints++;
      }
    }

    // Find diagonal lines (deterministic structures)
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - 1; j++) {
        if (matrix[i][j] === 1) {
          let length = 1;
          let k = 1;
          while (i + k < n && j + k < n && matrix[i + k][j + k] === 1) {
            length++;
            k++;
          }
          if (length >= 2) {
            diagonalLines.push(length);
          }
        }
      }
    }

    // Find vertical lines (laminarity)
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n - 1; i++) {
        if (matrix[i][j] === 1) {
          let length = 1;
          let k = 1;
          while (i + k < n && matrix[i + k][j] === 1) {
            length++;
            k++;
          }
          if (length >= 2) {
            verticalLines.push(length);
          }
        }
      }
    }

    // Calculate metrics
    const recurrenceRate = recurrencePoints / (n * n);
    const determinism = diagonalLines.length > 0 ? 
      diagonalLines.reduce((sum, len) => sum + len, 0) / recurrencePoints : 0;
    const averageDiagonalLength = diagonalLines.length > 0 ?
      diagonalLines.reduce((sum, len) => sum + len, 0) / diagonalLines.length : 0;
    const maxDiagonalLength = diagonalLines.length > 0 ? Math.max(...diagonalLines) : 0;
    const laminarity = verticalLines.length > 0 ?
      verticalLines.reduce((sum, len) => sum + len, 0) / recurrencePoints : 0;
    const trappingTime = verticalLines.length > 0 ?
      verticalLines.reduce((sum, len) => sum + len, 0) / verticalLines.length : 0;

    return {
      recurrenceRate: recurrenceRate * 100,
      determinism: determinism * 100,
      averageDiagonalLength,
      maxDiagonalLength,
      laminarity: laminarity * 100,
      trappingTime
    };
  }, []);

  // Draw recurrence plot
  const drawRecurrencePlot = useCallback((ctx, matrix, width, height) => {
    if (!matrix || matrix.length === 0) return;

    const n = matrix.length;
    const cellWidth = width / n;
    const cellHeight = height / n;

    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Draw matrix
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (matrix[i][j] === 1) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
        }
      }
    }

    // Draw main diagonal
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, height);
    ctx.stroke();
  }, []);

  // Main calculation function
  const calculateRecurrence = useCallback(async () => {
    const currentData = getCurrentData();
    const leadData = currentData[recurrenceConfig.selectedLead];
    
    if (!leadData || leadData.length < 100) {
      return;
    }

    setIsCalculating(true);

    try {
      // Use a subset of data for performance (max 500 points)
      const maxPoints = 500;
      const stride = Math.max(1, Math.floor(leadData.length / maxPoints));
      const sampledData = leadData.filter((_, index) => index % stride === 0);

      // Phase space reconstruction
      const vectors = phaseSpaceReconstruction(
        sampledData, 
        recurrenceConfig.embeddingDim, 
        recurrenceConfig.timeDelay
      );

      if (vectors.length === 0) {
        setIsCalculating(false);
        return;
      }

      // Calculate threshold as percentage of maximum distance
      const distances = [];
      for (let i = 0; i < Math.min(100, vectors.length); i++) {
        for (let j = i + 1; j < Math.min(100, vectors.length); j++) {
          distances.push(euclideanDistance(vectors[i], vectors[j]));
        }
      }
      const maxDistance = Math.max(...distances);
      const threshold = maxDistance * recurrenceConfig.threshold;

      // Generate recurrence matrix
      const matrix = generateRecurrenceMatrix(vectors, threshold);

      // Calculate RQA metrics
      const metrics = calculateRQAMetrics(matrix);
      setRqaMetrics(metrics);

      // Draw the plot
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        drawRecurrencePlot(ctx, matrix, canvas.width, canvas.height);
      }

    } catch (error) {
      console.error('Error calculating recurrence plot:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [
    getCurrentData, 
    recurrenceConfig, 
    phaseSpaceReconstruction, 
    generateRecurrenceMatrix, 
    calculateRQAMetrics,
    euclideanDistance,
    drawRecurrencePlot
  ]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Set a fixed size for better visualization
      canvas.width = 400;
      canvas.height = 400;
      
      // Initialize with a placeholder
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#F5F5F5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add placeholder text
      ctx.fillStyle = '#666666';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Recurrence Plot', canvas.width / 2, canvas.height / 2 - 10);
      ctx.fillText('Select lead and adjust parameters', canvas.width / 2, canvas.height / 2 + 10);
    }
  }, []);

  // Recalculate when parameters change
  useEffect(() => {
    if (availableLeads.length > 0) {
      calculateRecurrence();
    }
  }, [calculateRecurrence, availableLeads.length]);

  return (
    <div className="recurrence-visualization">
      <div className="recurrence-header">
        <h4>ECG Recurrence Plot</h4>
        <p>Nonlinear dynamics analysis showing temporal patterns and periodicities</p>
      </div>

      <div className="recurrence-controls">
        <div className="control-group">
          <label>Lead:</label>
          <select 
            value={recurrenceConfig.selectedLead}
            onChange={(e) => setRecurrenceConfig(prev => ({ ...prev, selectedLead: e.target.value }))}
          >
            {availableLeads.map(lead => (
              <option key={lead} value={lead}>{lead}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Threshold:</label>
          <input 
            type="range"
            min="0.01"
            max="0.5"
            step="0.01"
            value={recurrenceConfig.threshold}
            onChange={(e) => setRecurrenceConfig(prev => ({ ...prev, threshold: parseFloat(e.target.value) }))}
          />
          <span>{(recurrenceConfig.threshold * 100).toFixed(0)}%</span>
        </div>

        <div className="control-group">
          <label>Embedding Dim:</label>
          <input 
            type="range"
            min="2"
            max="5"
            step="1"
            value={recurrenceConfig.embeddingDim}
            onChange={(e) => setRecurrenceConfig(prev => ({ ...prev, embeddingDim: parseInt(e.target.value) }))}
          />
          <span>{recurrenceConfig.embeddingDim}</span>
        </div>

        <div className="control-group">
          <label>Time Delay:</label>
          <input 
            type="range"
            min="1"
            max="10"
            step="1"
            value={recurrenceConfig.timeDelay}
            onChange={(e) => setRecurrenceConfig(prev => ({ ...prev, timeDelay: parseInt(e.target.value) }))}
          />
          <span>{recurrenceConfig.timeDelay}</span>
        </div>
      </div>

      <div className="recurrence-content">
        <div className="recurrence-plot">
          <canvas ref={canvasRef} className="recurrence-canvas" />
          {isCalculating && (
            <div className="calculating-overlay">
              <div className="spinner"></div>
              <p>Calculating recurrence plot...</p>
            </div>
          )}
        </div>

        <div className="rqa-metrics">
          <h5>RQA Metrics</h5>
          {rqaMetrics ? (
            <div className="metrics-grid">
              <div className="metric">
                <span className="metric-label">Recurrence Rate:</span>
                <span className="metric-value">{rqaMetrics.recurrenceRate.toFixed(2)}%</span>
              </div>
              <div className="metric">
                <span className="metric-label">Determinism:</span>
                <span className="metric-value">{rqaMetrics.determinism.toFixed(2)}%</span>
              </div>
              <div className="metric">
                <span className="metric-label">Avg Diagonal Length:</span>
                <span className="metric-value">{rqaMetrics.averageDiagonalLength.toFixed(2)}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Max Diagonal Length:</span>
                <span className="metric-value">{rqaMetrics.maxDiagonalLength}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Laminarity:</span>
                <span className="metric-value">{rqaMetrics.laminarity.toFixed(2)}%</span>
              </div>
              <div className="metric">
                <span className="metric-label">Trapping Time:</span>
                <span className="metric-value">{rqaMetrics.trappingTime.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <p>Select a lead and configure parameters to calculate metrics</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecurrenceVisualization;