/**
 * Equalizer Service
 * Core equalizer functionality with FFT-based frequency manipulation
 * 
 * @author AI Assistant
 * @version 2.0.0
 */

import { fft, ifft, Complex } from './fftService';

/**
 * Create a new subdivision for frequency control
 * @param {number} startFreq - Start frequency in Hz
 * @param {number} endFreq - End frequency in Hz
 * @param {number} scale - Scaling factor (0 to 2)
 * @returns {Object} Subdivision object
 */
export function createSubdivision(startFreq, endFreq, scale) {
  if (scale < 0 || scale > 2) {
    throw new Error('Scale must be between 0 and 2');
  }

  if (startFreq >= endFreq) {
    throw new Error('Start frequency must be less than end frequency');
  }

  return {
    startFreq: startFreq,
    endFreq: endFreq,
    scale: scale
  };
}

/**
 * Create a generic mode configuration
 * @param {number} sampleRate - Sample rate in Hz
 * @param {Array} subdivisions - Array of subdivision objects
 * @returns {Object} Configuration object
 */
export function createGenericMode(sampleRate, subdivisions = []) {
  return {
    sampleRate: sampleRate,
    subdivisions: subdivisions,
    timestamp: new Date().toISOString()
  };
}

/**
 * Add a subdivision to configuration
 * @param {Object} config - Configuration object
 * @param {number} startFreq - Start frequency in Hz
 * @param {number} endFreq - End frequency in Hz
 * @param {number} scale - Scaling factor (0 to 2)
 * @returns {Object} Updated configuration
 */
export function addSubdivision(config, startFreq, endFreq, scale) {
  const subdivision = createSubdivision(startFreq, endFreq, scale);
  config.subdivisions.push(subdivision);
  return config;
}

/**
 * Remove a subdivision from configuration
 * @param {Object} config - Configuration object
 * @param {number} index - Index of subdivision to remove
 * @returns {Object} Updated configuration
 */
export function removeSubdivision(config, index) {
  if (index >= 0 && index < config.subdivisions.length) {
    config.subdivisions.splice(index, 1);
  }
  return config;
}

/**
 * Update an existing subdivision
 * @param {Object} config - Configuration object
 * @param {number} index - Index of subdivision to update
 * @param {number} startFreq - Start frequency in Hz
 * @param {number} endFreq - End frequency in Hz
 * @param {number} scale - Scaling factor (0 to 2)
 * @returns {Object} Updated configuration
 */
export function updateSubdivision(config, index, startFreq, endFreq, scale) {
  if (index >= 0 && index < config.subdivisions.length) {
    config.subdivisions[index] = createSubdivision(startFreq, endFreq, scale);
  }
  return config;
}

/**
 * Convert frequency to FFT bin index
 * @param {number} freq - Frequency in Hz
 * @param {number} sampleRate - Sample rate in Hz
 * @param {number} fftSize - Size of FFT
 * @returns {number} Bin index
 */
export function freqToBin(freq, sampleRate, fftSize) {
  return Math.round((freq * fftSize) / sampleRate);
}

/**
 * Apply equalizer settings to a signal in frequency domain
 * @param {Complex[]} complexSignal - Array of Complex objects from FFT
 * @param {Object} config - Configuration object with subdivisions
 * @returns {Complex[]} Modified complex signal
 */
export function applyEqualizer(complexSignal, config) {
  const N = complexSignal.length;
  const sampleRate = config.sampleRate;

  // Create a copy of the complex signal
  const modified = complexSignal.map(c => new Complex(c.real, c.imag));

  // Apply each subdivision's scaling
  for (const subdivision of config.subdivisions) {
    let startBin = freqToBin(subdivision.startFreq, sampleRate, N);
    let endBin = freqToBin(subdivision.endFreq, sampleRate, N);

    // Clamp to valid range
    startBin = Math.max(0, Math.min(startBin, N / 2));
    endBin = Math.max(0, Math.min(endBin, N / 2));

    // Apply scaling to positive frequencies
    for (let i = startBin; i <= endBin; i++) {
      modified[i].real *= subdivision.scale;
      modified[i].imag *= subdivision.scale;
    }

    // Apply scaling to negative frequencies (mirror)
    for (let i = startBin; i <= endBin; i++) {
      if (i > 0 && i < N) {
        const mirrorIndex = N - i;
        modified[mirrorIndex].real *= subdivision.scale;
        modified[mirrorIndex].imag *= subdivision.scale;
      }
    }
  }

  return modified;
}

/**
 * Process a signal through the equalizer
 * @param {Array} signal - Input signal
 * @param {Object} config - Configuration object
 * @returns {Array} Processed signal (time domain)
 */
export function processSignal(signal, config) {
  // Pad to power of 2
  const paddedSize = Math.pow(2, Math.ceil(Math.log2(signal.length)));
  const paddedSignal = new Array(paddedSize).fill(0);
  for (let i = 0; i < signal.length; i++) {
    paddedSignal[i] = signal[i];
  }

  // Convert to frequency domain
  const freqDomain = fft(paddedSignal);

  // Apply equalizer
  const modified = applyEqualizer(freqDomain, config);

  // Convert back to time domain
  const timeDomain = ifft(modified);

  // Extract real part and return only the original length
  return timeDomain.slice(0, signal.length).map(c => c.real);
}

/**
 * Process signal in chunks to prevent stack overflow
 * @param {Array} signal - Input signal
 * @param {Object} config - Configuration object
 * @param {Function} progressCallback - Progress callback function
 * @returns {Promise<Array>} Processed signal
 */
