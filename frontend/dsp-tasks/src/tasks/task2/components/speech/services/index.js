/**
 * Speech Service Selector
 * Exports the appropriate service based on mode
 */

import * as realService from './speechService';
import * as mockService from './speechServiceMock';

/**
 * Get the appropriate service based on API mode
 * @param {string} mode - 'real' or 'mock'
 * @returns {Object} Service implementation
 */
export const getSpeechService = (mode) => {
    return mode === 'real' ? realService : mockService;
};

// Default export for convenience
export default getSpeechService;
