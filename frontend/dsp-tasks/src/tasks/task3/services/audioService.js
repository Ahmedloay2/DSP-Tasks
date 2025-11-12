import { fft, ifft, Complex } from './fftService';

/**
 * Load audio file and extract signal data
 * 
 * @param {File} file - Audio file
 * @returns {Promise<Object>} - Audio data object
 */
export async function loadAudioFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = e.target.result;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Extract channel data
        const channels = [];
        for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
          channels.push(Array.from(audioBuffer.getChannelData(i)));
        }
        
        resolve({
          signal: channels[0], // Use first channel
          sampleRate: audioBuffer.sampleRate,
          duration: audioBuffer.duration,
          numberOfChannels: audioBuffer.numberOfChannels,
          audioBuffer: audioBuffer
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generate synthetic signal (sum of sine waves)
 * 
 * @param {Object[]} components - Array of frequency components
 * @param {number} components[].frequency - Frequency in Hz
 * @param {number} components[].amplitude - Amplitude (0-1)
 * @param {number} components[].phase - Phase in radians
 * @param {number} duration - Duration in seconds
 * @param {number} sampleRate - Sample rate in Hz
 * @returns {number[]} - Generated signal
 */
export function generateSyntheticSignal(components, duration = 3, sampleRate = 44100) {
  const numSamples = Math.floor(duration * sampleRate);
  const signal = new Array(numSamples).fill(0);
  
  for (const component of components) {
    const { frequency, amplitude = 1, phase = 0 } = component;
    
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      signal[i] += amplitude * Math.sin(2 * Math.PI * frequency * t + phase);
    }
  }
  
  // Normalize (avoid spreading large arrays which causes stack overflow)
  let max = 0;
  for (let i = 0; i < signal.length; i++) {
    const absValue = Math.abs(signal[i]);
    if (absValue > max) max = absValue;
  }
  
  if (max > 0) {
    for (let i = 0; i < signal.length; i++) {
      signal[i] /= max;
    }
  }
  
  return signal;
}

/**
 * Apply frequency domain filter to signal
 * 
 * @param {number[]} signal - Input signal
 * @param {Object[]} frequencyBands - Array of frequency band modifications
 * @param {number} frequencyBands[].startFreq - Start frequency in Hz
 * @param {number} frequencyBands[].endFreq - End frequency in Hz
 * @param {number} frequencyBands[].gain - Gain multiplier (0-2)
 * @param {number} sampleRate - Sample rate in Hz
 * @returns {number[]} - Filtered signal
 */
export function applyFrequencyFilter(signal, frequencyBands, sampleRate) {
  // Compute FFT
  const fftResult = fft(signal);
  const n = fftResult.length;
  
  // Calculate frequency resolution
  const freqResolution = sampleRate / n;
  
  // Apply gain to each frequency band
  for (const band of frequencyBands) {
    const { startFreq, endFreq, gain } = band;
    
    // Convert frequencies to bin indices
    const startBin = Math.floor(startFreq / freqResolution);
    const endBin = Math.ceil(endFreq / freqResolution);
    
    // Apply gain to bins in range (and their negative frequency counterparts)
    for (let i = startBin; i <= endBin && i < n / 2; i++) {
      fftResult[i] = new Complex(
        fftResult[i].real * gain,
        fftResult[i].imag * gain
      );
      
      // Apply to negative frequencies (conjugate symmetry)
      if (i > 0 && i < n / 2) {
        const negIdx = n - i;
        fftResult[negIdx] = new Complex(
          fftResult[negIdx].real * gain,
          fftResult[negIdx].imag * gain
        );
      }
    }
  }
  
  // Inverse FFT to get filtered signal
  const filtered = ifft(fftResult);
  
  // Extract real part and normalize
  const result = filtered.map(c => c.real);
  const max = Math.max(...result.map(Math.abs));
  if (max > 0) {
    for (let i = 0; i < result.length; i++) {
      result[i] /= max;
    }
  }
  
  return result;
}

/**
 * Convert signal to audio buffer for playback
 * 
 * @param {number[]} signal - Signal data
 * @param {number} sampleRate - Sample rate in Hz
 * @returns {AudioBuffer} - Audio buffer
 */
export function signalToAudioBuffer(signal, sampleRate = 44100) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = audioContext.createBuffer(1, signal.length, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  
  for (let i = 0; i < signal.length; i++) {
    channelData[i] = signal[i];
  }
  
  return audioBuffer;
}

/**
 * Play audio buffer
 * 
 * @param {AudioBuffer} audioBuffer - Audio buffer to play
 * @param {number} volume - Volume (0-1)
 * @returns {Object} - Audio source controls
 */
export function playAudioBuffer(audioBuffer, volume = 1) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioContext.createBufferSource();
  const gainNode = audioContext.createGain();
  
  source.buffer = audioBuffer;
  gainNode.gain.value = volume;
  
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  source.start(0);
  
  return {
    source,
    gainNode,
    audioContext,
    stop: () => source.stop(),
    setVolume: (vol) => { gainNode.gain.value = vol; }
  };
}

/**
 * Convert audio buffer to WAV format
 * 
 * @param {AudioBuffer} buffer - Audio buffer
 * @returns {ArrayBuffer} - WAV file data
 */
function audioBufferToWav(buffer) {
  const length = buffer.length * buffer.numberOfChannels * 2;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, buffer.numberOfChannels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true);
  view.setUint16(32, buffer.numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length, true);

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return arrayBuffer;
}

/**
 * Convert signal array to audio URL (blob URL)
 * 
 * @param {number[]} signal - Audio signal array
 * @param {number} sampleRate - Sample rate in Hz
 * @returns {string} - Blob URL for audio playback
 */
export function signalToAudioUrl(signal, sampleRate = 44100) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const buffer = audioCtx.createBuffer(1, signal.length, sampleRate);
  const channelData = buffer.getChannelData(0);
  
  for (let i = 0; i < signal.length; i++) {
    channelData[i] = signal[i];
  }

  const wav = audioBufferToWav(buffer);
  const blob = new Blob([wav], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

/**
 * Save configuration to JSON
 * 
 * @param {Object} config - Configuration object
 * @param {string} filename - Output filename
 */
export function saveConfiguration(config, filename = 'equalizer-config.json') {
  const json = JSON.stringify(config, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Load configuration from JSON file
 * 
 * @param {File} file - JSON configuration file
 * @returns {Promise<Object>} - Configuration object
 */
export async function loadConfiguration(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result);
        resolve(config);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export default {
  loadAudioFile,
  generateSyntheticSignal,
  applyFrequencyFilter,
  signalToAudioBuffer,
  signalToAudioUrl,
  playAudioBuffer,
  saveConfiguration,
  loadConfiguration
};
