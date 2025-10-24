/**
 * Speech Service - Mock Implementation
 * Provides mock data for testing and demonstration
 */

/**
 * Mock gender recognition
 * @returns {Promise<Object>} Mock gender recognition result with just gender
 */
export const recognizeGender = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate mock result - simplified to match real API
    const isMale = Math.random() > 0.5;
    
    return {
        gender: isMale ? 'male' : 'female'
    };
};

/**
 * Mock audio resampling
 * @param {File} audioFile - The audio file to resample
 * @param {number} samplingFreq - Target sampling frequency in Hz
 * @returns {Promise<Object>} Mock resampled audio data
 */
export const resampleAudio = async (audioFile, samplingFreq) => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In mock mode, return the original file with new metadata
    const url = URL.createObjectURL(audioFile);
    
    return {
        url,
        frequency: samplingFreq,
        file: audioFile,
        isMock: true
    };
};

/**
 * Mock anti-aliasing
 * @param {File} audioFile - The audio file to process
 * @param {number} frequency - The sampling frequency
 * @returns {Promise<Object>} Mock anti-aliased audio data
 */
export const applyAntiAliasing = async (audioFile, frequency) => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In mock mode, return the original file with new metadata
    const url = URL.createObjectURL(audioFile);
    
    return {
        url,
        frequency,
        file: audioFile,
        isMock: true
    };
};
