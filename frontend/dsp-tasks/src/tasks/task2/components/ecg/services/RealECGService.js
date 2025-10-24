/**
 * Real ECG Service - Consolidated
 * 
 * Handles ECG-related API operations:
 * - ECG Data fetching and parsing (12-channel)
 * - ECG Classification
 * - Resampling
 * - Polar coordinates conversion
 * - Statistics calculations
 */

const API_BASE_URL = 'https://semilunate-marcene-nonsustainable.ngrok-free.dev';

class RealECGService {
  // ==================== ECG DATA FETCHING ====================
  
  /**
   * Fetch ECG data from the real API with optional sampling frequency
   * @param {string} name - Name parameter for the API (e.g., 'example')
   * @param {number} samplingFrequency - Desired sampling frequency (default: 500Hz)
   * @returns {Promise<Object>} Parsed ECG data with 12 channels
   */
  static async fetchECGData(name = 'example', samplingFrequency = 500) {
    try {
      const url = `${API_BASE_URL}/ecg_data?name=${name}&desired_sampling_freq=${samplingFrequency}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const rawData = await response.json();
      return this.parseECGData(rawData, samplingFrequency);
    } catch (error) {
      console.error('Failed to fetch ECG data:', error);
      throw error;
    }
  }

  /**
   * Resample ECG data to a new sampling frequency
   * @param {string} name - Record name
   * @param {number} newSamplingFrequency - Target sampling frequency
   * @returns {Promise<Object>} Resampled ECG data
   */
  static async resampleECGData(name, newSamplingFrequency) {
    try {
      console.log(`🔄 Resampling ECG data to ${newSamplingFrequency}Hz via API`);
      const resampledData = await this.fetchECGData(name, newSamplingFrequency);
      
      return {
        success: true,
        message: `Successfully resampled to ${newSamplingFrequency}Hz`,
        samplingFrequency: newSamplingFrequency,
        data: resampledData
      };
    } catch (error) {
      console.error('Failed to resample ECG data:', error);
      throw error;
    }
  }

  /**
   * Parse raw API response into structured 12-channel data
   * @param {Array} rawData - Array of samples, each containing 12 values
   * @param {number} samplingFrequency - Sampling frequency of the data
   * @returns {Object} Structured data with channels, metadata, etc.
   */
  static parseECGData(rawData, samplingFrequency = 500) {
    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new Error('Invalid data format: expected non-empty array');
    }

    const firstSample = rawData[0];
    if (!Array.isArray(firstSample) || firstSample.length !== 12) {
      throw new Error(`Invalid sample format: expected 12 channels, got ${firstSample?.length || 0}`);
    }

    const sampleCount = rawData.length;
    
    // Initialize 12 channels
    const channels = {
      ch1: [], ch2: [], ch3: [], ch4: [],
      ch5: [], ch6: [], ch7: [], ch8: [],
      ch9: [], ch10: [], ch11: [], ch12: []
    };

    // Distribute data into channels
    rawData.forEach(sample => {
      channels.ch1.push(sample[0]);
      channels.ch2.push(sample[1]);
      channels.ch3.push(sample[2]);
      channels.ch4.push(sample[3]);
      channels.ch5.push(sample[4]);
      channels.ch6.push(sample[5]);
      channels.ch7.push(sample[6]);
      channels.ch8.push(sample[7]);
      channels.ch9.push(sample[8]);
      channels.ch10.push(sample[9]);
      channels.ch11.push(sample[10]);
      channels.ch12.push(sample[11]);
    });

    // Calculate metadata
    const samplingRate = samplingFrequency;
    const duration = sampleCount / samplingRate;

    // Calculate statistics for each channel
    const channelStats = {};
    Object.keys(channels).forEach(channelName => {
      const data = channels[channelName];
      channelStats[channelName] = this.calculateChannelStats(data);
    });

    return {
      channels,
      metadata: {
        sampleCount,
        samplingRate,
        duration,
        channelCount: 12,
        channelNames: Object.keys(channels),
        totalDataPoints: sampleCount * 12
      },
      stats: channelStats,
      rawData
    };
  }

  // ==================== ECG CLASSIFICATION ====================

  /**
   * Fetch ECG classification for a given record
   * @param {string} recordName - Name of the ECG record to classify
   * @param {number} samplingFrequency - Desired sampling frequency (default: 500Hz)
   * @returns {Promise<Object>} Classification results
   */
  static async fetchClassification(recordName = 'example', samplingFrequency = 500) {
    try {
      const url = `${API_BASE_URL}/ecg_classification?name=${encodeURIComponent(recordName)}&desired_sampling_freq=${samplingFrequency}`;
      console.log('Fetching classification from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true' 
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Expected JSON but got:', contentType);
        console.error('Response text start:', responseText.substring(0, 200));
        
        throw new Error(`Server returned ${contentType || 'unknown type'} instead of JSON`);
      }

      const jsonData = await response.json();
      console.log('Received JSON data:', jsonData);

      return {
        success: true,
        data: jsonData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching ECG classification:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Parse classification data into structured format
   * @param {Object} classificationData - Raw classification data from API
   * @returns {Object} Parsed classification data
   */
  static parseClassificationString(classificationData) {
    console.log('Parsing classification data:', classificationData);
    
    if (!classificationData) {
      return {
        className: 'Unknown',
        confidence: 0,
        isNormal: false,
        rawText: 'No data received'
      };
    }

    const className = classificationData.predicted_class || 'Unknown';
    const confidenceStr = classificationData.confidience || '0%'; // Note API typo
    const confidence = parseFloat(confidenceStr) || 0;

    const isNormal = className.toLowerCase().includes('normal') || 
                    className.toLowerCase().includes('healthy');
    
    return {
      className,
      confidence,
      isNormal,
      rawText: JSON.stringify(classificationData),
      displayText: `Predicted class: ${className} (Confidence: ${confidence}%)`
    };
  }

  // ==================== STATISTICS & UTILITIES ====================

  /**
   * Calculate statistics for a channel
   * @param {Array<number>} data - Channel data
   * @returns {Object} Statistics
   */
  static calculateChannelStats(data) {
    if (!data || data.length === 0) {
      return { min: 0, max: 0, mean: 0, std: 0, range: 0 };
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const std = Math.sqrt(variance);
    
    return { min, max, mean, std, range: max - min };
  }

  // ==================== POLAR COORDINATES ====================

  /**
   * Convert time-series data to polar coordinates
   * @param {Array<number>} data - Channel data
   * @param {number} startIndex - Start index
   * @param {number} count - Number of samples
   * @returns {Array<{r: number, theta: number, x: number, y: number}>} Polar coordinates
   */
  static toPolarCoordinates(data, startIndex = 0, count = null) {
    const dataSlice = count ? data.slice(startIndex, startIndex + count) : data.slice(startIndex);
    const stats = this.calculateChannelStats(dataSlice);
    
    return dataSlice.map((amplitude, index) => {
      const r = stats.range === 0 ? 0.5 : (amplitude - stats.min) / stats.range;
      const theta = (index / dataSlice.length) * 2 * Math.PI;
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      
      return { r, theta, x, y, amplitude, time: index };
    });
  }
}

export default RealECGService;
