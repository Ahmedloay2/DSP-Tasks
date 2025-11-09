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

    // Apply each subdivision's scaling
    for (const subdivision of config.subdivisions) {
        let startBin = freqToBin(subdivision.startFreq, sampleRate, N);
        let endBin = freqToBin(subdivision.endFreq, sampleRate, N);

        // Clamp to valid range
        startBin = Math.max(0, Math.min(startBin, N / 2));
        endBin = Math.max(0, Math.min(endBin, N / 2));

        const scale = subdivision.scale;

        // Apply scaling to positive frequencies
        for (let i = startBin; i <= endBin; i++) {
            modified[i].real *= scale;
            modified[i].imag *= scale;
        }

        // Apply scaling to negative frequencies (mirror)
        for (let i = startBin; i <= endBin; i++) {
            if (i > 0 && i < N) {
                const mirrorIndex = N - i;
                modified[mirrorIndex].real *= scale;
                modified[mirrorIndex].imag *= scale;
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
        return signal.slice();
    }

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
    const result = new Array(signal.length);
    for (let i = 0; i < signal.length; i++) {
        result[i] = timeDomain[i].real;
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
