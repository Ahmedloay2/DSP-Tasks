/**
 * Dual Spectrum Viewer Component
 * Displays frequency spectrum with linear and audiogram scales
 * Supports zoom, pan, and selection
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { analyzeSpectrum } from '../../services/equalizerService';
import './DualSpectrumViewer.css';

export default function DualSpectrumViewer({
  originalSignal = [],
  processedSignal = [],
  sampleRate = 44100,
  showInput = true,
  showOutput = true,
  title = "Frequency Spectrum Comparison",
  inline = false,
  audiogramOnly = false
}) {
  const linearCanvasRef = useRef(null);
  const audiogramCanvasRef = useRef(null);
  const spectrumCacheRef = useRef({ orig: null, proc: null, origSignal: null, procSignal: null });

  const [showLinear, setShowLinear] = useState(true);
  const [showAudiogram, setShowAudiogram] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1.5); // Start zoomed in for better visibility
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  //const [isDragging, setIsDragging] = useState(false);
  //const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Helper functions
  const drawGrid = (ctx, width, height, scale) => {
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;

    // Horizontal lines (fixed - not affected by zoom/pan)
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical lines (move with zoom and pan)
    const divisions = scale === 'audiogram' ? 5 : 10;
    for (let i = 0; i <= divisions; i++) {
      const x = (i / divisions) * width;
      // Apply zoom and pan to vertical grid lines
      const gridX = (x - panX) * zoomLevel;

      // Only draw grid lines that are visible
      if (gridX >= 0 && gridX <= width) {
        ctx.beginPath();
        ctx.moveTo(gridX, 0);
        ctx.lineTo(gridX, height);
        ctx.stroke();
      }
    }
  };

  const drawSpectrumLine = (ctx, spectrum, width, height, color, scale) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3; // Increased from 2 to 3 for better visibility
    ctx.beginPath();

    const { frequencies, magnitudes } = spectrum;
    const maxFreq = sampleRate / 2;

    // Find max magnitude for normalization with better scaling
    let maxMag = 0;
    for (let i = 0; i < magnitudes.length; i++) {
      if (magnitudes[i] > maxMag) maxMag = magnitudes[i];
    }

    // Set a minimum threshold for maxMag to avoid over-amplifying noise
    // If maxMag is below this threshold, treat it as effectively zero
    const MIN_MAGNITUDE_THRESHOLD = 0.001;
    if (maxMag < MIN_MAGNITUDE_THRESHOLD) {
      maxMag = 1.0; // Use 1.0 so that the tiny magnitudes stay near zero
    }

    // For audiogram scale, use standard audiometry frequency points
    if (scale === 'audiogram') {
      const audiogramFreqs = [250, 500, 1000, 2000, 4000, 8000];
      const points = [];

      // Sample magnitudes at specific audiogram frequencies
      audiogramFreqs.forEach(targetFreq => {
        // Find closest frequency in spectrum
        let closestIdx = 0;
        let minDiff = Math.abs(frequencies[0] - targetFreq);

        for (let i = 1; i < frequencies.length; i++) {
          const diff = Math.abs(frequencies[i] - targetFreq);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = i;
          }
          if (frequencies[i] > targetFreq) break;
        }

        const x = (Math.log10(targetFreq + 1) / Math.log10(maxFreq)) * width;
        // Better scaling with zoom: magnitudes scale vertically with zoom for better visibility
        const normalizedMag = magnitudes[closestIdx] / maxMag;
        const verticalScale = Math.min(zoomLevel, 1.5); // Cap vertical scaling at 1.5x
        const y = height * 0.95 - (normalizedMag * height * 0.85 * verticalScale) - panY;

        points.push({ x: (x - panX) * zoomLevel, y });
      });

      // Draw lines connecting points
      points.forEach((point, i) => {
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();

      // Draw marker circles at each point (like in audiogram) - larger for visibility
      ctx.fillStyle = color;
      points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI); // Increased from 4 to 6
        ctx.fill();
        // Add white border for better visibility
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
      });
    } else {
      // Linear scale - draw full spectrum with better scaling
      for (let i = 0; i < frequencies.length; i++) {
        const freq = frequencies[i];
        if (freq > maxFreq) break;

        const x = (freq / maxFreq) * width;
        // Better scaling with zoom: magnitudes scale vertically with zoom for better visibility
        const normalizedMag = magnitudes[i] / maxMag;
        const verticalScale = Math.min(zoomLevel, 1.5); // Cap vertical scaling at 1.5x
        const y = height * 0.95 - (normalizedMag * height * 0.85 * verticalScale) - panY;

        // Apply zoom and pan
        const plotX = (x - panX) * zoomLevel;

        if (i === 0) {
          ctx.moveTo(plotX, y);
        } else {
          ctx.lineTo(plotX, y);
        }
      }
      ctx.stroke();
    }
  };

  const drawLabels = (ctx, width, height, scale) => {
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px Arial';

    // X-axis labels (frequency)
    // Audiogram uses standard audiometry frequencies
    const frequencies = scale === 'audiogram'
      ? [250, 500, 1000, 2000, 4000, 8000]
      : [0, 2000, 4000, 6000, 8000, 10000, 12000, 14000, 16000, 18000, 20000];

    frequencies.forEach(freq => {
      let x;
      if (scale === 'audiogram') {
        x = (Math.log10(freq + 1) / Math.log10(sampleRate / 2)) * width;
      } else {
        x = (freq / (sampleRate / 2)) * width;
      }

      // Apply zoom and pan to labels so they move with the graph
      const labelX = (x - panX) * zoomLevel;

      // Only draw labels that are visible on canvas
      if (labelX >= -50 && labelX <= width + 50) {
        ctx.fillText(freq >= 1000 ? `${freq / 1000}k` : `${freq}`, labelX - 15, height - 5);
      }
    });

    // Y-axis label (fixed position)
    ctx.save();
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Magnitude', -height / 2, 15);
    ctx.restore();

    // Y-axis tick marks (move with vertical pan)
    ctx.font = '10px Arial';
    for (let i = 0; i <= 10; i++) {
      const baseY = (i / 10) * height;
      const value = (1 - i / 10).toFixed(1); // 1.0 at top, 0.0 at bottom

      // Only draw ticks that are visible
      if (baseY >= 0 && baseY <= height) {
        ctx.fillText(value, 5, baseY + 4);
      }
    }

    ctx.font = '12px Arial'; // Reset font

    // X-axis label (fixed position)
    ctx.fillText('Frequency (Hz)', width / 2 - 50, height - 5);
  };

  const drawLinearSpectrum = useCallback(() => {
    const canvas = linearCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;

    // Don't draw if canvas has no size
    if (width === 0 || height === 0) return;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    if (!originalSignal || originalSignal.length === 0) return;

    // Helper function to create a robust hash from signal
    const createSignalHash = (signal) => {
      if (!signal || signal.length === 0) return 0;
      let hash = signal.length;
      // Sample 10 points throughout the signal
      for (let i = 0; i < 10; i++) {
        const idx = Math.floor((i / 10) * signal.length);
        hash += signal[idx] * (i + 1);
      }
      return hash;
    };

    // Get spectrum data with caching (invalidate on signal change)
    let origSpectrum = spectrumCacheRef.current.orig;
    const origSignalHash = createSignalHash(originalSignal);
    if (spectrumCacheRef.current.origSignal !== origSignalHash) {
      origSpectrum = analyzeSpectrum(originalSignal, sampleRate);
      spectrumCacheRef.current.orig = origSpectrum;
      spectrumCacheRef.current.origSignal = origSignalHash;
    }

    let procSpectrum = spectrumCacheRef.current.proc;
    if (processedSignal && processedSignal.length > 0) {
      const procSignalHash = createSignalHash(processedSignal);
      if (spectrumCacheRef.current.procSignal !== procSignalHash) {
        procSpectrum = analyzeSpectrum(processedSignal, sampleRate);
        spectrumCacheRef.current.proc = procSpectrum;
        spectrumCacheRef.current.procSignal = procSignalHash;
      }
    } else {
      procSpectrum = null;
    }

    // Draw grid with better styling
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw frequency labels on x-axis
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    const maxFreq = sampleRate / 2;
    for (let i = 0; i <= 10; i++) {
      const freq = (i / 10) * maxFreq;
      const x = (i / 10) * width;
      const label = freq >= 1000 ? `${(freq / 1000).toFixed(1)}k` : `${Math.round(freq)}`;
      ctx.fillText(label, x, height - 5);
    }

    // Draw magnitude labels on y-axis
    ctx.textAlign = 'left';
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * height;
      const value = (1 - i / 10).toFixed(1);
      ctx.fillText(value, 5, y + 4);
    }

    // Draw axis labels
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'center';
    ctx.fillText('Frequency (Hz)', width / 2, height - 20);
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Magnitude', 0, 0);
    ctx.restore();

    // Draw spectrums with improved rendering
    const drawSpectrum = (spectrum, color, lineWidth = 2) => {
      const { frequencies, magnitudes } = spectrum;

      // Find max magnitude with threshold
      let maxMag = 0;
      for (let i = 0; i < magnitudes.length; i++) {
        if (magnitudes[i] > maxMag) maxMag = magnitudes[i];
      }

      const MIN_THRESHOLD = 0.001;
      if (maxMag < MIN_THRESHOLD) maxMag = 1.0;

      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();

      let firstPoint = true;
      for (let i = 0; i < frequencies.length; i++) {
        const freq = frequencies[i];
        if (freq > maxFreq) break;

        const x = (freq / maxFreq) * width;
        const normalizedMag = magnitudes[i] / maxMag;
        const y = height - (normalizedMag * height * 0.9) - height * 0.05;

        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    // Draw input spectrum
    if (showInput && origSpectrum) {
      drawSpectrum(origSpectrum, '#3b82f6', 2.5);
    }

    // Draw output spectrum
    if (showOutput && procSpectrum) {
      drawSpectrum(procSpectrum, '#10b981', 2.5);
    }
  }, [originalSignal, processedSignal, sampleRate, showInput, showOutput]);

  const drawAudiogramSpectrum = useCallback(() => {
    const canvas = audiogramCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;

    // Don't draw if canvas has no size
    if (width === 0 || height === 0) return;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    if (!originalSignal || originalSignal.length === 0) return;

    // Helper function to create a robust hash from signal
    const createSignalHash = (signal) => {
      if (!signal || signal.length === 0) return 0;
      let hash = signal.length;
      for (let i = 0; i < 10; i++) {
        const idx = Math.floor((i / 10) * signal.length);
        hash += signal[idx] * (i + 1);
      }
      return hash;
    };

    // Ensure spectrum data is computed (not just reusing cache)
    let origSpectrum = spectrumCacheRef.current.orig;
    const origSignalHash = createSignalHash(originalSignal);
    if (!origSpectrum || spectrumCacheRef.current.origSignal !== origSignalHash) {
      origSpectrum = analyzeSpectrum(originalSignal, sampleRate);
      spectrumCacheRef.current.orig = origSpectrum;
      spectrumCacheRef.current.origSignal = origSignalHash;
    }

    let procSpectrum = spectrumCacheRef.current.proc;
    if (processedSignal && processedSignal.length > 0) {
      const procSignalHash = createSignalHash(processedSignal);
      if (!procSpectrum || spectrumCacheRef.current.procSignal !== procSignalHash) {
        procSpectrum = analyzeSpectrum(processedSignal, sampleRate);
        spectrumCacheRef.current.proc = procSpectrum;
        spectrumCacheRef.current.procSignal = procSignalHash;
      }
    } else {
      procSpectrum = null;
    }

    if (!origSpectrum) return;

    const maxFreq = sampleRate / 2;
    const audiogramFreqs = [250, 500, 1000, 2000, 4000, 8000];

    // Draw grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical grid lines at audiogram frequencies
    audiogramFreqs.forEach(freq => {
      const x = (Math.log10(freq) / Math.log10(maxFreq)) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    });

    // Draw frequency labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    audiogramFreqs.forEach(freq => {
      const x = (Math.log10(freq) / Math.log10(maxFreq)) * width;
      const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
      ctx.fillText(label, x, height - 5);
    });

    // Draw magnitude labels on y-axis
    ctx.textAlign = 'left';
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * height;
      const value = (1 - i / 10).toFixed(1);
      ctx.fillText(value, 5, y + 4);
    }

    // Draw axis labels
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'center';
    ctx.fillText('Frequency (Hz)', width / 2, height - 20);
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Magnitude', 0, 0);
    ctx.restore();

    // Draw audiogram spectrum
    const drawAudiogramData = (spectrum, color) => {
      const { frequencies, magnitudes } = spectrum;

      // Find max magnitude with threshold
      let maxMag = 0;
      for (let i = 0; i < magnitudes.length; i++) {
        if (magnitudes[i] > maxMag) maxMag = magnitudes[i];
      }

      const MIN_THRESHOLD = 0.001;
      if (maxMag < MIN_THRESHOLD) maxMag = 1.0;

      const points = [];

      // Sample magnitudes at audiogram frequencies
      audiogramFreqs.forEach(targetFreq => {
        let closestIdx = 0;
        let minDiff = Math.abs(frequencies[0] - targetFreq);

        for (let i = 1; i < frequencies.length; i++) {
          const diff = Math.abs(frequencies[i] - targetFreq);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = i;
          }
          if (frequencies[i] > targetFreq) break;
        }

        const x = (Math.log10(targetFreq) / Math.log10(maxFreq)) * width;
        const normalizedMag = magnitudes[closestIdx] / maxMag;
        const y = height - (normalizedMag * height * 0.9) - height * 0.05;

        points.push({ x, y });
      });

      // Draw lines connecting points
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      points.forEach((point, i) => {
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();

      // Draw marker circles
      ctx.fillStyle = color;
      points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    };

    // Draw input spectrum
    if (showInput && origSpectrum) {
      drawAudiogramData(origSpectrum, '#3b82f6');
    }

    // Draw output spectrum
    if (showOutput && procSpectrum) {
      drawAudiogramData(procSpectrum, '#10b981');
    }
  }, [originalSignal, processedSignal, sampleRate, showInput, showOutput]);

  // Effect to draw spectrums when data changes
  useEffect(() => {
    if (originalSignal && originalSignal.length > 0) {
      // Use requestAnimationFrame for smooth rendering
      const rafId = requestAnimationFrame(() => {
        // Draw linear spectrum if not audiogram-only mode
        if (!audiogramOnly) {
          drawLinearSpectrum();
        }

        // Draw audiogram spectrum if in audiogram mode
        if (audiogramOnly) {
          drawAudiogramSpectrum();
        }
      });

      return () => cancelAnimationFrame(rafId);
    }
  }, [originalSignal, processedSignal, sampleRate, showInput, showOutput, audiogramOnly, drawLinearSpectrum, drawAudiogramSpectrum]);

  /*const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setPanX(panX - deltaX);
    setPanY(panY - deltaY);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = useCallback((e) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoomLevel(Math.max(1, Math.min(20, zoomLevel * delta)));
  }, [zoomLevel]);*/

  const resetView = () => {
    setZoomLevel(1.0);
    setPanX(0);
    setPanY(0);
  };

  return (
    <section className={inline ? "spectrum-viewer-inline" : "dual-spectrum-viewer"}>
      {!inline && <h2>{title}</h2>}

      <div className={inline ? "spectrum-container-inline" : "dual-spectrum-container"}>
        {/* Linear Scale */}
        {!audiogramOnly && (
          <div className="spectrum-panel">
            {inline && (
              <div className="spectrum-panel-header">
                <h3>{title}</h3>
              </div>
            )}
            {!inline && (
              <div className="spectrum-panel-header">
                <h3>Linear Scale</h3>
                <div className="spectrum-controls">
                  <button className="reset-view-btn" onClick={resetView}>
                    <span>🔄</span> Reset View
                  </button>
                  <label className="show-hide-toggle">
                    <input
                      type="checkbox"
                      checked={showLinear}
                      onChange={(e) => setShowLinear(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">Show</span>
                  </label>
                </div>
              </div>
            )}
            {(inline || showLinear) && (
              <div className="spectrum-wrapper">
                <canvas
                  ref={linearCanvasRef}
                /*onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}*/
                />
              </div>
            )}
          </div>
        )}

        {/* Audiogram Scale */}
        {(audiogramOnly || !inline) && (
          <div className="spectrum-panel">
            {inline && (
              <div className="spectrum-panel-header">
                <h3>{title}</h3>
              </div>
            )}
            {!inline && (
              <div className="spectrum-panel-header">
                <h3>Audiogram Scale</h3>
                <div className="spectrum-controls">
                  <button className="reset-view-btn" onClick={resetView}>
                    <span>🔄</span> Reset View
                  </button>
                  <label className="show-hide-toggle">
                    <input
                      type="checkbox"
                      checked={showAudiogram}
                      onChange={(e) => setShowAudiogram(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">Show</span>
                  </label>
                </div>
              </div>
            )}
            {(inline || showAudiogram) && (
              <div className="spectrum-wrapper">
                <canvas
                  ref={audiogramCanvasRef}
                /*onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}*/
                />
              </div>
            )}
          </div>
        )}
      </div>

      {!inline && (
        <>
          <div className="spectrum-legend">
            {showInput && (
              <span className="legend-item">
                <span className="legend-color original"></span> {showOutput ? 'Input' : 'Original'}
              </span>
            )}
            {showOutput && (
              <span className="legend-item">
                <span className="legend-color processed"></span> {showInput ? 'Output' : 'Processed'}
              </span>
            )}
          </div>

          <div className="spectrum-controls-info">
            <p><strong>Controls:</strong> Click & Drag to Pan | Scroll to Zoom | Double-click to Reset</p>
          </div>
        </>
      )}
    </section>
  );
}
