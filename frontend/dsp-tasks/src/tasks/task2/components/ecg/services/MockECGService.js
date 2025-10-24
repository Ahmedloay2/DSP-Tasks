/**
 * Mock ECG Service - Consolidated
 * 
 * Generates simulated ECG signals for testing and demonstration:
 * - Synthetic 12-channel ECG generation
 * - Sampling frequency simulation
 * - Upsampling/Downsampling utilities
 */

class MockECGService {
  // ==================== ECG SIGNAL GENERATION ====================

  /**
   * Generate synthetic ECG signal for a single channel
   * @param {number} samplingRate - Sampling rate in Hz
   * @param {number} duration - Duration in seconds
   * @param {number} seed - Random seed for variation
   * @returns {number[]} Array of ECG samples
   */
  static generateECGSignal(samplingRate = 250, duration = 5, seed = 0) {
    const samples = samplingRate * duration;
    const signal = [];

    const heartRateVariation = 1.0 + (Math.sin(seed) * 0.2);
    const amplitudeVariation = 0.8 + (Math.cos(seed * 1.5) * 0.3);
    const noiseLevel = 0.05 + (Math.abs(Math.sin(seed * 2)) * 0.1);

    for (let i = 0; i < samples; i++) {
      const t = i / samplingRate;

      const heartRate = Math.sin(2 * Math.PI * 1.17 * heartRateVariation * t) * amplitudeVariation;

      const beatPeriod = 0.857 / heartRateVariation;
      const qrsPhase = ((t % beatPeriod) - 0.2);
      const qrsComplex = 3 * Math.sin(2 * Math.PI * 15 * t) * Math.exp(-(qrsPhase * qrsPhase) / 0.02) * amplitudeVariation;

      const pWave = 0.5 * Math.sin(2 * Math.PI * 0.7 * heartRateVariation * t) * Math.cos(2 * Math.PI * 0.5 * t) * amplitudeVariation;

      const noise = noiseLevel * Math.sin(2 * Math.PI * 0.05 * t + seed);
      const randomNoise = (Math.random() - 0.5) * noiseLevel * 0.5;

      const ecgValue = heartRate + qrsComplex + pWave + noise + randomNoise;
      signal.push(ecgValue);
    }

    return signal;
  }

  /**
   * Generate sampled signal data for multiple channels
   * @param {number} samplingRate - Target sampling rate in Hz
   * @param {number} duration - Duration in seconds
   * @returns {Object} Signal data with multiple channels
   */
  static generateSampledSignal(samplingRate = 250, duration = 5) {
    const channels = {};
    const channelNames = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8', 'ch9', 'ch10', 'ch11', 'ch12'];

    channelNames.forEach((ch, idx) => {
      const seed = idx * 1.234 + Math.PI;
      const channelSignal = this.generateECGSignal(samplingRate, duration, seed);
      
      const phaseShift = (idx * Math.PI) / 6;
      const amplitudeVar = 0.9 + (idx * 0.02);
      
      channels[ch] = channelSignal.map((sample, i) => {
        return sample * amplitudeVar + 0.05 * Math.sin(i * 0.01 + phaseShift);
      });
    });

    return {
      channels,
      metadata: {
        samplingRate,
        duration,
        sampleCount: samplingRate * duration,
        channelCount: 12,
        channelNames: Object.keys(channels),
        totalDataPoints: samplingRate * duration * 12
      }
    };
  }

  // ==================== SAMPLING UTILITIES ====================

  /**
   * Downsample a signal to a new sampling rate
   * @param {number[]} signal - Original signal samples
   * @param {number} originalRate - Original sampling rate
   * @param {number} newRate - New (target) sampling rate
   * @returns {number[]} Downsampled signal
   */
  static downsampleSignal(signal, originalRate, newRate) {
    if (newRate >= originalRate) {
      return signal;
    }

    const ratio = originalRate / newRate;
    const downsampled = [];

    for (let i = 0; i < signal.length; i += ratio) {
      downsampled.push(signal[Math.floor(i)]);
    }

    return downsampled;
  }

  /**
   * Upsample a signal by interpolation
   * @param {number[]} signal - Original signal samples
   * @param {number} factor - Upsampling factor
   * @returns {number[]} Upsampled signal
   */
  static upsampleSignal(signal, factor) {
    if (factor <= 1) {
      return signal;
    }

    const upsampled = [];

    for (let i = 0; i < signal.length - 1; i++) {
      upsampled.push(signal[i]);

      const curr = signal[i];
      const next = signal[i + 1];

      for (let j = 1; j < factor; j++) {
        const interpolated = curr + (next - curr) * (j / factor);
        upsampled.push(interpolated);
      }
    }

    upsampled.push(signal[signal.length - 1]);
    return upsampled;
  }
}

export default MockECGService;
