/**
 * XORProcessor - Enhanced XOR Signal Processing Utility
 * 
 * Implements a sophisticated XOR comparison system for 1-channel EEG/ECG signals:
 * 1. Divides continuous signal into fixed-size chunks
 * 2. Organizes chunks into odd/even arrays based on index
 * 3. Performs alternating XOR comparisons:
 *    - odd[0] ⊕ even[0]
 *    - even[0] ⊕ odd[1]
 *    - odd[1] ⊕ even[1]
 *    - odd[2] ⊕ even[1]
 *    ... and so on
 * 4. Returns XOR results for real-time visualization
 */

class XORProcessor {
  /**
   * Process a signal with XOR comparison logic
   * @param {Array<number>} signalData - The 1-channel signal data
   * @param {number} samplingRate - Sampling rate in Hz
   * @param {number} chunkSizeSeconds - Chunk size in seconds
   * @param {number} currentTime - Current playback time in seconds
   * @returns {Object} Processed XOR data with chunks and results
   */
  static processSignal(signalData, samplingRate, chunkSizeSeconds, currentTime) {
    if (!signalData || signalData.length === 0) {
      return {
        oddChunks: [],
        evenChunks: [],
        xorResults: [],
        comparisonPattern: [],
        metadata: {
          totalChunks: 0,
          oddCount: 0,
          evenCount: 0,
          samplesPerChunk: 0,
          processedUpToTime: 0
        }
      };
    }

    const samplesPerChunk = Math.floor(chunkSizeSeconds * samplingRate);
    if (samplesPerChunk === 0) {
      return this.getEmptyResult();
    }

    // Calculate how much data to process based on current time
    const currentSample = Math.floor(currentTime * samplingRate);
    const dataToProcess = signalData.slice(0, currentSample);

    // Divide signal into chunks
    const { oddChunks, evenChunks } = this.organizeChunks(dataToProcess, samplesPerChunk);

    // Perform alternating XOR comparisons
    const { xorResults, comparisonPattern } = this.performXORComparisons(
      oddChunks,
      evenChunks,
      samplesPerChunk
    );

    return {
      oddChunks,
      evenChunks,
      xorResults,
      comparisonPattern,
      metadata: {
        totalChunks: oddChunks.length + evenChunks.length,
        oddCount: oddChunks.length,
        evenCount: evenChunks.length,
        samplesPerChunk,
        processedUpToTime: currentTime,
        totalComparisons: xorResults.length
      }
    };
  }

  /**
   * Organize signal data into odd and even chunks
   * @param {Array<number>} data - Signal data
   * @param {number} samplesPerChunk - Samples in each chunk
   * @returns {Object} Object with oddChunks and evenChunks arrays
   */
  static organizeChunks(data, samplesPerChunk) {
    const oddChunks = [];
    const evenChunks = [];
    
    const numCompleteChunks = Math.floor(data.length / samplesPerChunk);
    
    for (let i = 0; i < numCompleteChunks; i++) {
      const startIdx = i * samplesPerChunk;
      const endIdx = startIdx + samplesPerChunk;
      const chunk = data.slice(startIdx, endIdx);
      
      // Organize based on chunk index (0-indexed)
      if (i % 2 === 0) {
        // Even index (0, 2, 4, ...) → Even array
        evenChunks.push(chunk);
      } else {
        // Odd index (1, 3, 5, ...) → Odd array
        oddChunks.push(chunk);
      }
    }
    
    return { oddChunks, evenChunks };
  }