export async function processSignalInChunks(signal, config, progressCallback = null) {
  const chunkSize = 32768; // 32K samples (power of 2)
  const totalSamples = signal.length;
  const numChunks = Math.ceil(totalSamples / chunkSize);

  const processedChunks = [];

  for (let i = 0; i < numChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalSamples);
    const chunk = signal.slice(start, end);

    // Process chunk
    const processedChunk = processSignal(chunk, config);
    processedChunks.push(processedChunk);

    // Update progress
    if (progressCallback) {
      progressCallback((i + 1) / numChunks);
    }

    // Allow UI to update
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  // Combine chunks
  return processedChunks.flat();
}

/**
 * Generate frequency spectrum from signal
 * @param {Array} signal - Input signal
 * @param {number} sampleRate - Sample rate in Hz
 * @returns {Object} Spectrum object with frequencies and magnitudes
 */
export function analyzeSpectrum(signal, sampleRate) {
  // Validate inputs
  if (!signal || signal.length === 0) {
    return { frequencies: [], magnitudes: [] };
  }

  // Performance optimization: limit FFT size for large signals
  // Max FFT size: 65536 (2^16) for good frequency resolution without freezing
  const MAX_FFT_SIZE = 65536;
  let workingSignal = signal;
  
  // If signal is too long, downsample by taking evenly spaced samples
  if (signal.length > MAX_FFT_SIZE) {
    const decimationFactor = Math.ceil(signal.length / MAX_FFT_SIZE);
    workingSignal = [];
    for (let i = 0; i < signal.length; i += decimationFactor) {
      workingSignal.push(signal[i]);
    }
  }

  // Pad to power of 2 (limited to MAX_FFT_SIZE)
  const targetSize = Math.min(MAX_FFT_SIZE, Math.pow(2, Math.ceil(Math.log2(workingSignal.length))));
  const paddedSignal = new Array(targetSize).fill(0);
  for (let i = 0; i < Math.min(workingSignal.length, targetSize); i++) {
    paddedSignal[i] = workingSignal[i];
  }

  const freqDomain = fft(paddedSignal);
  const N = freqDomain.length;
  const halfN = Math.floor(N / 2);

  const frequencies = [];
  const magnitudes = [];

  for (let i = 0; i < halfN; i++) {
    const freq = (i * sampleRate) / N;
    const magnitude = Math.sqrt(
      freqDomain[i].real * freqDomain[i].real + 
      freqDomain[i].imag * freqDomain[i].imag
    );
    frequencies.push(freq);
    magnitudes.push(magnitude);
  }

  return { frequencies, magnitudes };
}

/**
 * Save configuration to JSON
 * @param {Object} config - Configuration object
 * @param {string} name - Configuration name
 * @returns {string} JSON string
 */
export function saveConfig(config, name = 'equalizer-config') {
  const configWithName = { ...config, name };
  return JSON.stringify(configWithName, null, 2);
}

/**
 * Load configuration from JSON
 * @param {string} jsonString - JSON string
 * @returns {Object} Configuration object
 */
export function loadConfig(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    throw new Error('Invalid configuration format: ' + e.message);
  }
}

/**
 * Generate synthetic test signal
 * @param {Array} frequencies - Array of frequency values in Hz
 * @param {Array} amplitudes - Array of amplitude values
 * @param {number} sampleRate - Sample rate in Hz
 * @param {number} duration - Duration in seconds
 * @returns {Array} Synthetic signal
 */
export function generateSyntheticSignal(frequencies, amplitudes, sampleRate, duration) {
  if (frequencies.length !== amplitudes.length) {
    throw new Error('Frequencies and amplitudes arrays must have the same length');
  }

  const numSamples = Math.pow(2, Math.ceil(Math.log2(sampleRate * duration)));
  const signal = new Array(numSamples).fill(0);

  for (let f = 0; f < frequencies.length; f++) {
    const freq = frequencies[f];
    const amplitude = amplitudes[f];

    for (let n = 0; n < numSamples; n++) {
      const t = n / sampleRate;
      signal[n] += amplitude * Math.sin(2 * Math.PI * freq * t);
    }
  }

  return signal;
}

/**
 * Create preset configurations
 */
export const PRESETS = {
  'bass-boost': [
    { startFreq: 0, endFreq: 250, scale: 1.8 },
    { startFreq: 250, endFreq: 4000, scale: 1.0 },
    { startFreq: 4000, endFreq: 20000, scale: 1.0 }
  ],
  'treble-boost': [
    { startFreq: 0, endFreq: 2000, scale: 1.0 },
    { startFreq: 2000, endFreq: 8000, scale: 1.6 },
    { startFreq: 8000, endFreq: 20000, scale: 1.8 }
  ],
  'v-shape': [
    { startFreq: 0, endFreq: 250, scale: 1.6 },
    { startFreq: 250, endFreq: 2000, scale: 0.7 },
    { startFreq: 2000, endFreq: 10000, scale: 1.5 }
  ],
  'flat': [
    { startFreq: 0, endFreq: 20000, scale: 1.0 }
  ]
};

/**
 * Apply a preset to configuration
 * @param {Object} config - Configuration object
 * @param {string} presetName - Name of preset
 * @returns {Object} Updated configuration
 */
export function applyPreset(config, presetName) {
  const preset = PRESETS[presetName];
  if (!preset) {
    throw new Error(`Unknown preset: ${presetName}`);
  }

  config.subdivisions = [];
  for (const sub of preset) {
    addSubdivision(config, sub.startFreq, sub.endFreq, sub.scale);
  }

  return config;
}
