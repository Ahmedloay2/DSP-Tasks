/**
 * Real EEG Service - Consolidated
 * 
 * Handles EEG-related API operations:
 * - EEG File upload and channel fetching
 * - EEG Classification
 * - Statistics calculations
 * - Polar coordinates conversion
 */

const API_BASE_URL = 'https://semilunate-marcene-nonsustainable.ngrok-free.dev';

class RealEEGService {
  // ==================== EEG FILE UPLOAD & DATA FETCHING ====================
  
  /**
   * Extract subject number from filename
   */
  static extractSubjectNumber(filename) {
    const nameWithoutExt = filename.replace(/\.(edf|set)$/i, '');
    
    const sPattern = nameWithoutExt.match(/[Ss](\d+)/);
    if (sPattern) return parseInt(sPattern[1], 10);
    
    const subjectPattern = nameWithoutExt.match(/(?:subject|sub)[_-]?(\d+)/i);
    if (subjectPattern) return parseInt(subjectPattern[1], 10);
    
    const numberPattern = nameWithoutExt.match(/(\d+)/);
    if (numberPattern) return parseInt(numberPattern[1], 10);
    
    console.warn(`Could not extract subject number from filename: ${filename}. Using default: 1`);
    return 1;
  }

  /**
   * Upload EEG file and fetch ALL channel data
   */
  static async uploadEEGFile(file, samplingFrequency = 500) {
    try {
      const subjectNum = this.extractSubjectNumber(file.name);
      console.log(`📊 Processing file: ${file.name}`);
      console.log(`👤 Extracted subject number: ${subjectNum}`);
      console.log(`🎛️ Initial sampling frequency: ${samplingFrequency}Hz`);

      const firstChannelUrl = `${API_BASE_URL}/upload-eeg?subject_num=${subjectNum}&channel_num=1`;
      
      const firstChannelResponse = await fetch(firstChannelUrl, {
        method: 'GET',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json'
        }
      });

      if (!firstChannelResponse.ok) {
        throw new Error(`API request failed: ${firstChannelResponse.status} ${firstChannelResponse.statusText}`);
      }

      const firstChannelData = await firstChannelResponse.json();
      const totalChannels = firstChannelData.number_of_channels;
      
      console.log(`✅ Total channels detected: ${totalChannels}`);

      const channelPromises = [];
      const allChannelData = {
        ch1: firstChannelData.single_channel
      };

      for (let channelNum = 2; channelNum <= totalChannels; channelNum++) {
        const channelUrl = `${API_BASE_URL}/upload-eeg?subject_num=${subjectNum}&channel_num=${channelNum}`;
        
        channelPromises.push(
          fetch(channelUrl, {
            method: 'GET',
            headers: {
              'ngrok-skip-browser-warning': 'true',
              'Content-Type': 'application/json'
            }
          })
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

      const channelResults = await Promise.all(channelPromises);
      
      channelResults.forEach(result => {
        allChannelData[`ch${result.channelNum}`] = result.data;
      });

      console.log(`✅ All ${totalChannels} channels loaded successfully!`);

      const sampleCount = firstChannelData.single_channel.length;
      const duration = sampleCount / samplingFrequency;
      const channelNames = Object.keys(allChannelData).sort((a, b) => {
        const numA = parseInt(a.replace('ch', ''));
        const numB = parseInt(b.replace('ch', ''));
        return numA - numB;
      });

      return {
        success: true,
        recordName: file.name.replace(/\.(edf|set)$/i, ''),
        subjectNumber: subjectNum,
        channelCount: totalChannels,
        channelNames: channelNames,
        samplingRate: samplingFrequency,
        duration: duration,
        sampleCount: sampleCount,
        totalDataPoints: sampleCount * totalChannels,
        channels: allChannelData,
        metadata: {
          sampleCount,
          samplingRate: samplingFrequency,
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
   * Fetch EEG data (deprecated - kept for compatibility)
   */
  static async fetchEEGData() {
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

  // ==================== EEG CLASSIFICATION ====================

  /**
   * Fetch EEG classification for a given record
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Expected JSON but got:', contentType);
        
        throw new Error(`Server returned ${contentType || 'unknown type'} instead of JSON`);
      }

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
   * Parse classification data into structured format
   */
  static parseClassificationString(classificationData) {
    if (!classificationData) {
      return {
        mentalState: 'Unknown',
        confidence: 0,
        dominantBand: 'Unknown',
        isNormal: false,
        rawText: 'No data received'
      };
    }

    const mentalState = classificationData.predicted_state || 
                       classificationData.mental_state || 
                       'Unknown';
    const confidenceStr = classificationData.confidence || 
                         classificationData.confidience ||
                         '0%';
    const confidence = parseFloat(confidenceStr) || 0;
    const dominantBand = classificationData.dominant_band || 'Unknown';

    const isNormal = mentalState.toLowerCase().includes('normal') || 
                    mentalState.toLowerCase().includes('relaxed') ||
                    mentalState.toLowerCase().includes('alert');
    
    return {
      mentalState,
      confidence,
      dominantBand,
      isNormal,
      rawText: JSON.stringify(classificationData),
      displayText: `Mental State: ${mentalState} (Confidence: ${confidence}%)`
    };
  }

  // ==================== STATISTICS & UTILITIES ====================

  /**
   * Calculate statistics for a channel
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

export default RealEEGService;
