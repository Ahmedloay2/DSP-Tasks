/**
 * EEG Classification Service
 * Fetches EEG classification/detection results from the backend API
 * Analyzes brain wave patterns and mental states
 */

const API_BASE_URL = 'https://semilunate-marcene-nonsustainable.ngrok-free.dev';

class EEGClassificationService {
  /**
   * Fetch EEG classification for a given record
   * @param {string} recordName - Name of the EEG record to classify
   * @returns {Promise<Object>} Classification results
   */
  static async fetchClassification(recordName = 'example') {
    try {
      const url = `${API_BASE_URL}/eeg_classification?name=${encodeURIComponent(recordName)}`;
      console.log('Fetching EEG classification from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true' 
        },
      });

      // Check if the response is okay (status in 200-299 range)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the Content-Type of the response
      const contentType = response.headers.get('content-type');
      
      // Check if the response is actually JSON before parsing
      if (!contentType || !contentType.includes('application/json')) {
        // If it's not JSON, get the response as text to see what it is
        const responseText = await response.text();
        console.error('Expected JSON but got:', contentType);
        console.error('Response text start:', responseText.substring(0, 200)); // Log first 200 chars
        
        throw new Error(`Server returned ${contentType || 'unknown type'} instead of JSON. The endpoint may be misconfigured.`);
      }

      // If we get here, it's safe to parse as JSON
      const jsonData = await response.json();
      console.log('Received EEG JSON data:', jsonData);

      return {
        success: true,
        data: jsonData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching EEG classification:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Parse classification string into structured data
   * @param {Object} classificationData - Raw classification data from API
   * @returns {Object} Parsed classification data
   */
  static parseClassificationString(classificationData) {
    console.log('Parsing EEG classification data:', classificationData);
    
    if (!classificationData) {
      return {
        mentalState: 'Unknown',
        confidence: 0,
        dominantBand: 'Unknown',
        isNormal: false,
        rawText: 'No data received'
      };
    }

    // Access properties from the object
    // Adapt based on actual API response format
    const mentalState = classificationData.predicted_state || 
                       classificationData.mental_state || 
                       'Unknown';
    const confidenceStr = classificationData.confidence || 
                         classificationData.confidience || // Handle typo
                         '0%';
    const confidence = parseFloat(confidenceStr) || 0;
    const dominantBand = classificationData.dominant_band || 'Unknown';

    // Determine if normal based on mental state
    const isNormal = mentalState.toLowerCase().includes('normal') || 
                    mentalState.toLowerCase().includes('relaxed') ||
                    mentalState.toLowerCase().includes('alert');
    
    // Brain wave pattern analysis
    const frequencyBands = classificationData.frequency_bands || {};
    
    return {
      mentalState,
      confidence,
      dominantBand,
      isNormal,
      frequencyBands,
      rawText: JSON.stringify(classificationData),
      displayText: `Mental State: ${mentalState} (Confidence: ${confidence}%)`,
      bandAnalysis: this.analyzeBands(frequencyBands)
    };
  }

  /**
   * Analyze frequency bands power
   * @param {Object} bands - Frequency bands power data
   * @returns {Object} Analysis results
   */
  static analyzeBands(bands) {
    const analysis = {
      delta: bands.delta || 0,
      theta: bands.theta || 0,
      alpha: bands.alpha || 0,
      beta: bands.beta || 0,
      gamma: bands.gamma || 0
    };

    // Find dominant band
    const maxPower = Math.max(...Object.values(analysis));
    const dominantBand = Object.keys(analysis).find(
      band => analysis[band] === maxPower
    );

    return {
      ...analysis,
      dominantBand,
      interpretation: this.interpretBand(dominantBand)
    };
  }

  /**
   * Interpret dominant frequency band
   * @param {string} band - Frequency band name
   * @returns {string} Interpretation
   */
  static interpretBand(band) {
    const interpretations = {
      delta: 'Deep sleep or unconscious state',
      theta: 'Light sleep, drowsiness, or meditation',
      alpha: 'Relaxed awareness, eyes closed',
      beta: 'Active thinking, focus, or anxiety',
      gamma: 'High-level cognitive processing'
    };

    return interpretations[band] || 'Unknown state';
  }

  /**
   * Detect potential artifacts in EEG data
   * @param {Object} channelData - Channel data to analyze
   * @returns {Array} Detected artifacts
   */
  static detectArtifacts(channelData) {
    const artifacts = [];
    
    // This is a simplified version
    // Real implementation would use more sophisticated algorithms
    
    Object.keys(channelData).forEach(channel => {
      const data = channelData[channel];
      const stats = this.calculateStats(data);
      
      // Check for extreme values (possible muscle artifacts)
      if (stats.std > 100) { // Threshold in microvolts
        artifacts.push({
          type: 'Muscle Artifact',
          channel,
          severity: 'High'
        });
      }
      
      // Check for low frequency drift (possible motion artifact)
      if (stats.mean > 50 || stats.mean < -50) {
        artifacts.push({
          type: 'Motion Artifact',
          channel,
          severity: 'Medium'
        });
      }
    });
    
    return artifacts;
  }

  /**
   * Calculate basic statistics
   * @param {Array<number>} data - Data array
   * @returns {Object} Statistics
   */
  static calculateStats(data) {
    if (!data || data.length === 0) {
      return { min: 0, max: 0, mean: 0, std: 0 };
    }

    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const std = Math.sqrt(variance);
    
    return {
      min: Math.min(...data),
      max: Math.max(...data),
      mean,
      std
    };
  }
}

export default EEGClassificationService;
