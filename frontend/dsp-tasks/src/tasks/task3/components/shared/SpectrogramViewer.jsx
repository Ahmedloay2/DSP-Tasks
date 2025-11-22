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

    // OPTIMIZED: Increased window and hop sizes for faster processing
    const windowSize = 2048; // Increased from 1024
    const hopSize = 1024;    // Increased from 256 (4x faster)

    // Limit number of windows for very long signals
    const maxWindows = 800;
    let processSignal = signal;
    let effectiveHopSize = hopSize;

    const estimatedWindows = Math.floor((signal.length - windowSize) / hopSize);

    if (estimatedWindows > maxWindows) {
      // Increase hop size to limit computation
      effectiveHopSize = Math.floor((signal.length - windowSize) / maxWindows);
    }

    const numWindows = Math.min(
      Math.floor((processSignal.length - windowSize) / effectiveHopSize),
      maxWindows
    );

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
      const start = i * effectiveHopSize;
      const end = start + windowSize;
      const window = processSignal.slice(start, end);

      // Apply Hann window
      const windowed = window.map((val, idx) => {
        const hannWindow = 0.5 * (1 - Math.cos((2 * Math.PI * idx) / (windowSize - 1)));
        return val * hannWindow;
      });

      // Compute FFT (returns {real, imag} as Float32Arrays)
      const { real, imag } = fft(windowed);
      const magnitudes = [];

      // Get magnitude spectrum (only positive frequencies)
      const halfLength = Math.floor(real.length / 2);
      for (let j = 0; j < halfLength; j++) {
        const mag = Math.sqrt(real[j] * real[j] + imag[j] * imag[j]);
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
        // Enhanced dynamic range compression
        // Convert to dB scale with better contrast
        const normalized = mags[f] / (globalMax || 1);
        const dbValue = 20 * Math.log10(Math.max(normalized, 1e-10));
        // Map from typical range [-100, 0] dB to [0, 1]
        const intensity = Math.max(0, Math.min(1, (dbValue + 80) / 80));

        // Apply gamma correction for better visibility
        const gamma = 0.7; // < 1 brightens mid-tones
        const enhancedIntensity = Math.pow(intensity, gamma);

        const color = getColorForIntensity(enhancedIntensity);

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
    drawLabels(ctx, width, height, processSignal.length, sampleRate);
  };

  const getColorForIntensity = (intensity) => {
    // Enhanced Magma colormap (similar to Python's matplotlib magma)
    // Better contrast and more vibrant colors
    const clamp = Math.max(0, Math.min(1, intensity));

    // Magma color stops (dark blue/purple -> red -> yellow -> white)
    if (clamp < 0.13) {
      // Very dark purple/blue
      const t = clamp / 0.13;
      const r = Math.floor(t * 15);
      const g = Math.floor(t * 10);
      const b = Math.floor(30 + t * 40);
      return `rgb(${r}, ${g}, ${b})`;
    } else if (clamp < 0.25) {
      // Dark purple
      const t = (clamp - 0.13) / 0.12;
      const r = Math.floor(15 + t * 50);
      const g = Math.floor(10 + t * 15);
      const b = Math.floor(70 + t * 60);
      return `rgb(${r}, ${g}, ${b})`;
    } else if (clamp < 0.5) {
      // Purple to red
      const t = (clamp - 0.25) / 0.25;
      const r = Math.floor(65 + t * 125);
      const g = Math.floor(25 + t * 25);
      const b = Math.floor(130 - t * 85);
      return `rgb(${r}, ${g}, ${b})`;
    } else if (clamp < 0.75) {
      // Red to orange/yellow
      const t = (clamp - 0.5) / 0.25;
      const r = Math.floor(190 + t * 55);
      const g = Math.floor(50 + t * 150);
      const b = Math.floor(45 - t * 35);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Yellow to white (bright)
      const t = (clamp - 0.75) / 0.25;
      const r = Math.floor(245 + t * 10);
      const g = Math.floor(200 + t * 55);
      const b = Math.floor(10 + t * 150);
      return `rgb(${r}, ${g}, ${b})`;
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
