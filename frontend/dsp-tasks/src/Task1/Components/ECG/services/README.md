# Enhanced Mock ECG API Service

## 🫀 Overview

This enhanced mock ECG service provides realistic electrocardiogram data simulation with live streaming capabilities, pathological condition modeling, and comprehensive API emulation. It's designed to work exactly like uploaded real ECG data, making development and testing seamless.

## ✨ Key Features

### 🔴 Live Streaming
- **Real-time ECG data generation** with configurable sampling rates
- **Continuous streaming** with realistic heart rate variability
- **Multiple lead support** (3, 6, or 12-lead configurations)
- **Circular buffering** for smooth data playback
- **Stream control** (start, stop, pause, configure)

### 🏥 Pathological Conditions
- **Normal Sinus Rhythm** - Baseline healthy ECG
- **Atrial Fibrillation** - Irregular rhythm with fibrillatory waves
- **Myocardial Infarction (STEMI)** - ST elevation patterns
- **Ventricular Tachycardia** - Fast, wide QRS complexes
- **Bundle Branch Block** - Prolonged QRS duration
- **Sinus Bradycardia** - Slow heart rate
- **Pacemaker Rhythm** - Artificial pacing spikes

### 🎯 AI-Powered Analysis
- **Automated classification** with confidence scores
- **Differential diagnosis** suggestions
- **Clinical recommendations** based on findings
- **Detailed rhythm analysis** (rate, regularity, morphology)
- **Interval measurements** (PR, QRS, QT)

### 📊 Realistic Data Features
- **Physiological waveforms** (P, QRS, T waves)
- **Natural variability** in amplitudes and timing
- **Realistic noise and artifacts** (breathing, muscle, powerline)
- **Lead-specific characteristics** matching real ECG leads
- **Patient demographics** and medical history simulation

## 🚀 Quick Start

### Basic File Upload Simulation
```javascript
import MockECGApiService from './services/MockECGApiService.js';

// Simulate uploading ECG files
const headerFile = { name: 'patient_001.hea' };
const dataFile = { name: 'patient_001.dat' };
const annotationFile = { name: 'patient_001.atr' };

const result = await MockECGApiService.uploadECGFiles(
  headerFile, 
  dataFile, 
  annotationFile
);

console.log('Session ID:', result.session_id);
console.log('Metadata:', result.metadata);
```

### Live Streaming
```javascript
// Start live ECG stream
const streamInfo = await MockECGApiService.startLiveStream(
  ['I', 'II', 'V1'], // leads
  250,              // sampling rate
  'normal'          // condition
);

// Register callback for real-time data
const unsubscribe = MockECGApiService.registerStreamCallback((data) => {
  console.log('New ECG data:', data);
  console.log('Heart rate:', data.heartRate);
  console.log('Lead data:', data.data);
});

// Stop streaming
await MockECGApiService.stopLiveStream();
unsubscribe(); // Clean up callback
```

### Get ECG Data
```javascript
// Get ECG data from uploaded file or live stream
const ecgData = await MockECGApiService.getECGData(
  sessionId,
  0,      // start sample
  2500,   // end sample (10 seconds at 250Hz)
  'I,II,III', // leads
  true    // include quality metrics
);

console.log('Data:', ecgData.data);
console.log('Quality:', ecgData.quality_metrics);
```

### AI Classification
```javascript
// Get AI analysis of ECG
const classification = await MockECGApiService.getClassification(
  sessionId,
  'comprehensive' // analysis type
);

console.log('Primary diagnosis:', classification.classification[0]);
console.log('Confidence:', classification.confidence_score);
console.log('Recommendations:', classification.recommendations);
```

## 🧪 Testing Different Conditions

### Generate Pathological ECG
```javascript
// Generate specific condition for testing
const testData = await MockECGApiService.generateTestData(
  'atrial_fibrillation', // condition
  '12_lead',            // lead mode
  30                    // duration in seconds
);

// Analyze the generated data
const analysis = await MockECGApiService.getClassification(testData.session_id);
```

### Available Conditions
- `normal` - Normal sinus rhythm
- `atrial_fibrillation` - Irregular atrial activity
- `myocardial_infarction` - Heart attack patterns
- `ventricular_tachycardia` - Dangerous fast rhythm
- `bundle_branch_block` - Conduction delay
- `bradycardia` - Slow heart rate
- `pacemaker` - Artificial pacing

## 📈 Advanced Features

### Export Data
```javascript
// Export ECG data in various formats
const exportResult = await MockECGApiService.exportData(
  sessionId,
  'csv',                    // format: json, csv, edf, wfdb
  ['I', 'II', 'III'],      // selected leads
  0,                       // start time (seconds)
  10                       // end time (seconds)
);
```

### Real-time Statistics
```javascript
// Get live stream statistics
const stats = await MockECGApiService.getRealtimeStats(sessionId);
console.log('Current HR:', stats.heart_rate.current);
console.log('Stream uptime:', stats.stream_info.uptime);
console.log('Signal quality:', stats.quality.signal_quality);
```

