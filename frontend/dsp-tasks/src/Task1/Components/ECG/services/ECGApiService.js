// ECG API Service for handling all ECG-related API calls
const API_BASE_URL = 'http://localhost:8000'; // Update with your actual API URL

class ECGApiService {
  /**
   * Upload ECG header and data files with optional annotation file
   * @param {File} headerFile - .hea file
   * @param {File} dataFile - .dat file
   * @param {File} atrFile - .atr file (optional)
   * @returns {Promise} - Upload response with session_id and metadata
   */
  static async uploadECGFiles(headerFile, dataFile, atrFile = null) {
    try {
      const formData = new FormData();
      formData.append('header_file', headerFile);
      formData.append('data_file', dataFile);
      
      // Add annotation file if provided
      if (atrFile) {
        formData.append('annotation_file', atrFile);
      }

      const response = await fetch(`${API_BASE_URL}/upload-ecg`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading ECG files:', error);
      throw error;
    }
  }

  /**
   * Control ECG playback (play, pause, stop, seek)
   * @param {string} sessionId - Session ID
   * @param {string} action - Action: 'play', 'pause', 'stop', 'seek'
   * @param {number} position - Position for seek action (optional)
   * @param {Array} leads - Visible leads array (optional)
   * @returns {Promise} - Control response
   */
  static async controlPlayback(sessionId, action, position = null, leads = null) {
    try {
      const params = new URLSearchParams();
      params.append('action', action);
      if (position !== null) params.append('position', position.toString());

      const response = await fetch(`${API_BASE_URL}/control/${sessionId}?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leads)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error controlling playback:', error);
      throw error;
    }
  }

  /**
   * Toggle visibility of a specific lead
   * @param {string} leadName - Lead name to toggle
   * @returns {Promise} - Toggle response
   */
  static async toggleLead(leadName) {
    try {
      const response = await fetch(`${API_BASE_URL}/leads/${leadName}/toggle`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error toggling lead:', error);
      throw error;
    }
  }

  /**
   * Get current session status
   * @returns {Promise} - Session status
   */
  static async getSessionStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/session-status`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching session status:', error);
      throw error;
    }
  }

  /**
   * Get classification status
   * @returns {Promise} - Classification status
   */
  static async getClassificationStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/classification-status`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching classification status:', error);
      throw error;
    }
  }

  /**
   * Get classification results
   * @returns {Promise} - Classification results
   */
  static async getClassification() {
    try {
      const response = await fetch(`${API_BASE_URL}/classification`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching classification:', error);
      throw error;
    }
  }

  /**
   * Get root endpoint info
   * @returns {Promise} - Root endpoint response
   */
  static async getRootInfo() {
    try {
      const response = await fetch(`${API_BASE_URL}/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching root info:', error);
      throw error;
    }
  }

  /**
   * Health check endpoint
   * @returns {Promise} - Health status
   */
  static async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in health check:', error);
      throw error;
    }
  }
}

export default ECGApiService;