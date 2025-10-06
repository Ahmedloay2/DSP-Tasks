/**
 * Real EEG Data Service
 * Fetches multi-channel EEG data from the real API endpoint
 * Optimized to fetch ALL channels before starting the viewer
 */

const API_BASE_URL = 'https://semilunate-marcene-nonsustainable.ngrok-free.dev';

class RealEEGDataService {
  /**
   * Extract subject number from filename
   * Looks for patterns like 'S001', 'subject_1', 'sub2', etc.
   * @param {string} filename - EEG file name
   * @returns {number} Subject number (defaults to 1 if not found)
   */
  static extractSubjectNumber(filename) {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.(edf|set)$/i, '');
    
    // Try different patterns:
    // Pattern 1: S001, S01, S1
    const sPattern = nameWithoutExt.match(/[Ss](\d+)/);
    if (sPattern) return parseInt(sPattern[1], 10);
    
    // Pattern 2: subject_001, subject_1, sub001
    const subjectPattern = nameWithoutExt.match(/(?:subject|sub)[_-]?(\d+)/i);
    if (subjectPattern) return parseInt(subjectPattern[1], 10);
    
    // Pattern 3: Any number in the filename
    const numberPattern = nameWithoutExt.match(/(\d+)/);
    if (numberPattern) return parseInt(numberPattern[1], 10);
    
