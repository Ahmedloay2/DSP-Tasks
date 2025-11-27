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
 * Adjust gains for already separated instruments without re-separating
 * @param {string} sessionDir - Session directory name
 * @param {Object} gains - New gain settings {stemName: gainValue}
 * @returns {Promise<Object>}
 */
export async function adjustInstrumentGains(sessionDir, gains) {
    try {
        const response = await fetch(`${SERVER_URL}/api/instruments/adjust-gains`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_dir: sessionDir,
                gains: gains
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to adjust instrument gains');
        }

        const result = await response.json();
        console.log('✅ Instrument gains adjusted:', result);

        // Convert file path to URL with timestamp for cache busting
        if (result.mixed_file) {
            result.mixed_audio_url = `${SERVER_URL}/api/download/${encodeURIComponent(result.mixed_file)}`;
        }

        return result;

    } catch (error) {
        console.error('❌ Error adjusting instrument gains:', error);
        throw error;
    }
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

// ============================================================================
// PRESETS & CONSTANTS
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

// ============================================================================
// VOICE SEPARATION
// ============================================================================

/**
 * Separate audio into individual human voices with AI
 * @param {File} audioFile - Audio file
 * @param {Object} gains - Gain settings for each voice source (optional)
 * @param {Function} onProgress - Progress callback
 * @param {string} sessionId - Optional session ID
 * @returns {Promise<Object>}
 */
export async function separateVoices(audioFile, gains = {}, onProgress = null, sessionId = null) {
    try {
        // Check server
        const serverRunning = await checkServerStatus();
        if (!serverRunning) {
            throw new Error(
                'Backend server is not running!\n\n' +
                'Please start the server:\n' +
                '1. Open terminal in project root\n' +
                '2. Run: python task3_backend_server.py'
            );
        }

        const formData = new FormData();
        formData.append('audio', audioFile);

        // Add gains if provided
        Object.entries(gains).forEach(([sourceId, gainValue]) => {
            formData.append(`source_${sourceId}`, gainValue.toString());
        });

        // Add session ID
        if (sessionId) {
            formData.append('session_id', sessionId);
        } else {
            sessionId = Date.now().toString();
            formData.append('session_id', sessionId);
        }

        console.log('🎤 Separating voices with AI...');

        // Start separation
        const response = await fetch(`${SERVER_URL}/api/separate-voices`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Voice separation failed');
        }

        // Get the result first
        const result = await response.json();
        console.log('✅ Voice separation complete:', result);

        // Poll for status updates (for progress display)
        if (onProgress) {
            onProgress({ stage: 'complete', progress: 1.0, message: 'Voice separation complete!' });
        }

        // Convert file paths to server URLs
        if (result.mixed_file) {
            result.mixed_audio_url = `${SERVER_URL}/api/download/${encodeURIComponent(result.mixed_file)}`;
        }

        if (result.sources && Array.isArray(result.sources)) {
            result.source_urls = result.sources.map(source => ({
                ...source,
                url: `${SERVER_URL}/api/download/${encodeURIComponent(source.file)}`
            }));
        }

        return result;

    } catch (error) {
        console.error('❌ Error separating voices:', error);
        throw error;
    }
}

/**
 * Adjust gains for already separated voices without re-separating
 * @param {string} sessionDir - Session directory name
 * @param {Object} gains - New gain settings {sourceIndex: gainValue}
 * @returns {Promise<Object>}
 */
export async function adjustVoiceGains(sessionDir, gains) {
    try {
        const response = await fetch(`${SERVER_URL}/api/voices/adjust-gains`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_dir: sessionDir,
                gains: gains
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to adjust voice gains');
        }

        const result = await response.json();
        console.log('✅ Voice gains adjusted:', result);

        // Convert file path to URL
        if (result.mixed_file) {
            result.mixed_audio_url = `${SERVER_URL}/api/download/${encodeURIComponent(result.mixed_file)}`;
        }

        return result;

    } catch (error) {
        console.error('❌ Error adjusting voice gains:', error);
        throw error;
    }
}

/**
 * Get voice separation model information
 * @returns {Promise<Object>}
 */
export async function getVoiceInfo() {
    try {
        const response = await fetch(`${SERVER_URL}/api/voices/info`);
        if (!response.ok) {
            throw new Error('Failed to get voice info');
        }
        return await response.json();
    } catch (error) {
        console.error('❌ Error getting voice info:', error);
        throw error;
    }
}