  /**
   * Perform alternating XOR comparisons between odd and even chunks
   * Pattern: odd[0]⊕even[0], even[0]⊕odd[1], odd[1]⊕even[1], even[1]⊕odd[2], ...
   * @param {Array<Array<number>>} oddChunks - Array of odd-indexed chunks
   * @param {Array<Array<number>>} evenChunks - Array of even-indexed chunks
   * @param {number} samplesPerChunk - Expected samples per chunk
   * @returns {Object} XOR results and comparison pattern
   */
  static performXORComparisons(oddChunks, evenChunks, samplesPerChunk) {
    const xorResults = [];
    const comparisonPattern = [];
    
    // If no data, return empty
    if (oddChunks.length === 0 && evenChunks.length === 0) {
      return { xorResults: [], comparisonPattern: [] };
    }

    // Implement alternating pattern
    let oddIdx = 0;
    let evenIdx = 0;
    let useOddFirst = true; // Start with odd[0] ⊕ even[0]
    
    while (oddIdx < oddChunks.length || evenIdx < evenChunks.length) {
      let chunk1, chunk2, label;
      
      if (useOddFirst) {
        // Compare odd[oddIdx] ⊕ even[evenIdx]
        if (oddIdx < oddChunks.length && evenIdx < evenChunks.length) {
          chunk1 = oddChunks[oddIdx];
          chunk2 = evenChunks[evenIdx];
          label = `odd[${oddIdx}] ⊕ even[${evenIdx}]`;
          
          const xorChunk = this.bitwiseXOR(chunk1, chunk2, samplesPerChunk);
          xorResults.push(xorChunk);
          comparisonPattern.push({
            type: 'odd-even',
            oddIndex: oddIdx,
            evenIndex: evenIdx,
            label
          });
          
          // Next comparison will be even[evenIdx] ⊕ odd[oddIdx+1]
          useOddFirst = false;
        } else if (oddIdx < oddChunks.length) {
          // Only odd chunks left, no even to compare
          break;
        } else if (evenIdx < evenChunks.length) {
          // Only even chunks left, move to next even
          evenIdx++;
          useOddFirst = true;
        } else {
          break;
        }
      } else {
        // Compare even[evenIdx] ⊕ odd[oddIdx+1]
        const nextOddIdx = oddIdx + 1;
        
        if (evenIdx < evenChunks.length && nextOddIdx < oddChunks.length) {
          chunk1 = evenChunks[evenIdx];
          chunk2 = oddChunks[nextOddIdx];
          label = `even[${evenIdx}] ⊕ odd[${nextOddIdx}]`;
          
          const xorChunk = this.bitwiseXOR(chunk1, chunk2, samplesPerChunk);
          xorResults.push(xorChunk);
          comparisonPattern.push({
            type: 'even-odd',
            evenIndex: evenIdx,
            oddIndex: nextOddIdx,
            label
          });
          
          // Move indices forward
          oddIdx = nextOddIdx;
          evenIdx++;
          useOddFirst = true;
        } else {
          // Can't make this comparison, exit
          break;
        }
      }
    }
    
    return { xorResults, comparisonPattern };
  }

  /**
   * Perform bitwise XOR operation between two chunks
   * XOR logic: Compare corresponding samples point by point
   * @param {Array<number>} chunk1 - First chunk
   * @param {Array<number>} chunk2 - Second chunk
   * @param {number} expectedLength - Expected length of result
   * @returns {Array<number>} XOR result
   */
  static bitwiseXOR(chunk1, chunk2, expectedLength) {
    const result = [];
    const maxLength = Math.max(chunk1.length, chunk2.length, expectedLength);
    
    for (let i = 0; i < maxLength; i++) {
      const val1 = i < chunk1.length ? chunk1[i] : 0;
      const val2 = i < chunk2.length ? chunk2[i] : 0;
      
      // XOR operation: absolute difference represents XOR-like behavior
      // When values are identical, result is 0; when different, shows the difference
      const xorValue = Math.abs(val1 - val2);
      result.push(xorValue);
    }
    
    return result;
  }

  /**
   * Get XOR result for a specific time point during playback
   * @param {Object} processedData - Previously processed XOR data
   * @param {number} currentTime - Current playback time
   * @param {number} chunkSize - Chunk size in seconds
   * @returns {Object} Current XOR chunk to display
   */
  static getCurrentXORChunk(processedData, currentTime, chunkSize) {
    if (!processedData || !processedData.xorResults || processedData.xorResults.length === 0) {
      return null;
    }

    // Determine which XOR result chunk to display based on current time
    const chunkIndex = Math.floor(currentTime / chunkSize);
    const resultIndex = Math.min(chunkIndex, processedData.xorResults.length - 1);
    
    if (resultIndex < 0 || resultIndex >= processedData.xorResults.length) {
      return null;
    }

    return {
      data: processedData.xorResults[resultIndex],
      comparison: processedData.comparisonPattern[resultIndex],
      chunkIndex: resultIndex,
      totalChunks: processedData.xorResults.length
    };
  }

  /**
   * Get all XOR results up to current time (for cumulative display)
   * @param {Object} processedData - Previously processed XOR data
   * @param {number} currentTime - Current playback time
   * @param {number} chunkSize - Chunk size in seconds
   * @returns {Array} Array of XOR chunks to display
   */
  static getXORChunksUpToTime(processedData, currentTime, chunkSize) {
    if (!processedData || !processedData.xorResults || processedData.xorResults.length === 0) {
      return [];
    }

    const chunkIndex = Math.floor(currentTime / chunkSize);
    const maxIndex = Math.min(chunkIndex + 1, processedData.xorResults.length);
    
    return processedData.xorResults.slice(0, maxIndex).map((data, idx) => ({
      data,
      comparison: processedData.comparisonPattern[idx],
      chunkIndex: idx
    }));
  }

  /**
   * Helper to get empty result structure
   */
  static getEmptyResult() {
    return {
      oddChunks: [],
      evenChunks: [],
      xorResults: [],
      comparisonPattern: [],
      metadata: {
        totalChunks: 0,
        oddCount: 0,
        evenCount: 0,
        samplesPerChunk: 0,
        processedUpToTime: 0,
        totalComparisons: 0
      }
    };
  }
}

export default XORProcessor;
