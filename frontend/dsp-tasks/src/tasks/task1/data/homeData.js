

/**
 * Available signal processing tasks configuration
 * 
 * Each task object contains:
 * - title: Display name for the task
 * - description: Brief explanation of what the task does
 * - image: Placeholder for future task preview images
 * - features: Array of key capabilities/features
 * - path: Route path for navigation (used with /task1/ prefix)
 * 
 * To add a new task:
 * 1. Add a new object to this array
 * 2. Create the corresponding component in src/tasks/task1/components/
 * 3. Update routing in your router configuration
 */
export const Task1HomeData = [
    {
        title: 'ECG',
        description: 'Signal viewer and analyser for ECG (Electrocardiogram) signals',
        image: 'path/to/image.jpg', // TODO: Add actual ECG preview image
        features: [
            'Real-time ECG monitoring',
            'Multi-lead visualization',
            'Heart rate analysis',
            'Abnormality detection',
            'Data visualization'
        ],
        path: 'ecg'
    },
    {
        title: 'EEG',
        description: 'Signal viewer and analyser for EEG (Electroencephalogram) signals',
        image: 'path/to/image.jpg', // TODO: Add actual EEG preview image
        features: [
            'Real-time EEG monitoring',
            'Brain wave analysis',
            'Multi-channel visualization',
            'Frequency domain analysis',
            'Data visualization'
        ],
        path: 'eeg'
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
    return Task1HomeData.find(task => task.path === path);
};

/**
 * Get all available task paths
 * @returns {string[]} Array of all task paths
 */
export const getAllTaskPaths = () => {
    return Task1HomeData.map(task => task.path);
};

export default Task1HomeData;