export class Complex {
  constructor(real, imag = 0) {
    this.real = real;
    this.imag = imag;
  }

  /**
   * Add two complex numbers
   */
  add(other) {
    return new Complex(this.real + other.real, this.imag + other.imag);
  }

  /**
   * Subtract two complex numbers
   */
  subtract(other) {
    return new Complex(this.real - other.real, this.imag - other.imag);
  }

  /**
   * Multiply two complex numbers
   */
  multiply(other) {
    return new Complex(
      this.real * other.real - this.imag * other.imag,
      this.real * other.imag + this.imag * other.real
    );
  }

  /**
   * Get magnitude of complex number
   */
  magnitude() {
    return Math.sqrt(this.real * this.real + this.imag * this.imag);
  }

  /**
   * Get phase of complex number
   */
  phase() {
    return Math.atan2(this.imag, this.real);
  }
}

/**
 * Cooley-Tukey FFT algorithm implementation
 * 
 * @param {number[]|Complex[]} x - Input signal (will be padded to power of 2)
 * @returns {Complex[]} - Frequency domain representation
 */
export function fft(x) {
  const n = x.length;

  // Base case
  if (n === 1) {
    return [x[0] instanceof Complex ? x[0] : new Complex(x[0])];
  }

  // Ensure length is power of 2
  if ((n & (n - 1)) !== 0) {
    const nextPow2 = Math.pow(2, Math.ceil(Math.log2(n)));
    const padded = new Array(nextPow2).fill(0);
    for (let i = 0; i < n; i++) {
      padded[i] = x[i];
    }
    return fft(padded);
  }

  // Convert to complex if needed
  const complexInput = x.map(val => 
    val instanceof Complex ? val : new Complex(val)
  );

  // Divide: separate even and odd indices
  const even = [];
  const odd = [];
  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) {
      even.push(complexInput[i]);
    } else {
      odd.push(complexInput[i]);
    }
  }

  // Conquer: recursively compute FFT of even and odd parts
  const fftEven = fft(even);
  const fftOdd = fft(odd);

  // Combine: merge results
  const result = new Array(n);
  for (let k = 0; k < n / 2; k++) {
    const theta = -2 * Math.PI * k / n;
    const wk = new Complex(Math.cos(theta), Math.sin(theta));
    const t = wk.multiply(fftOdd[k]);
    
    result[k] = fftEven[k].add(t);
    result[k + n / 2] = fftEven[k].subtract(t);
  }

  return result;
}

/**
 * Inverse Fast Fourier Transform (IFFT)
 * 
 * @param {Complex[]} X - Frequency domain representation
 * @returns {Complex[]} - Time domain signal
 */
export function ifft(X) {
  const n = X.length;

  // Conjugate the complex numbers
  const conjugated = X.map(c => new Complex(c.real, -c.imag));

  // Apply FFT
  const result = fft(conjugated);

  // Conjugate again and scale
  return result.map(c => new Complex(c.real / n, -c.imag / n));
}

/**
 * Get frequency bins for FFT output
 * 
 * @param {number} n - FFT size
 * @param {number} sampleRate - Sample rate in Hz
 * @returns {number[]} - Array of frequency values
 */
export function getFrequencyBins(n, sampleRate) {
  const bins = new Array(Math.floor(n / 2));
  for (let i = 0; i < bins.length; i++) {
    bins[i] = (i * sampleRate) / n;
  }
  return bins;
}

/**
 * Compute magnitude spectrum from FFT output
 * 
 * @param {Complex[]} fftResult - FFT output
 * @returns {number[]} - Magnitude spectrum
 */
export function getMagnitudeSpectrum(fftResult) {
  const n = fftResult.length;
  const magnitudes = new Array(Math.floor(n / 2));
  
  for (let i = 0; i < magnitudes.length; i++) {
    magnitudes[i] = fftResult[i].magnitude();
  }
  
  return magnitudes;
}

/**
 * Compute power spectrum from FFT output
 * 
 * @param {Complex[]} fftResult - FFT output
 * @returns {number[]} - Power spectrum
 */
export function getPowerSpectrum(fftResult) {
  const magnitudes = getMagnitudeSpectrum(fftResult);
  return magnitudes.map(m => m * m);
}

/**
 * Apply window function to signal
 * 
 * @param {number[]} signal - Input signal
 * @param {string} windowType - Window type ('hamming', 'hann', 'blackman')
 * @returns {number[]} - Windowed signal
 */
export function applyWindow(signal, windowType = 'hamming') {
  const n = signal.length;
  const windowed = new Array(n);

  for (let i = 0; i < n; i++) {
    let window;
    switch (windowType) {
      case 'hamming':
        window = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (n - 1));
        break;
      case 'hann':
        window = 0.5 * (1 - Math.cos(2 * Math.PI * i / (n - 1)));
        break;
      case 'blackman':
        window = 0.42 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1)) + 
                 0.08 * Math.cos(4 * Math.PI * i / (n - 1));
        break;
      default:
        window = 1;
    }
    windowed[i] = signal[i] * window;
  }

  return windowed;
}

/**
 * Convert frequency to Audiogram scale (similar to mel scale)
 * 
 * @param {number} freq - Frequency in Hz
 * @returns {number} - Audiogram scale value
 */
export function freqToAudiogramScale(freq) {
  // Using a logarithmic scale similar to audiogram standards
  return 1000 * Math.log10(freq / 1000 + 1);
}

/**
 * Convert Audiogram scale to frequency
 * 
 * @param {number} audiogram - Audiogram scale value
 * @returns {number} - Frequency in Hz
 */
export function audiogramScaleToFreq(audiogram) {
  return 1000 * (Math.pow(10, audiogram / 1000) - 1);
}

export default {
  Complex,
  fft,
  ifft,
  getFrequencyBins,
  getMagnitudeSpectrum,
  getPowerSpectrum,
  applyWindow,
  freqToAudiogramScale,
  audiogramScaleToFreq
};
