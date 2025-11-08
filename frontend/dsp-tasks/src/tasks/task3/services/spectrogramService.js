/**
 * Spectrogram Generation Service
 * 
 * Custom implementation of spectrogram generation without external libraries.
 * Uses FFT for time-frequency analysis of signals.
 * 
 * @author AI Assistant
 * @version 1.0.0
 */

import { fft, applyWindow, getMagnitudeSpectrum } from './fftService';

/**
 * Generate spectrogram from audio signal
 * 
 * @param {number[]} signal - Input audio signal
 * @param {Object} options - Spectrogram options
 * @param {number} options.windowSize - Size of FFT window (default: 1024)
 * @param {number} options.hopSize - Hop size between windows (default: 512)
 * @param {string} options.windowType - Window function type (default: 'hamming')
 * @param {number} options.sampleRate - Sample rate in Hz (default: 44100)
 * @returns {Object} - Spectrogram data
 */
export function generateSpectrogram(signal, options = {}) {
  const {
    windowSize = 1024,
    hopSize = 512,
    windowType = 'hamming',
    sampleRate = 44100
  } = options;

  const numFrames = Math.floor((signal.length - windowSize) / hopSize) + 1;
  const numBins = Math.floor(windowSize / 2);
  
  // Initialize spectrogram matrix
  const spectrogram = [];
  
  // Process each frame
  for (let frame = 0; frame < numFrames; frame++) {
    const start = frame * hopSize;
    const end = start + windowSize;
    
    // Extract frame and pad if necessary
    const frameData = signal.slice(start, end);
    if (frameData.length < windowSize) {
      const padded = new Array(windowSize).fill(0);
      frameData.forEach((val, i) => padded[i] = val);
      frameData.length = 0;
      frameData.push(...padded);
    }
    
    // Apply window function
    const windowed = applyWindow(frameData, windowType);
    
    // Compute FFT
    const fftResult = fft(windowed);
    
    // Get magnitude spectrum
    const magnitudes = getMagnitudeSpectrum(fftResult);
    
    // Convert to dB scale
    const dB = magnitudes.map(m => 20 * Math.log10(Math.max(m, 1e-10)));
    
    spectrogram.push(dB);
  }

  // Transpose to get frequency on y-axis
  const transposed = [];
  for (let bin = 0; bin < numBins; bin++) {
    const row = [];
    for (let frame = 0; frame < numFrames; frame++) {
      row.push(spectrogram[frame][bin]);
    }
    transposed.push(row);
  }

  // Calculate time and frequency axes
  const timeAxis = [];
  for (let i = 0; i < numFrames; i++) {
    timeAxis.push((i * hopSize) / sampleRate);
  }

  const freqAxis = [];
  for (let i = 0; i < numBins; i++) {
    freqAxis.push((i * sampleRate) / windowSize);
  }

  return {
    data: transposed,
    timeAxis,
    freqAxis,
    sampleRate,
    windowSize,
    hopSize
  };
}

/**
 * Normalize spectrogram data for visualization
 * 
 * @param {number[][]} spectrogramData - Raw spectrogram data
 * @returns {number[][]} - Normalized spectrogram (0-255 range)
 */
export function normalizeSpectrogram(spectrogramData) {
  // Find min and max values
  let min = Infinity;
  let max = -Infinity;
  
  for (const row of spectrogramData) {
    for (const value of row) {
      if (value < min) min = value;
      if (value > max) max = value;
    }
  }

  const range = max - min;
  if (range === 0) return spectrogramData;

  // Normalize to 0-255 range
  return spectrogramData.map(row =>
    row.map(value => ((value - min) / range) * 255)
  );
}

/**
 * Apply colormap to spectrogram data
 * 
 * @param {number[][]} normalizedData - Normalized spectrogram data (0-255)
 * @param {string} colormap - Colormap name ('viridis', 'plasma', 'magma', 'jet')
 * @returns {ImageData} - ImageData object for canvas rendering
 */
