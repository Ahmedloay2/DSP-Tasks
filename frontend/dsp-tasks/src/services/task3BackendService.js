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
