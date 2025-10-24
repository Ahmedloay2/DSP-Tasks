/**
 * Task 2 Home Page Data Configuration
 * 
 * Defines the available signal processing tasks and their metadata.
 * This data drives the home page cards and navigation structure.
 * 
 * Task 2 Focus: Sampling, Aliasing, and Anti-Aliasing
 * This task demonstrates the effects of different sampling frequencies on signal quality,
 * exploring concepts like the Nyquist theorem, aliasing artifacts, and anti-aliasing techniques.
 */

export const Task2HomeData = [
    {
        title: 'ECG',
        description: 'Signal viewer and analyser for ECG (Electrocardiogram) signals with sampling frequency control to demonstrate aliasing and anti-aliasing effects',
        image: 'path/to/image.jpg', // TODO: Add actual ECG preview image
        features: [
            'Real-time ECG monitoring',
            'Multi-lead visualization',
            'Sampling frequency adjustment (50Hz - 1000Hz)',
            'Aliasing demonstration',
            'Heart rate analysis'
        ],
        path: 'ecg'
    },
    {
        title: 'EEG',
        description: 'Signal viewer and analyser for EEG (Electroencephalogram) signals with sampling frequency control to demonstrate aliasing and anti-aliasing effects',
        image: 'path/to/image.jpg', // TODO: Add actual EEG preview image
        features: [
            'Real-time EEG monitoring',
            'Brain wave analysis',
            'Multi-channel visualization',
            'Sampling frequency adjustment (50Hz - 1000Hz)',
            'Aliasing demonstration',
            'Frequency domain analysis'
        ],
        path: 'eeg'
    },
    {
        title: 'Speech Recognition',
        description: 'Speech signal processing with focus on aliasing and anti-aliasing techniques for audio signals',
        image: 'path/to/image.jpg', // TODO: Add actual Speech preview image
        features: [
            'Audio signal upload and playback',
            'Gender recognition (Male/Female)',
            'Real-time speech waveform visualization',
            'Sampling frequency manipulation (1kHz - 48kHz)',
            'Aliasing effect demonstration in audio',
            'Anti-aliasing filter application',
            'Speech quality comparison at different sampling rates'
        ],
        path: 'speech'
    },
    {
        title: 'Doppler Shift',
        description: 'Signal viewer and analyser for Doppler Shift signals',
        image: 'path/to/image.jpg', // TODO: Add actual Doppler preview image
        features: [
            'Audio signal generation',
            'Frequency shift analysis',
            'Interactive parameter control',
            'Real-time visualization',
            'Audio playback capabilities'
        ],
        path: 'dopplershift'
    },
    {
        title: 'SAR Image Analysis',
        description: 'Synthetic Aperture Radar (SAR) signal analysis for land cover classification',
        image: 'path/to/image.jpg', // TODO: Add actual SAR preview image
        features: [
            'SAR image upload and visualization',
            'Automated land-water classification',
            'Earth/water coverage percentage estimation',
            'Real-time image analysis',
            'Backscatter-based surface detection'
        ],
        path: 'sar'
    }
];

/**
 * Get task data by path
 * @param {string} path - The task path to search for
 * @returns {Object|undefined} The task data object or undefined if not found
 */
export const getTaskByPath = (path) => {
    return Task2HomeData.find(task => task.path === path);
};

/**
 * Get all available task paths
 * @returns {string[]} Array of all task paths
 */
export const getAllTaskPaths = () => {
    return Task2HomeData.map(task => task.path);
};

export default Task2HomeData;