    // Default to subject 1
    console.warn(`Could not extract subject number from filename: ${filename}. Using default: 1`);
    return 1;
  }

  /**
   * Upload EEG file and fetch ALL channel data
   * This method now does the complete workflow:
   * 1. Extract subject number from filename
   * 2. Fetch first channel to get total channel count
   * 3. Fetch all remaining channels in parallel
   * 4. Return complete dataset ready for visualization
   * 
   * @param {File} file - EEG file (.edf or .set)
   * @returns {Promise<Object>} Complete EEG data with all channels loaded
   */
  static async uploadEEGFile(file) {
    try {
      // Step 1: Extract subject number from filename
      const subjectNum = this.extractSubjectNumber(file.name);
      console.log(`📊 Processing file: ${file.name}`);
      console.log(`👤 Extracted subject number: ${subjectNum}`);

      // Step 2: Fetch first channel to determine total channel count
      console.log(`🔍 Fetching channel 1 to determine total channels...`);
      const firstChannelResponse = await fetch(
        `${API_BASE_URL}/upload-eeg?subject_num=${subjectNum}&channel_num=1`,
        {
          method: 'GET',
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json'
          }
        }
      );

      if (!firstChannelResponse.ok) {
        throw new Error(`API request failed: ${firstChannelResponse.status} ${firstChannelResponse.statusText}`);
      }

      const firstChannelData = await firstChannelResponse.json();
      const totalChannels = firstChannelData.number_of_channels;
      const samplingRate = 256; // Standard EEG sampling rate
      
      console.log(`✅ Total channels detected: ${totalChannels}`);
      console.log(`📈 Sample count per channel: ${firstChannelData.single_channel.length}`);

      // Step 3: Fetch all remaining channels in parallel
      console.log(`⚡ Fetching all ${totalChannels} channels in parallel...`);
      const channelPromises = [];
      
      // Store first channel data
      const allChannelData = {
        ch1: firstChannelData.single_channel
      };

      // Fetch remaining channels (2 to N)
      for (let channelNum = 2; channelNum <= totalChannels; channelNum++) {
        channelPromises.push(
          fetch(
            `${API_BASE_URL}/upload-eeg?subject_num=${subjectNum}&channel_num=${channelNum}`,
            {
              method: 'GET',
              headers: {
                'ngrok-skip-browser-warning': 'true',
                'Content-Type': 'application/json'
              }
            }
          )
            .then(response => {
              if (!response.ok) {
                throw new Error(`Failed to fetch channel ${channelNum}`);
              }
              return response.json();
            })
            .then(data => ({
              channelNum,
              data: data.single_channel
            }))
        );
      }

      // Wait for all channels to load
      const channelResults = await Promise.all(channelPromises);
      
      // Store all channel data
      channelResults.forEach(result => {
        allChannelData[`ch${result.channelNum}`] = result.data;
      });

      console.log(`✅ All ${totalChannels} channels loaded successfully!`);

      // Step 4: Calculate metadata
      const sampleCount = firstChannelData.single_channel.length;
      const duration = sampleCount / samplingRate;
      const channelNames = Object.keys(allChannelData).sort((a, b) => {
        const numA = parseInt(a.replace('ch', ''));
        const numB = parseInt(b.replace('ch', ''));
        return numA - numB;
      });

      // Return complete dataset with all channels loaded
      return {
        success: true,
        recordName: file.name.replace(/\.(edf|set)$/i, ''),
        subjectNumber: subjectNum,
        channelCount: totalChannels,
        channelNames: channelNames,
        samplingRate: samplingRate,
        duration: duration,
        sampleCount: sampleCount,
        totalDataPoints: sampleCount * totalChannels,
        channels: allChannelData, // All channel data pre-loaded!
        metadata: {
          sampleCount,
          samplingRate,
          duration,
          channelCount: totalChannels,
          channelNames: channelNames,
          totalDataPoints: sampleCount * totalChannels,
          recordingType: 'EEG',
          subjectNumber: subjectNum
        }
      };
    } catch (error) {
      console.error('❌ Failed to upload EEG file and fetch channels:', error);
      throw error;
    }
  }

  /**
   * Fetch EEG data - NOW DEPRECATED, data is fetched during upload
   * All channel data is pre-loaded in uploadEEGFile() method
   * This method is kept for backward compatibility
   * 
   * @param {string} name - Record name (not used anymore)
   * @param {number} channelCount - Expected number of channels (not used anymore)
   * @returns {Promise<Object>} Empty object (data already loaded)
   */
  static async fetchEEGData(name = 'example', channelCount = null) {
    // Suppress unused variable warnings - parameters kept for API compatibility
    void name;
    void channelCount;
    
    console.warn('⚠️ fetchEEGData is deprecated. All data is now pre-loaded during uploadEEGFile()');
    return {
      channels: {},
      metadata: {
        sampleCount: 0,
        samplingRate: 256,
        duration: 0,
        channelCount: 0,
        channelNames: [],
        totalDataPoints: 0,
        recordingType: 'EEG'
      },
      stats: {},
      rawData: []
    };
  }

  /**
   * Parse raw API response into structured multi-channel data
   * @param {Array} rawData - Array of samples, each containing N values (N channels)
   * @param {number} expectedChannelCount - Expected number of channels (optional)
   * @returns {Object} Structured data with channels, metadata, etc.
   */
  static parseEEGData(rawData, expectedChannelCount = null) {
    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new Error('Invalid data format: expected non-empty array');
    }

    // Detect number of channels from first sample
    const firstSample = rawData[0];
    if (!Array.isArray(firstSample)) {
      throw new Error('Invalid sample format: expected array');
    }
    
    const detectedChannelCount = firstSample.length;
    
    // Validate channel count if expected count is provided
    if (expectedChannelCount && detectedChannelCount !== expectedChannelCount) {
      console.warn(`Channel count mismatch: expected ${expectedChannelCount}, got ${detectedChannelCount}`);
    }

    const sampleCount = rawData.length;
    
    // Dynamically initialize channels based on detected count
    const channels = {};
    for (let i = 0; i < detectedChannelCount; i++) {
      channels[`ch${i + 1}`] = [];
    }

    // Distribute data into channels
    rawData.forEach(sample => {
      for (let i = 0; i < detectedChannelCount; i++) {
        channels[`ch${i + 1}`].push(sample[i]);
      }
    });

    // Calculate metadata (EEG-specific sampling rate)
    const samplingRate = 256; // Standard EEG sampling rate (256 Hz)
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
        channelCount: Object.keys(channels).length,
        channelNames: Object.keys(channels),
        totalDataPoints: sampleCount * Object.keys(channels).length,
        recordingType: 'EEG',
        electrodeSystem: '10-20'
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
  static getTimeAxis(sampleCount, samplingRate = 256) {
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
  static extractTimeWindow(channelData, startTime, duration, samplingRate = 256) {
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
  static computeXOR(channels, selectedChannels, startTime, duration, samplingRate = 256) {
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

    // Initialize grid
    const grid = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));

    // Populate grid
    points.forEach(point => {
      const xIndex = Math.floor(((point.x - xMin) / (xMax - xMin)) * (gridSize - 1));
      const yIndex = Math.floor(((point.y - yMin) / (yMax - yMin)) * (gridSize - 1));
      
      if (xIndex >= 0 && xIndex < gridSize && yIndex >= 0 && yIndex < gridSize) {
        grid[yIndex][xIndex]++;
      }
    });

    return grid;
  }

  /**
   * Compute power spectral density for frequency band analysis
   * @param {Array<number>} channelData - Channel data
   * @param {number} samplingRate - Sampling rate in Hz (default: 256)
   * @returns {Object} Power in different frequency bands
   */
  static computeFrequencyBands(channelData, samplingRate = 256) {
    // This is a simplified version - real implementation would use FFT
    // samplingRate would be used in actual FFT computation
    const bands = {
      delta: { min: 0.5, max: 4, power: 0, samplingRate },
      theta: { min: 4, max: 8, power: 0, samplingRate },
      alpha: { min: 8, max: 13, power: 0, samplingRate },
      beta: { min: 13, max: 30, power: 0, samplingRate },
      gamma: { min: 30, max: 100, power: 0, samplingRate }
    };
    
    // Placeholder for actual FFT computation
    // In a real implementation, you would use an FFT library with the samplingRate
    // and channelData to compute actual frequency domain analysis
    
    return bands;
  }
}

export default RealEEGDataService;
