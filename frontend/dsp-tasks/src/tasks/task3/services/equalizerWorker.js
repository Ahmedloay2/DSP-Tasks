/**
 * Web Worker for Parallel FFT Processing
 * Processes audio chunks in parallel to improve performance
 */

import { fft, ifft, Complex } from './fftService';

/**
 * Convert frequency to FFT bin index
 */
function freqToBin(freq, sampleRate, fftSize) {
    return Math.round((freq * fftSize) / sampleRate);
}

/**
 * Apply equalizer settings to a signal in frequency domain
 */
function applyEqualizer(complexSignal, config) {
    const N = complexSignal.length;
    const sampleRate = config.sampleRate;

    // Create a copy of the complex signal
    const modified = new Array(N);
    for (let i = 0; i < N; i++) {
        modified[i] = new Complex(complexSignal[i].real, complexSignal[i].imag);
    }

    // Calculate frequency resolution
    const freqResolution = sampleRate / N;
    const nyquistBin = Math.floor(N / 2);

    // Apply each subdivision's scaling
    for (const subdivision of config.subdivisions) {
        let startBin = Math.round(subdivision.startFreq / freqResolution);
        let endBin = Math.round(subdivision.endFreq / freqResolution);

        // Clamp to valid range
        startBin = Math.max(0, Math.min(startBin, nyquistBin));
        endBin = Math.max(0, Math.min(endBin, nyquistBin));

        const scale = subdivision.scale;

        // Apply scaling to positive frequencies
        for (let i = startBin; i <= endBin; i++) {
            modified[i].real *= scale;
            modified[i].imag *= scale;
        }

        // Apply scaling to negative frequencies (mirror)
        for (let i = startBin; i <= endBin; i++) {
            if (i > 0 && i < nyquistBin) {
                const mirrorIndex = N - i;
                if (mirrorIndex > 0 && mirrorIndex < N) {
                    modified[mirrorIndex].real *= scale;
                    modified[mirrorIndex].imag *= scale;
                }
            }
        }
    }

    return modified;
}

/**
 * Process a signal chunk through the equalizer
 */
function processChunk(signal, config) {
    // Early return if no subdivisions
    if (!config.subdivisions || config.subdivisions.length === 0) {
        return Array.from(signal);
    }

    // Ensure power of 2 size
    const chunkSize = signal.length;
    const paddedSize = Math.pow(2, Math.ceil(Math.log2(chunkSize)));

    // Create padded signal
    const paddedSignal = new Float32Array(paddedSize);
    for (let i = 0; i < chunkSize; i++) {
        paddedSignal[i] = signal[i];
    }

    // Convert to frequency domain using optimized FFT
    const { real, imag } = fft(paddedSignal);

    // Convert to Complex array for equalizer
    const complexArray = new Array(real.length);
    for (let i = 0; i < real.length; i++) {
        complexArray[i] = new Complex(real[i], imag[i]);
    }

    // Apply equalizer
    const modified = applyEqualizer(complexArray, config);

    // Convert back to Float32Arrays for IFFT
    const modifiedReal = new Float32Array(modified.length);
    const modifiedImag = new Float32Array(modified.length);
    for (let i = 0; i < modified.length; i++) {
        modifiedReal[i] = modified[i].real;
        modifiedImag[i] = modified[i].imag;
    }

    // Convert back to time domain
    const { real: timeReal } = ifft(modifiedReal, modifiedImag);

    // Extract and return the original chunk size
    const result = new Array(chunkSize);
    for (let i = 0; i < chunkSize; i++) {
        result[i] = timeReal[i];
    }

    return result;
}

// Listen for messages from main thread
self.onmessage = function (e) {
    const { type, data } = e.data;

    if (type === 'PROCESS_CHUNK') {
        const { chunk, config, chunkIndex } = data;

        try {
            const processedChunk = processChunk(chunk, config);

            // Send result back to main thread
            self.postMessage({
                type: 'CHUNK_PROCESSED',
                data: {
                    processedChunk,
                    chunkIndex
                }
            });
        } catch (error) {
            self.postMessage({
                type: 'ERROR',
                data: {
                    error: error.message,
                    chunkIndex
                }
            });
        }
    }
};
