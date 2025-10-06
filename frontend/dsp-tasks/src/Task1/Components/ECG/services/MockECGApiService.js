// Mock ECG data service for testing without real API
export class MockECGDataService {
  static streamState = {
    isStreaming: false,
    currentTime: 0,
    heartRate: 75,
    heartRateVariability: 5,
    streamStartTime: null,
    streamCallbacks: new Set(),
    streamInterval: null,
    buffer: new Map(),
    bufferSize: 5000,
    noiseLevel: 0.05,
    artifacts: {
      breathing: { enabled: true, frequency: 0.3, amplitude: 0.02 },
      muscle: { enabled: false, amplitude: 0.1 },
      powerline: { enabled: false, frequency: 50, amplitude: 0.01 }
    }
  };
  
  // Static properties for session management
  static currentSession = null;
  static mockData = null;
  
  // Optimized ECG data generation
  static generateECGData(lead, samplingRate = 250, duration = 30, startTime = 0, condition = 'normal') {
    const samples = samplingRate * duration;
    const data = new Float32Array(samples);
    const characteristics = this.getLeadCharacteristics(lead);
    
    for (let i = 0; i < samples; i++) {
      const t = (startTime + i) / samplingRate;
      const currentHR = this.streamState.heartRate + Math.sin(t * 0.1) * this.streamState.heartRateVariability;
      const rrInterval = (60 / currentHR) * samplingRate;
      const beatPhase = (i % rrInterval) / rrInterval;
      
      let signal = characteristics.offset;
      signal += this.generateWaveformComponents(beatPhase, characteristics);
      signal += (Math.random() - 0.5) * this.streamState.noiseLevel;
      data[i] = signal;
    }
    
    return Array.from(data);
  }
  
  // Get lead characteristics
  static getLeadCharacteristics(lead) {
    const characteristics = {
      'I': { amplitude: 1.2, offset: 0, qrsWidth: 1.0 },
      'II': { amplitude: 1.5, offset: 0.1, qrsWidth: 1.0 },
      'III': { amplitude: 0.8, offset: -0.05, qrsWidth: 1.0 },
      'aVR': { amplitude: -0.7, offset: 0, qrsWidth: 1.0 },
      'aVL': { amplitude: 0.9, offset: 0.05, qrsWidth: 1.0 },
      'aVF': { amplitude: 1.1, offset: 0.08, qrsWidth: 1.0 },
      'V1': { amplitude: 0.6, offset: -0.1, qrsWidth: 0.9 },
      'V2': { amplitude: 1.3, offset: 0.2, qrsWidth: 0.9 },
      'V3': { amplitude: 1.8, offset: 0.3, qrsWidth: 1.0 },
      'V4': { amplitude: 2.1, offset: 0.2, qrsWidth: 1.1 },
      'V5': { amplitude: 1.6, offset: 0.1, qrsWidth: 1.0 },
      'V6': { amplitude: 1.2, offset: 0.05, qrsWidth: 1.0 }
    };
    return characteristics[lead] || characteristics['I'];
  }
  
  // Generate waveform components
  static generateWaveformComponents(beatPhase, characteristics) {
    let signal = 0;
    
    // P wave
    if (beatPhase >= 0.05 && beatPhase <= 0.15) {
      const pPhase = (beatPhase - 0.05) / 0.1;
      signal += 0.15 * characteristics.amplitude * Math.sin(pPhase * Math.PI);
    }
    
    // QRS complex
    if (beatPhase >= 0.25 && beatPhase <= 0.35) {
      const qrsPhase = (beatPhase - 0.25) / 0.1;
      if (qrsPhase < 0.2) {
        signal -= 0.05 * characteristics.amplitude * Math.sin(qrsPhase * 5 * Math.PI);
      } else if (qrsPhase < 0.6) {
        const rPhase = (qrsPhase - 0.2) / 0.4;
        signal += characteristics.amplitude * Math.exp(-Math.pow((rPhase - 0.5) * 6, 2));
      } else {
        const sPhase = (qrsPhase - 0.6) / 0.4;
        signal -= 0.2 * characteristics.amplitude * Math.sin(sPhase * Math.PI);
      }
    }
    
    // T wave
    if (beatPhase >= 0.55 && beatPhase <= 0.8) {
      const tPhase = (beatPhase - 0.55) / 0.25;
      signal += 0.25 * characteristics.amplitude * Math.sin(tPhase * Math.PI);
    }
    
    return signal;
  }

