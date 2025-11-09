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
  sampleRate = 44100 
}) {
  const linearCanvasRef = useRef(null);
  const audiogramCanvasRef = useRef(null);
  const spectrumCacheRef = useRef({ orig: null, proc: null, origSignal: null, procSignal: null });
  
  const [showLinear, setShowLinear] = useState(true);
  const [showAudiogram, setShowAudiogram] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  //const [isDragging, setIsDragging] = useState(false);
  //const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const drawSpectrum = useCallback(() => {
    if (showLinear) drawLinearSpectrum();
    if (showAudiogram) drawAudiogramSpectrum();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLinear, showAudiogram, zoomLevel, panX, panY]);

  useEffect(() => {
    if (originalSignal && originalSignal.length > 0) {
      const timeoutId = setTimeout(() => {
        drawSpectrum();
      }, 100); // Throttle spectrum updates
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalSignal, processedSignal, sampleRate, showLinear, showAudiogram, zoomLevel, panX, panY]);

  const drawLinearSpectrum = () => {
    const canvas = linearCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;

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
      // Always recalculate if hash changed OR if we don't have cached spectrum yet
      if (spectrumCacheRef.current.procSignal !== procSignalHash || !procSpectrum) {
        procSpectrum = analyzeSpectrum(processedSignal, sampleRate);
        spectrumCacheRef.current.proc = procSpectrum;
        spectrumCacheRef.current.procSignal = procSignalHash;
      }
    } else {
      procSpectrum = null;
      // Clear cache when no processed signal
      spectrumCacheRef.current.proc = null;
      spectrumCacheRef.current.procSignal = null;
    }

    // Draw grid
    drawGrid(ctx, width, height, 'linear');

    // Draw spectrums
    drawSpectrumLine(ctx, origSpectrum, width, height, '#3b82f6', 'linear'); // Original (blue)
    if (procSpectrum) {
      drawSpectrumLine(ctx, procSpectrum, width, height, '#10b981', 'linear'); // Processed (green)
    }

    // Draw labels
    drawLabels(ctx, width, height, 'linear');
  };

  const drawAudiogramSpectrum = () => {
    const canvas = audiogramCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    if (!originalSignal || originalSignal.length === 0) return;

    // Reuse cached spectrum data
    const origSpectrum = spectrumCacheRef.current.orig;
    const procSpectrum = spectrumCacheRef.current.proc;

    if (!origSpectrum) return;

    // Draw grid
    drawGrid(ctx, width, height, 'audiogram');

    // Draw spectrums
    drawSpectrumLine(ctx, origSpectrum, width, height, '#3b82f6', 'audiogram'); // Original (blue)
    if (procSpectrum) {
      drawSpectrumLine(ctx, procSpectrum, width, height, '#10b981', 'audiogram'); // Processed (green)
    }

    // Draw labels
    drawLabels(ctx, width, height, 'audiogram');
  };

  const drawGrid = (ctx, width, height, scale) => {
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;

    // Horizontal lines
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical lines
    const divisions = scale === 'audiogram' ? 7 : 10;
    for (let i = 0; i <= divisions; i++) {
      const x = (i / divisions) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  };

  const drawSpectrumLine = (ctx, spectrum, width, height, color, scale) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    const { frequencies, magnitudes } = spectrum;
    const maxFreq = sampleRate / 2;

    // Find max magnitude for normalization (avoid spread operator for large arrays)
    let maxMag = 0;
    for (let i = 0; i < magnitudes.length; i++) {
      if (magnitudes[i] > maxMag) maxMag = magnitudes[i];
    }

    for (let i = 0; i < frequencies.length; i++) {
      const freq = frequencies[i];
      if (freq > maxFreq) break;

      let x;
      if (scale === 'audiogram') {
        // Logarithmic scale
        x = (Math.log10(freq + 1) / Math.log10(maxFreq)) * width;
      } else {
        // Linear scale
        x = (freq / maxFreq) * width;
      }

      // Apply zoom and pan
      x = (x - panX) * zoomLevel;
      
      const normalizedMag = magnitudes[i] / (maxMag || 1);
      const y = height - (normalizedMag * height * 0.9) - panY;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  };

  const drawLabels = (ctx, width, height, scale) => {
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px Arial';

    // X-axis labels (frequency) - reduced for audiogram
    const frequencies = scale === 'audiogram' 
      ? [125, 250, 500, 1000, 2000, 4000, 8000]  // Standard audiometric frequencies
      : [0, 2000, 4000, 6000, 8000, 10000, 12000, 14000, 16000, 18000, 20000];

    frequencies.forEach(freq => {
      let x;
      if (scale === 'audiogram') {
        x = (Math.log10(freq + 1) / Math.log10(sampleRate / 2)) * width;
      } else {
        x = (freq / (sampleRate / 2)) * width;
      }
      
      ctx.fillText(freq >= 1000 ? `${freq / 1000}k` : `${freq}`, x - 15, height - 5);
    });

    // Y-axis label
    ctx.save();
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Magnitude', -height / 2, 15);
    ctx.restore();

    // X-axis label
    ctx.fillText('Frequency (Hz)', width / 2 - 50, height - 5);
  };

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
    <section className="dual-spectrum-viewer">
      <h2>Frequency Spectrum Comparison</h2>

      <div className="dual-spectrum-container">
        {/* Linear Scale */}
        <div className={`spectrum-panel ${!showLinear ? 'hidden' : ''}`}>
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
                <span>Show</span>
              </label>
            </div>
          </div>
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
        </div>

        {/* Audiogram Scale */}
        <div className={`spectrum-panel ${!showAudiogram ? 'hidden' : ''}`}>
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
                <span>Show</span>
              </label>
            </div>
          </div>
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
        </div>
      </div>

      <div className="spectrum-legend">
        <span className="legend-item">
          <span className="legend-color original"></span> Original
        </span>
        <span className="legend-item">
          <span className="legend-color processed"></span> Processed
        </span>
      </div>

      <div className="spectrum-controls-info">
        <p><strong>Controls:</strong> Click & Drag to Pan | Scroll to Zoom | Double-click to Reset</p>
      </div>
    </section>
  );
}
