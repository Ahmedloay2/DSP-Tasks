/**
 * Spectrogram Viewer Component
 * Displays time-frequency representation of signal
 * Uses custom FFT implementation for spectrogram calculation
 */
import React, { useRef, useEffect } from 'react';
import { fft } from '../../services/fftService';
import './SpectrogramViewer.css';

export default function SpectrogramViewer({
  signal = [],
  sampleRate = 44100,
  title = 'Spectrogram'
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (signal.length > 0) {
      drawSpectrogram();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal, sampleRate]);

  const drawSpectrogram = () => {
    const canvas = canvasRef.current;
    if (!canvas || signal.length === 0) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;

    // Clear
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Calculate spectrogram
    const windowSize = 1024; // FFT window size
    const hopSize = 256; // Overlap
    const numWindows = Math.floor((signal.length - windowSize) / hopSize);

    if (numWindows <= 0) {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '14px Arial';
      ctx.fillText('Signal too short for spectrogram', width / 2 - 100, height / 2);
      return;
    }

    const spectrogramData = [];
    let globalMax = 0;

    // Compute STFT
    for (let i = 0; i < numWindows; i++) {
      const start = i * hopSize;
      const end = start + windowSize;
      const window = signal.slice(start, end);

      // Apply Hann window
      const windowed = window.map((val, idx) => {
        const hannWindow = 0.5 * (1 - Math.cos((2 * Math.PI * idx) / (windowSize - 1)));
        return val * hannWindow;
      });

      // Compute FFT
      const freqDomain = fft(windowed);
      const magnitudes = [];

      // Get magnitude spectrum (only positive frequencies)
      for (let j = 0; j < freqDomain.length / 2; j++) {
        const mag = Math.sqrt(
          freqDomain[j].real * freqDomain[j].real +
          freqDomain[j].imag * freqDomain[j].imag
        );
        magnitudes.push(mag);
        if (mag > globalMax) globalMax = mag;
      }

      spectrogramData.push(magnitudes);
    }

    // Draw spectrogram
    const timeStep = width / numWindows;
    const freqStep = height / (windowSize / 2);

    for (let t = 0; t < spectrogramData.length; t++) {
      const mags = spectrogramData[t];
      for (let f = 0; f < mags.length; f++) {
        const intensity = Math.log10(1 + mags[f] / (globalMax || 1)) / Math.log10(2);
        const color = getColorForIntensity(intensity);
        
        ctx.fillStyle = color;
        ctx.fillRect(
          t * timeStep,
          height - (f * freqStep),
          timeStep + 1,
          freqStep + 1
        );
      }
    }

    // Draw axes and labels
    drawAxes(ctx, width, height);
    drawLabels(ctx, width, height, signal.length, sampleRate);
  };

  const getColorForIntensity = (intensity) => {
    // Colormap: blue -> cyan -> green -> yellow -> red
    const clamp = Math.max(0, Math.min(1, intensity));
    
    if (clamp < 0.25) {
      const t = clamp / 0.25;
      return `rgb(${Math.floor(t * 255)}, 0, ${Math.floor(255 * (1 - t))})`;
    } else if (clamp < 0.5) {
      const t = (clamp - 0.25) / 0.25;
      return `rgb(0, ${Math.floor(t * 255)}, ${Math.floor(255 * (1 - t))})`;
    } else if (clamp < 0.75) {
      const t = (clamp - 0.5) / 0.25;
      return `rgb(${Math.floor(t * 255)}, 255, 0)`;
    } else {
      const t = (clamp - 0.75) / 0.25;
      return `rgb(255, ${Math.floor(255 * (1 - t))}, 0)`;
    }
  };

  const drawAxes = (ctx, width, height) => {
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    
    // Bottom axis
    ctx.beginPath();
    ctx.moveTo(0, height - 1);
    ctx.lineTo(width, height - 1);
    ctx.stroke();

    // Left axis
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, height);
    ctx.stroke();
  };

  const drawLabels = (ctx, width, height, signalLength, sr) => {
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px Arial';

    // Time labels
    const duration = signalLength / sr;
    const timeSteps = [0, 0.25, 0.5, 0.75, 1.0];
    timeSteps.forEach(step => {
      const x = step * width;
      const time = (step * duration).toFixed(2);
      ctx.fillText(`${time}s`, x, height - 5);
    });

    // Frequency labels
    const maxFreq = sr / 2;
    const freqSteps = [0, 0.25, 0.5, 0.75, 1.0];
    freqSteps.forEach(step => {
      const y = height - (step * height);
      const freq = (step * maxFreq / 1000).toFixed(1);
      ctx.fillText(`${freq}k`, 5, y);
    });

    // Axis labels
    ctx.save();
    ctx.font = 'bold 12px Arial';
    ctx.fillText('Time (s)', width / 2 - 30, height - 20);
    
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Frequency (Hz)', 0, 0);
    ctx.restore();
  };

  return (
    <div className="spectrogram-viewer">
      <div className="viewer-header">
        <h3>{title}</h3>
        {signal.length === 0 && <span className="no-signal">No signal loaded</span>}
      </div>
      <canvas
        ref={canvasRef}
        className="spectrogram-canvas"
      />
      <div className="colorbar">
        <div className="colorbar-gradient"></div>
        <div className="colorbar-labels">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
