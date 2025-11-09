/**
 * Real ECG Data Service
 * Fetches 12-channel ECG data from the real API endpoint
 * No mock data - pure API integration
 */

const API_BASE_URL = 'https://semilunate-marcene-nonsustainable.ngrok-free.dev';

class RealECGDataService {
  /**
   * Fetch ECG data from the real API
   * @param {string} name - Name parameter for the API (e.g., 'example')
   * @returns {Promise<Object>} Parsed ECG data with 12 channels
   */
  static async fetchECGData(name = 'example') {
    try {
      const response = await fetch(`${API_BASE_URL}/ecg_data?name=${name}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true' // Skip ngrok warning page
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const rawData = await response.json();
      
      // Parse the 12-channel data structure
      return this.parseECGData(rawData);
    } catch (error) {
      console.error('Failed to fetch ECG data:', error);
      throw error;
    }
  }

  /**
   * Parse raw API response into structured 12-channel data
   * @param {Array} rawData - Array of samples, each containing 12 values
   * @returns {Object} Structured data with channels, metadata, etc.
   */
  static parseECGData(rawData) {
    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new Error('Invalid data format: expected non-empty array');
    }

    // Validate first sample has 12 channels
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
    const samplingRate = 500; // Assuming 500 Hz (can be adjusted if API provides this)
    const duration = sampleCount / samplingRate; // in seconds

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
      rawData // Keep raw data for reference
    };
  }

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
    
    return {
      min,
      max,
      mean,
      std,
      range: max - min
    };
  }

  /**
   * Get time axis for the data
   * @param {number} sampleCount - Number of samples
   * @param {number} samplingRate - Sampling rate in Hz
   * @returns {Array<number>} Time values in seconds
   */
  static getTimeAxis(sampleCount, samplingRate = 500) {
    const timeStep = 1 / samplingRate;
    return Array.from({ length: sampleCount }, (_, i) => i * timeStep);
  }

  /**
   * Extract a time window from channel data
   * @param {Array<number>} channelData - Full channel data
   * @param {number} startTime - Start time in seconds
   * @param {number} duration - Window duration in seconds
   * @param {number} samplingRate - Sampling rate in Hz
   * @returns {Array<number>} Window data
   */
  static extractTimeWindow(channelData, startTime, duration, samplingRate = 250) {
    const startIndex = Math.floor(startTime * samplingRate);
    const endIndex = Math.floor((startTime + duration) * samplingRate);
    return channelData.slice(startIndex, endIndex);
  }

  /**
   * Compute XOR visualization for a time chunk
   * XOR logic: overlay all selected channels and show differences
   * @param {Object} channels - Selected channels data
   * @param {Array<string>} selectedChannels - Channel names to include
   * @param {number} startTime - Start time in seconds
   * @param {number} duration - Chunk duration in seconds
   * @param {number} samplingRate - Sampling rate in Hz
   * @returns {Array<number>} XOR result
   */
  static computeXOR(channels, selectedChannels, startTime, duration, samplingRate = 250) {
    if (selectedChannels.length === 0) return [];

    const startIndex = Math.floor(startTime * samplingRate);
    const sampleCount = Math.floor(duration * samplingRate);
    const xorResult = new Array(sampleCount).fill(0);

    // Normalize all channels to same scale
    const normalizedChannels = selectedChannels.map(chName => {
      const data = channels[chName].slice(startIndex, startIndex + sampleCount);
      const stats = this.calculateChannelStats(data);
      
      // Normalize to [-1, 1] range
      return data.map(val => {
        if (stats.range === 0) return 0;
        return 2 * (val - stats.min) / stats.range - 1;
      });
    });

    // Compute XOR: sum of absolute differences from mean
    for (let i = 0; i < sampleCount; i++) {
      const values = normalizedChannels.map(ch => ch[i]);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      // XOR effect: deviation from average
      xorResult[i] = values.reduce((sum, val) => sum + Math.abs(val - mean), 0);
    }

    return xorResult;
  }

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
      // Normalize amplitude to radius (0 to 1)
      const r = stats.range === 0 ? 0.5 : (amplitude - stats.min) / stats.range;
      
      // Map time to angle (0 to 2π)
      const theta = (index / dataSlice.length) * 2 * Math.PI;
      
      // Convert to Cartesian for rendering
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      
      return { r, theta, x, y, amplitude, time: index };
    });
  }

  /**
   * Create recurrence plot data (scatter plot between two channels)
   * @param {Array<number>} channelX - X-axis channel data
   * @param {Array<number>} channelY - Y-axis channel data
   * @param {number} startIndex - Start index
   * @param {number} count - Number of samples
   * @returns {Array<{x: number, y: number}>} Scatter plot points
   */
  static createRecurrencePlot(channelX, channelY, startIndex = 0, count = null) {
    const length = Math.min(channelX.length, channelY.length);
    const endIndex = count ? Math.min(startIndex + count, length) : length;
    
    const points = [];
    for (let i = startIndex; i < endIndex; i++) {
      points.push({
        x: channelX[i],
        y: channelY[i],
        index: i
      });
    }
    
    return points;
  }

  /**
   * Calculate density map for recurrence plot
   * @param {Array<{x: number, y: number}>} points - Scatter points
   * @param {number} gridSize - Grid resolution
   * @returns {Array<Array<number>>} 2D density map
   */
  static calculateDensityMap(points, gridSize = 50) {
    if (points.length === 0) return [];

    // Find bounds
    const xValues = points.map(p => p.x);
    const yValues = points.map(p => p.y);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;

    // Initialize grid with consistent structure
    const grid = [];
    for (let i = 0; i < gridSize; i++) {
      const row = [];
      for (let j = 0; j < gridSize; j++) {
        row.push(0);
      }
      grid.push(row);
    }

    // Populate grid with safe division
    points.forEach(point => {
      let xIndex, yIndex;
      
      if (xRange === 0) {
        xIndex = Math.floor(gridSize / 2);
      } else {
        xIndex = Math.floor(((point.x - xMin) / xRange) * (gridSize - 1));
      }
      
      if (yRange === 0) {
        yIndex = Math.floor(gridSize / 2);
      } else {
        yIndex = Math.floor(((point.y - yMin) / yRange) * (gridSize - 1));
      }
      
      // Clamp to grid bounds
      xIndex = Math.max(0, Math.min(gridSize - 1, xIndex));
      yIndex = Math.max(0, Math.min(gridSize - 1, yIndex));
      
      grid[yIndex][xIndex]++;
    });

    return grid;
  }
}

export default RealECGDataService;
