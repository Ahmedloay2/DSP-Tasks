/**
 * Task 3 Backend API Service
 * 
 * Comprehensive service for all Task 3 backend operations
 */

const SERVER_URL = 'http://localhost:5001';

/**
 * Check if the backend server is running
 * @returns {Promise<boolean>}
 */
export async function checkServerStatus() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch(`${SERVER_URL}/health`, {
            method: 'GET',
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        const data = await response.json();
        return data.status === 'ok';
    } catch (error) {
        return false;
    }
}

/**
 * Get server health information
 * @returns {Promise<Object>}
 */
export async function getServerHealth() {
    const response = await fetch(`${SERVER_URL}/health`);
    return await response.json();
}

// ============================================================================
// INSTRUMENT SEPARATION
// ============================================================================

/**
 * Separate audio into instruments with AI
 * @param {File} audioFile - Audio file
 * @param {Object} gains - Gain settings for each instrument
 * @param {Function} onProgress - Progress callback
 * @param {string} sessionId - Optional session ID
 * @returns {Promise<Object>}
 */
export async function separateInstruments(audioFile, gains = {}, onProgress = null, sessionId = null) {
    try {
        // Check server
        const serverRunning = await checkServerStatus();
        if (!serverRunning) {
            throw new Error(
                'Backend server is not running!\n\n' +
                'Please start the server:\n' +
                '1. Run: start_instruments_server.bat\n' +
                '2. Wait for "Server running on http://localhost:5001"\n' +
                '3. Then try again'
            );
        }

        // Prepare form data
        const formData = new FormData();
        formData.append('audio', audioFile);

        // Add gains
        const finalGains = {
            drums: 1.0,
            bass: 1.0,
            vocals: 1.0,
            guitar: 1.0,
            piano: 1.0,
            other: 1.0,
            ...gains
        };

        Object.entries(finalGains).forEach(([key, value]) => {
            formData.append(key, value.toString());
        });

        if (sessionId) {
            formData.append('session_id', sessionId);
        }

        console.log('🎵 Starting instrument separation...');
        console.log('File:', audioFile.name);
        console.log('Gains:', finalGains);

        if (onProgress) {
            onProgress({ stage: 'uploading', progress: 0.05, message: 'Uploading audio file...' });
        }

        // Send request
        const response = await fetch(`${SERVER_URL}/api/separate`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Server error');
        }

        if (onProgress) {
            onProgress({ stage: 'complete', progress: 1.0, message: 'Processing complete!' });
        }

        const result = await response.json();
        console.log('✅ Separation complete:', result);

        // Convert file paths to server URLs
        result.mixed_audio_url = `${SERVER_URL}/api/download/${encodeURIComponent(result.mixed_audio_file)}`;
        result.spectrogram_url = `${SERVER_URL}/api/download/${encodeURIComponent(result.spectrogram_image)}`;

        if (result.separated_stems_full) {
            result.stem_urls_full = {};
            Object.entries(result.separated_stems_full).forEach(([stem, path]) => {
                result.stem_urls_full[stem] = `${SERVER_URL}/api/download/${encodeURIComponent(path)}`;
            });
        }

        if (result.separated_stems_trimmed) {
            result.stem_urls_trimmed = {};
            Object.entries(result.separated_stems_trimmed).forEach(([stem, path]) => {
                result.stem_urls_trimmed[stem] = `${SERVER_URL}/api/download/${encodeURIComponent(path)}`;
            });
        }

        return result;

    } catch (error) {
        console.error('❌ Error separating instruments:', error);
        throw error;
    }
}

/**
 * Get processing status for a session
 * @param {string} sessionId
 * @returns {Promise<Object>}
 */
export async function getProcessingStatus(sessionId) {
    const response = await fetch(`${SERVER_URL}/status/${sessionId}`);
    return await response.json();
}

// ============================================================================
// AUDIO PROCESSING
// ============================================================================

/**
 * Load audio file from backend
 * @param {File} audioFile
 * @param {number} maxSamples - Maximum samples to return
 * @returns {Promise<Object>}
 */
export async function loadAudioFile(audioFile, maxSamples = 1000000) {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('max_samples', maxSamples.toString());

    const response = await fetch(`${SERVER_URL}/api/audio/load`, {
        method: 'POST',
        body: formData
    });

    return await response.json();
}

/**
 * Apply filter to audio
 * @param {Array} audio - Audio samples
 * @param {number} sampleRate
 * @param {string} filterType - 'lowpass', 'highpass', 'bandpass', 'bandstop'
 * @param {number|Array} cutoff - Cutoff frequency(ies)
 * @param {number} order - Filter order
 * @returns {Promise<Object>}
 */
export async function applyFilter(audio, sampleRate, filterType, cutoff, order = 5) {
    const response = await fetch(`${SERVER_URL}/api/audio/filter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            audio,
            sample_rate: sampleRate,
            filter_type: filterType,
            cutoff,
            order
        })
    });

    return await response.json();
}

/**
 * Apply parametric equalizer
 * @param {Array} audio - Audio samples
 * @param {number} sampleRate
 * @param {Array} bands - Array of {freq, gain, q} objects
 * @returns {Promise<Object>}
 */
export async function applyEqualizer(audio, sampleRate, bands) {
    const response = await fetch(`${SERVER_URL}/api/audio/equalizer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            audio,
            sample_rate: sampleRate,
            bands
        })
    });

    return await response.json();
}

