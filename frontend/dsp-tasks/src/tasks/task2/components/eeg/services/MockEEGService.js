/**
 * Mock EEG Service - Consolidated
 * 
 * Generates simulated EEG signals for testing and demonstration:
 * - Synthetic multi-channel EEG generation
 * - Brain wave band simulation (Delta, Theta, Alpha, Beta)
 * - Upsampling/Downsampling utilities
 */

class MockEEGService {
  // ==================== EEG SIGNAL GENERATION ====================

  /**
   * Generate synthetic EEG signal for a single channel
   */
  static generateEEGSignal(samplingRate = 250, duration = 5, seed = 0) {
    const samples = samplingRate * duration;
    const signal = [];

    const alphaIntensity = 1.2 + (Math.sin(seed) * 0.5);
    const betaIntensity = 0.6 + (Math.cos(seed * 1.3) * 0.3);
    const thetaIntensity = 0.8 + (Math.sin(seed * 1.7) * 0.4);
    const deltaIntensity = 0.4 + (Math.cos(seed * 2.1) * 0.2);
    const noiseLevel = 0.1 + (Math.abs(Math.sin(seed * 2.5)) * 0.15);

    for (let i = 0; i < samples; i++) {
      const t = i / samplingRate;

      // Alpha band (8-12 Hz)
      const alpha = alphaIntensity * Math.sin(2 * Math.PI * (9 + Math.sin(seed) * 2) * t);

      // Beta band (12-30 Hz)
      const beta = betaIntensity * Math.sin(2 * Math.PI * (18 + Math.cos(seed * 1.5) * 8) * t) * Math.cos(2 * Math.PI * 0.5 * t);

      // Theta band (4-8 Hz)
      const theta = thetaIntensity * Math.sin(2 * Math.PI * (5 + Math.sin(seed * 1.8) * 2) * t);

      // Delta band (0.5-4 Hz)
      const delta = deltaIntensity * Math.sin(2 * Math.PI * (1.5 + Math.cos(seed * 2) * 1.5) * t);

      const noise = noiseLevel * Math.sin(2 * Math.PI * 0.1 * t + seed);
      const randomNoise = (Math.random() - 0.5) * noiseLevel * 0.3;

      const eegValue = alpha + beta * 0.5 + theta * 0.3 + delta * 0.2 + noise + randomNoise;
      signal.push(eegValue);
    }

    return signal;
  }

  /**
   * Generate sampled signal data for multiple channels
   */
  static generateSampledSignal(samplingRate = 250, duration = 5, channelCount = 14) {
    const channels = {};

    for (let i = 1; i <= channelCount; i++) {
      const chName = `ch${i}`;
      const seed = i * 2.456 + Math.E;
      const channelSignal = this.generateEEGSignal(samplingRate, duration, seed);
      
      const phaseShift = (i * Math.PI) / 7;
      const amplitudeVar = 0.85 + (i * 0.03);
      
      channels[chName] = channelSignal.map((sample, idx) => {
        return sample * amplitudeVar + 0.08 * Math.sin(idx * 0.02 + phaseShift);
      });
    }

    return {
      channels,
      metadata: {
        samplingRate,
        duration,
        sampleCount: samplingRate * duration,
        channelCount: channelCount,
        channelNames: Object.keys(channels),
        totalDataPoints: samplingRate * duration * channelCount,
        recordingType: 'EEG'
      }
    };
  }

  // ==================== SAMPLING UTILITIES ====================

  /**
   * Downsample a signal to a new sampling rate
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

export default MockEEGService;