export function applyColormap(normalizedData, colormap = 'viridis') {
  const height = normalizedData.length;
  const width = normalizedData[0].length;
  
  const imageData = new ImageData(width, height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = normalizedData[height - 1 - y][x]; // Flip vertically
      const color = getColor(value, colormap);
      
      const idx = (y * width + x) * 4;
      imageData.data[idx] = color.r;
      imageData.data[idx + 1] = color.g;
      imageData.data[idx + 2] = color.b;
      imageData.data[idx + 3] = 255; // Alpha
    }
  }
  
  return imageData;
}

/**
 * Get color for value using specified colormap
 * 
 * @param {number} value - Value (0-255)
 * @param {string} colormap - Colormap name
 * @returns {Object} - RGB color object
 */
function getColor(value, colormap) {
  const t = value / 255;
  
  switch (colormap) {
    case 'viridis':
      return viridisColormap(t);
    case 'plasma':
      return plasmaColormap(t);
    case 'magma':
      return magmaColormap(t);
    case 'jet':
      return jetColormap(t);
    default:
      return viridisColormap(t);
  }
}

/**
 * Viridis colormap implementation
 */
function viridisColormap(t) {
  const r = 0.267 + 0.005 * t + 2.817 * t * t - 5.159 * t * t * t + 2.791 * t * t * t * t;
  const g = 0.005 + 1.365 * t - 2.587 * t * t + 2.361 * t * t * t - 0.668 * t * t * t * t;
  const b = 0.329 + 2.030 * t - 5.898 * t * t + 6.809 * t * t * t - 2.628 * t * t * t * t;
  
  return {
    r: Math.round(Math.max(0, Math.min(1, r)) * 255),
    g: Math.round(Math.max(0, Math.min(1, g)) * 255),
    b: Math.round(Math.max(0, Math.min(1, b)) * 255)
  };
}

/**
 * Plasma colormap implementation
 */
function plasmaColormap(t) {
  const r = 0.513 + 0.416 * t + 2.201 * t * t - 4.330 * t * t * t + 2.001 * t * t * t * t;
  const g = 0.016 + 1.442 * t - 2.266 * t * t + 1.695 * t * t * t - 0.644 * t * t * t * t;
  const b = 0.582 + 1.613 * t - 5.194 * t * t + 5.916 * t * t * t - 2.324 * t * t * t * t;
  
  return {
    r: Math.round(Math.max(0, Math.min(1, r)) * 255),
    g: Math.round(Math.max(0, Math.min(1, g)) * 255),
    b: Math.round(Math.max(0, Math.min(1, b)) * 255)
  };
}

/**
 * Magma colormap implementation
 */
function magmaColormap(t) {
  const r = -0.002 + 0.347 * t + 2.558 * t * t - 3.904 * t * t * t + 1.964 * t * t * t * t;
  const g = 0.001 + 1.367 * t - 2.666 * t * t + 2.191 * t * t * t - 0.742 * t * t * t * t;
  const b = 0.318 + 2.195 * t - 6.850 * t * t + 8.796 * t * t * t - 3.687 * t * t * t * t;
  
  return {
    r: Math.round(Math.max(0, Math.min(1, r)) * 255),
    g: Math.round(Math.max(0, Math.min(1, g)) * 255),
    b: Math.round(Math.max(0, Math.min(1, b)) * 255)
  };
}

/**
 * Jet colormap implementation
 */
function jetColormap(t) {
  let r, g, b;
  
  if (t < 0.125) {
    r = 0;
    g = 0;
    b = 0.5 + 0.5 * (t / 0.125);
  } else if (t < 0.375) {
    r = 0;
    g = (t - 0.125) / 0.25;
    b = 1;
  } else if (t < 0.625) {
    r = (t - 0.375) / 0.25;
    g = 1;
    b = 1 - (t - 0.375) / 0.25;
  } else if (t < 0.875) {
    r = 1;
    g = 1 - (t - 0.625) / 0.25;
    b = 0;
  } else {
    r = 1 - 0.5 * (t - 0.875) / 0.125;
    g = 0;
    b = 0;
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

export default {
  generateSpectrogram,
  normalizeSpectrogram,
  applyColormap
};