  // Start live streaming
  static startLiveStream(leads = ['I', 'II', 'III'], samplingRate = 250, condition = 'normal') {
    if (this.streamState.isStreaming) {
      console.warn('Stream already active');
      return;
    }
    
    // Ensure leads is an array
    if (!Array.isArray(leads)) {
      leads = ['I', 'II', 'III'];
    }
    
    this.streamState.isStreaming = true;
    this.streamState.streamStartTime = Date.now();
    this.streamState.currentTime = 0;
    
    leads.forEach(lead => {
      this.streamState.buffer.set(lead, new Array(this.streamState.bufferSize).fill(0));
    });
    
    const chunkSize = samplingRate / 10;
    
    setTimeout(() => {
      this.streamState.streamInterval = setInterval(() => {
        if (!this.streamState.isStreaming) return;
        
        const streamData = {};
        const timestamp = Date.now();
        
        leads.forEach(lead => {
          const chunk = this.generateECGData(lead, samplingRate, chunkSize / samplingRate, this.streamState.currentTime, condition);
          const buffer = this.streamState.buffer.get(lead);
          const startIdx = (this.streamState.currentTime % this.streamState.bufferSize);
          
          chunk.forEach((value, idx) => {
            buffer[(startIdx + idx) % buffer.length] = value;
          });
          
          streamData[lead] = chunk;
        });
        
        this.streamState.currentTime += chunkSize;
        this.streamState.heartRate = 75 + Math.sin(Date.now() / 30000) * 10 + (Math.random() - 0.5) * 5;
        this.streamState.heartRate = Math.max(50, Math.min(120, this.streamState.heartRate));
        
        // Notify all registered callbacks using streamState.streamCallbacks
        this.streamState.streamCallbacks.forEach(cb => {
          try {
            cb({
              data: streamData,
              timestamp,
              heartRate: Math.round(this.streamState.heartRate),
              samplingRate,
              chunkSize,
              streamTime: this.streamState.currentTime / samplingRate,
              isInitialZeros: false
            });
          } catch (error) {
            console.error('Stream callback error:', error);
          }
        });
      }, 100);
    }, 500);
    
    return {
      sessionId: `live_stream_${Date.now()}`,
      message: 'Live stream started',
      leads,
      samplingRate,
      chunkSize
    };
  }
  
  // Stop live streaming
  static stopLiveStream() {
    if (!this.streamState.isStreaming) return;
    
    this.streamState.isStreaming = false;
    if (this.streamState.streamInterval) {
      clearInterval(this.streamState.streamInterval);
      this.streamState.streamInterval = null;
    }
    
    this.streamState.streamCallbacks.clear();
    this.streamState.buffer.clear();
    
    return {
      message: 'Live stream stopped',
      duration: this.streamState.currentTime / 250
    };
  }
  
  // Generate metadata
  static generateMockMetadata(leadMode = '12_lead', isLiveStream = false) {
    const leads = leadMode === '3_lead' 
      ? ['I', 'II', 'III']
      : leadMode === '6_lead'
      ? ['I', 'II', 'III', 'aVR', 'aVL', 'aVF']
      : ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
      
    return {
      session_id: `mock_session_${Date.now()}`,
      sampling_rate: 250,
      samplingRate: 250,
      duration: isLiveStream ? null : 30,
      samples: isLiveStream ? null : 7500,
      leads: leads,
      is_live_stream: isLiveStream,
      patient_info: {
        id: `P${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        age: Math.floor(Math.random() * 60) + 20,
        gender: Math.random() > 0.5 ? 'M' : 'F',
        heart_rate: Math.round(this.streamState.heartRate)
      },
      recording_info: {
        date: new Date().toISOString(),
        device: 'Mock ECG Device Pro'
      },
      lead_mode: leadMode
    };
  }

  // Load ECG file
  static async loadECGFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve({
            success: true,
            data: data,
            metadata: this.generateMockMetadata(data.leadMode || '12_lead', false)
          });
        } catch (error) {
          resolve({
            success: false,
            error: 'Invalid file format. Please use JSON format.',
            details: error.message
          });
        }
      };
      reader.readAsText(file);
    });
  }

  // Register stream callback
  static registerStreamCallback(callback) {
    this.streamState.streamCallbacks.add(callback);
  }
  
  // Unregister stream callback
  static unregisterStreamCallback(callback) {
    this.streamState.streamCallbacks.delete(callback);
  }

  // Resume live stream
  static async resumeLiveStream() {
    if (!this.streamState.isStreaming) {
      throw new Error('No active stream to resume');
    }
    // Implementation would resume the paused stream
    return { message: 'Stream resumed' };
  }

  // Pause live stream  
  static async pauseLiveStream() {
    if (!this.streamState.isStreaming) {
      throw new Error('No active stream to pause');
    }
    // Implementation would pause the stream
    return { message: 'Stream paused' };
  }

  // Control playback (for compatibility with real API)
  static async controlPlayback(_sessionId, action, position = 0, _leads = []) {
    switch (action) {
      case 'play':
        return { current_position: position, message: 'Playback started' };
      case 'pause':
        return { current_position: position, message: 'Playback paused' };
      case 'stop':
        return { current_position: 0, message: 'Playback stopped' };
      case 'seek':
        return { current_position: position, message: 'Seek completed' };
      default:
        throw new Error(`Unknown playback action: ${action}`);
    }
  }

  // Toggle lead (for compatibility)
  static async toggleLead(lead) {
    return { message: `Lead ${lead} toggled` };
  }

  // Set lead configuration (for compatibility)
  static async setLeadConfiguration(_sessionId, mode, _leads) {
    return { message: `Lead configuration set to ${mode}` };
  }

  // Delete session (for compatibility)
  static async deleteSession(_sessionId) {
    this.currentSession = null;
    this.mockData = null;
    return { message: 'Session deleted' };
  }

  // Generate test data (main method called from Task1ECG)
  static async generateTestData(condition = 'normal', leadMode = '12_lead') {
    const sessionId = `mock_session_${Date.now()}`;
    const metadata = this.generateMockMetadata(leadMode, false);
    
    metadata.session_id = sessionId;
    metadata.condition = condition;
    metadata.duration = 30;
    metadata.samples = metadata.sampling_rate * metadata.duration;
    
    this.currentSession = sessionId;
    this.mockData = { metadata, data: {} };
    
    return {
      session_id: sessionId,
      metadata: metadata,
      message: 'Mock data generated successfully'
    };
  }
}

export default MockECGDataService;