### Configure Stream Parameters
```javascript
// Adjust stream characteristics
await MockECGApiService.configureStream(sessionId, {
  heartRate: 80,
  heartRateVariability: 10,
  noiseLevel: 0.02,
  artifacts: {
    breathing: { enabled: true, frequency: 0.3, amplitude: 0.02 },
    muscle: { enabled: false, amplitude: 0.1 },
    powerline: { enabled: true, frequency: 50, amplitude: 0.01 }
  }
});
```

## 🎛️ API Reference

### Core Methods

#### `uploadECGFiles(headerFile, dataFile, atrFile?)`
Simulates uploading ECG files with realistic delays and processing.

#### `startLiveStream(leads, samplingRate, condition)`
Starts real-time ECG data generation and streaming.

#### `stopLiveStream()`
Stops active live stream and cleans up resources.

#### `getECGData(sessionId, start?, end?, leads?, includeQuality?)`
Retrieves ECG signal data for specified range and leads.

#### `getClassification(sessionId, analysisType?)`
Performs AI-powered ECG analysis and classification.

### Utility Methods

#### `healthCheck()`
Returns service status and feature availability.

#### `listSessions()`
Lists all active ECG sessions (file uploads and live streams).

#### `deleteSession(sessionId)`
Removes session and frees associated resources.

#### `generateTestData(condition, leadMode, duration?)`
Creates test ECG data for specific pathological conditions.

## 🔧 Integration Examples

### React Component Integration
```jsx
import React, { useState, useEffect } from 'react';
import MockECGApiService from './services/MockECGApiService.js';

const ECGViewer = () => {
  const [ecgData, setEcgData] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const startStream = async () => {
    const stream = await MockECGApiService.startLiveStream(['I', 'II'], 250, 'normal');
    setIsStreaming(true);
    
    MockECGApiService.registerStreamCallback((data) => {
      setEcgData(data);
    });
  };

  return (
    <div>
      <button onClick={startStream} disabled={isStreaming}>
        Start ECG Stream
      </button>
      {ecgData && (
        <div>
          <p>Heart Rate: {ecgData.heartRate} BPM</p>
          {/* Render ECG waveforms */}
        </div>
      )}
    </div>
  );
};
```

### Data Processing Pipeline
```javascript
// Complete ECG processing workflow
async function processECGWorkflow(condition = 'normal') {
  try {
    // 1. Generate test data
    const testData = await MockECGApiService.generateTestData(condition, '12_lead');
    
    // 2. Get raw ECG signals
    const ecgSignals = await MockECGApiService.getECGData(
      testData.session_id, 0, null, null, true
    );
    
    // 3. Perform AI analysis
    const analysis = await MockECGApiService.getClassification(
      testData.session_id, 'comprehensive'
    );
    
    // 4. Export results
    const exportData = await MockECGApiService.exportData(
      testData.session_id, 'json'
    );
    
    return {
      signals: ecgSignals,
      analysis: analysis,
      export: exportData
    };
  } catch (error) {
    console.error('ECG processing failed:', error);
    throw error;
  }
}
```

## 🏗️ Architecture

### Data Generation
The service uses mathematical models to generate realistic ECG waveforms:
- **P Wave**: Atrial depolarization (sinusoidal)
- **QRS Complex**: Ventricular depolarization (gaussian/exponential)
- **T Wave**: Ventricular repolarization (sinusoidal)
- **Noise**: Random variations and physiological artifacts

### Streaming Architecture
- **Circular Buffer**: Maintains recent signal history
- **Chunk Processing**: Delivers data in real-time chunks
- **Callback System**: Notifies subscribers of new data
- **State Management**: Tracks stream parameters and quality

### Pathology Simulation
Each condition modifies the base signal generation:
- **Heart Rate Changes**: Adjust RR intervals
- **Morphology Alterations**: Modify wave shapes
- **Rhythm Irregularities**: Introduce timing variations
- **Amplitude Changes**: Simulate pathological patterns

## 🐛 Troubleshooting

### Common Issues

**Stream not starting:**
- Check if another stream is already active
- Verify lead names are valid
- Ensure sampling rate is supported (typically 250Hz)

**No data received:**
- Confirm callback is properly registered
- Check browser console for errors
- Verify session ID is correct

**Classification errors:**
- Ensure session exists and has data
- Check if sufficient data duration is available
- Verify analysis type parameter

### Debug Mode
Enable detailed logging:
```javascript
// Enable debug logging
MockECGDataService.configureStream(sessionId, {
  debugMode: true
});
```

## 📝 Changelog

### Version 2.0.0 (Current)
- ✅ Added live streaming capabilities
- ✅ Enhanced pathological condition simulation
- ✅ Comprehensive AI classification
- ✅ Real-time statistics and monitoring
- ✅ Multiple export formats
- ✅ Improved error handling and validation

### Version 1.0.0
- Basic ECG data generation
- File upload simulation
- Simple classification

## 🤝 Contributing

This mock service is designed to be easily extensible. To add new features:

1. **New Conditions**: Add to `generatePathologicalECG()` method
2. **Export Formats**: Extend `exportData()` method
3. **Analysis Types**: Enhance `getClassification()` logic
4. **Stream Features**: Modify `MockECGDataService` class

## 📄 License

This mock service is part of the DSP Tasks educational project and is intended for development and testing purposes only. Not for medical use.

---

**Note**: This is a simulation service designed for development and testing. It generates realistic but synthetic ECG data and should never be used for actual medical diagnosis or patient care.