/**
 * Speech Service - Real API Implementation
 * Handles all API calls for speech processing
 */

const API_BASE_URL = 'https://semilunate-marcene-nonsustainable.ngrok-free.dev';

/**
 * Recognize gender from audio file
 * @param {File} audioFile - The audio file to analyze
 * @returns {Promise<Object>} Gender recognition result with just gender string
 */
export const recognizeGender = async (audioFile) => {
    const formData = new FormData();
    formData.append('wav_file', audioFile);

    const response = await fetch(`${API_BASE_URL}/gender-classification`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Gender classification error:', errorText);
        throw new Error(`Gender recognition failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Return simple object with just gender
    return {
        gender: data.gender || data
    };
};

/**
 * Resample audio with specified sampling frequency
 * @param {File} audioFile - The audio file to resample
 * @param {number} samplingFreq - Target sampling frequency in Hz
 * @returns {Promise<Object>} Resampled audio data with URL
 */
export const resampleAudio = async (audioFile, samplingFreq) => {
    const formData = new FormData();
    formData.append('wav_file', audioFile); 

    const response = await fetch(`${API_BASE_URL}/alias-speech?sampling_freq=${samplingFreq}`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Resampling error:', errorText);
        throw new Error(`Resampling failed: ${response.status}`);
    }

    // Response is the resampled WAV audio file
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    
    return {
        url,
        frequency: samplingFreq,
        file: new File([blob], `resampled_${samplingFreq}Hz.wav`, { type: 'audio/wav' })
    };
};

/**
 * Apply anti-aliasing filter to audio
 * @param {File} audioFile - The audio file to process
 * @param {number} frequency - The sampling frequency (for metadata only)
 * @returns {Promise<Object>} Anti-aliased audio data
 */
export const applyAntiAliasing = async (audioFile, frequency) => {
    const formData = new FormData();
    formData.append('wav_file', audioFile);
    // Note: API only expects wav_file, not frequency

    const response = await fetch(`${API_BASE_URL}/anti-alias`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Anti-aliasing error:', errorText);
        throw new Error(`Anti-aliasing failed: ${response.status}`);
    }

    // Response is the anti-aliased WAV audio file
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    
    return {
        url,
        frequency,
        file: new File([blob], `antialiased_${frequency}Hz.wav`, { type: 'audio/wav' })
    };
};