/**
 * Mix multiple audio tracks
 * @param {Array} tracks - Array of {audio, gain} objects
 * @param {boolean} normalize - Whether to normalize output
 * @returns {Promise<Object>}
 */
export async function mixAudioTracks(tracks, normalize = true) {
    const response = await fetch(`${SERVER_URL}/api/audio/mix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            tracks,
            normalize
        })
    });

    return await response.json();
}

// ============================================================================
// FILE MANAGEMENT
// ============================================================================

/**
 * Download a file from server
 * @param {string} fileUrl - URL to the file
 * @param {string} filename - Name for downloaded file
 */
export async function downloadFile(fileUrl, filename) {
    try {
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading file:', error);
        throw new Error('Failed to download file');
    }
}

/**
 * Clean up output files
 * @param {string} outputDir - Optional specific directory to clean
 */
export async function cleanupOutputs(outputDir = null) {
    try {
        const body = outputDir ? JSON.stringify({ output_dir: outputDir }) : {};

        await fetch(`${SERVER_URL}/api/cleanup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body
        });
    } catch (error) {
        console.error('Error cleaning up outputs:', error);
    }
}

/**
 * List all output files
 * @returns {Promise<Object>}
 */
export async function listOutputFiles() {
    const response = await fetch(`${SERVER_URL}/api/files/list`);
    return await response.json();
}

/**
 * Convert audio file format
 * @param {File} audioFile
 * @param {string} outputFormat - 'wav', 'mp3', 'flac', etc.
 * @param {Object} options - {sampleRate, bitDepth}
 * @returns {Promise<Blob>}
 */
export async function convertAudioFormat(audioFile, outputFormat, options = {}) {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('output_format', outputFormat);

    if (options.sampleRate) {
        formData.append('sample_rate', options.sampleRate.toString());
    }
    if (options.bitDepth) {
        formData.append('bit_depth', options.bitDepth.toString());
    }

    const response = await fetch(`${SERVER_URL}/api/audio/convert`, {
        method: 'POST',
        body: formData
    });

    return await response.blob();
}

// ============================================================================
// PRESETS & CONSTANTS (from old service)
// ============================================================================

export const GAIN_PRESETS = {
    original: {
        name: 'Original Mix',
        description: 'All instruments at original levels',
        gains: {
            drums: 1.0,
            bass: 1.0,
            vocals: 1.0,
            guitar: 1.0,
            piano: 1.0,
            other: 1.0,
        },
    },
    vocalBoost: {
        name: 'Vocal Boost',
        description: 'Emphasize vocals, reduce instruments',
        gains: {
            drums: 0.7,
            bass: 0.6,
            vocals: 2.0,
            guitar: 0.7,
            piano: 0.8,
            other: 0.5,
        },
    },
    instrumental: {
        name: 'Instrumental',
        description: 'Remove vocals completely',
        gains: {
            drums: 1.2,
            bass: 1.2,
            vocals: 0.0,
            guitar: 1.2,
            piano: 1.2,
            other: 1.0,
        },
    },
    karaoke: {
        name: 'Karaoke',
        description: 'Reduce vocals for singing along',
        gains: {
            drums: 1.0,
            bass: 1.0,
            vocals: 0.3,
            guitar: 1.0,
            piano: 1.0,
            other: 1.0,
        },
    },
    bassBoost: {
        name: 'Bass Boost',
        description: 'Emphasize bass and drums',
        gains: {
            drums: 1.5,
            bass: 2.0,
            vocals: 0.8,
            guitar: 0.8,
            piano: 0.7,
            other: 0.7,
        },
    },
    acoustic: {
        name: 'Acoustic',
        description: 'Focus on acoustic instruments',
        gains: {
            drums: 0.5,
            bass: 0.6,
            vocals: 1.2,
            guitar: 1.5,
            piano: 1.5,
            other: 0.8,
        },
    },
};

export const STEMS = [
    { id: 'drums', name: 'Drums', icon: '🥁', color: '#FF6B6B' },
    { id: 'bass', name: 'Bass', icon: '🎸', color: '#4ECDC4' },
    { id: 'vocals', name: 'Vocals', icon: '🎤', color: '#45B7D1' },
    { id: 'guitar', name: 'Guitar', icon: '🎸', color: '#FFA07A' },
    { id: 'piano', name: 'Piano', icon: '🎹', color: '#98D8C8' },
    { id: 'other', name: 'Other', icon: '🎵', color: '#A8E6CF' },
];

export function validateAudioFile(file) {
    const maxSize = 200 * 1024 * 1024; // 200MB
    const validTypes = [
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave',
        'audio/x-wav', 'audio/flac', 'audio/ogg', 'audio/aac', 'audio/m4a'
    ];

    if (!file) {
        return { valid: false, error: 'No file provided' };
    }

    if (file.size > maxSize) {
        return { valid: false, error: 'File size exceeds 200MB limit' };
    }

    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|flac|ogg|aac|m4a|wma)$/i)) {
        return { valid: false, error: 'Invalid file type' };
    }

    return { valid: true, error: null };
}

export function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
