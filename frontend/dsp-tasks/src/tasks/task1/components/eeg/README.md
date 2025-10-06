# EEG (Electroencephalography) Signal Viewer

A comprehensive 12-channel EEG signal visualization and analysis tool built for Task 1. This module provides advanced brain wave signal processing with multiple visualization modes, real-time playback controls, and intelligent pattern detection.

## 📁 Folder Structure

```
eeg/
├── Task1EEG.jsx                    # Main entry component with file upload
├── Task1EEG.css                    # Styles for Task1EEG
├── MultiChannelEEGViewer.jsx       # Multi-channel viewer with all modes
├── MultiChannelEEGViewer.css       # Styles for MultiChannelEEGViewer
├── index.js                        # Module exports
│
├── Components/
│   ├── Controls/
│   │   ├── ChannelSelector.jsx    # Channel selection UI
│   │   ├── ChannelSelector.css
│   │   ├── TimeControlPanel.jsx   # Playback and navigation controls
│   │   └── TimeControlPanel.css
│   │
│   ├── Viewers/
│   │   ├── ContinuousViewer.jsx   # Time-series continuous view
│   │   ├── ContinuousViewer.css
│   │   ├── XORViewer.jsx          # XOR channel comparison
│   │   ├── XORViewer.css
│   │   ├── PolarViewer.jsx        # Polar coordinate visualization
│   │   ├── PolarViewer.css
│   │   ├── RecurrenceViewer.jsx   # 2D phase space plots
│   │   └── RecurrenceViewer.css
│   │
│   ├── UI/
│   │   ├── EEGHeader.jsx          # Page header with metadata
│   │   ├── EEGHeader.css
│   │   ├── EEGFileUploader.jsx    # File upload interface
│   │   ├── EEGFileUploader.css
│   │   └── index.js
│   │
│   └── Detection/
│       ├── DetectionResults.jsx   # Pattern detection results display
│       └── DetectionResults.css
│
├── constants/
│   ├── EEGConstants.js            # EEG-specific constants (electrodes, bands)
│   └── MultiChannelConfig.js      # Channel configuration and settings
│
└── services/
    ├── RealEEGDataService.js      # API service for fetching EEG data
    └── EEGClassificationService.js # Classification and pattern detection
```

## 🧠 Key Features

### 1. 12-Channel EEG Support
- Based on the International 10-20 electrode placement system
- Channels: Fp1, Fp2, F7, F3, Fz, F4, F8, T3, C3, Cz, C4, T4
- Organized by brain regions (Frontal, Temporal, Central)

### 2. Frequency Band Analysis
- **Delta (0.5-4 Hz)**: Deep sleep
- **Theta (4-8 Hz)**: Light sleep, meditation
- **Alpha (8-13 Hz)**: Relaxed awareness
- **Beta (13-30 Hz)**: Active thinking
- **Gamma (30-100 Hz)**: High-level cognitive processing

### 3. Multiple Visualization Modes
- **Continuous**: Real-time time-series display with scrolling
- **XOR**: Channel difference visualization for artifact detection
- **Polar**: Circular phase space representation
- **Recurrence**: 2D scatter plots for pattern analysis

### 4. Interactive Controls
- Play/Pause/Stop playback
- Variable speed control (0.5x, 1x, 2x, 4x)
- Zoom and pan functionality
- Seek bar for precise navigation
- Individual channel selection

### 5. Pattern Detection
- Mental state classification
- Artifact detection (eye blinks, muscle movement, electrical noise)
- Dominant frequency band identification
- Real-time analysis results

## 🎨 Customizations from ECG

The EEG module has been specifically customized from the ECG template:

1. **Sampling Rate**: Changed from 500 Hz to 256 Hz (standard for EEG)
2. **Channel Names**: Updated to EEG electrode names (10-20 system)
3. **Brain Regions**: Organized by Frontal, Temporal, Central areas
4. **Frequency Bands**: Added EEG-specific frequency band analysis
5. **Mental States**: Classification based on brain wave patterns
6. **Terminology**: All cardiac-related terms replaced with neurological equivalents

## 🚀 Usage

### Basic Import
```javascript
import { Task1EEG } from './tasks/task1/components/eeg';
```

### Using the Service
```javascript
import { RealEEGDataService } from './tasks/task1/components/eeg';

// Fetch EEG data
const data = await RealEEGDataService.fetchEEGData('recordName');

// Access channels
const fp1Data = data.channels.ch1; // Fp1 electrode
const fp2Data = data.channels.ch2; // Fp2 electrode
```

### Classification
```javascript
import { EEGClassificationService } from './tasks/task1/components/eeg';

// Get mental state classification
const result = await EEGClassificationService.fetchClassification('recordName');
console.log(result.data.mental_state);
console.log(result.data.dominant_band);
```

## 🎯 API Endpoints

The module expects the following API endpoints:

- `GET /eeg_data?name={recordName}` - Fetch 12-channel EEG data
- `GET /eeg_classification?name={recordName}` - Get classification results

## 📊 Data Format

### Expected Input
```javascript
[
  [fp1, fp2, f7, f3, fz, f4, f8, t3, c3, cz, c4, t4], // Sample 1
  [fp1, fp2, f7, f3, fz, f4, f8, t3, c3, cz, c4, t4], // Sample 2
  // ... more samples
]
```

### Processed Output
```javascript
{
  channels: {
    ch1: [/*Fp1 data*/],
    ch2: [/*Fp2 data*/],
    // ... 12 channels total
  },
  metadata: {
    sampleCount: 5000,
    samplingRate: 256,
    duration: 19.53,
    channelCount: 12,
    recordingType: 'EEG',
    electrodeSystem: '10-20'
  },
  stats: {
    ch1: { min, max, mean, std, range },
    // ... stats for all channels
  }
}
```

## 🎨 Color Scheme

The module uses CSS variables that adapt to light/dark mode:
- Each channel has a unique color for easy identification
- Colors are optimized for both accessibility and aesthetics
- Frequency bands have distinct colors matching their characteristics

## 🔧 Configuration

Key configuration files:
- `constants/EEGConstants.js` - Electrode positions, frequency bands, artifact types
- `constants/MultiChannelConfig.js` - Channel colors, view modes, default settings

## 📝 Notes

- This module is designed to mirror the ECG module structure but is specifically customized for EEG data
- All components support dark mode through CSS variables
- The module is fully responsive and optimized for various screen sizes
- Real-time performance is optimized using React hooks and memoization

## 🔗 Related Modules

- **ECG Module**: Sibling module for cardiac signal analysis
- **Task1 Components**: Parent task module
- **Doppler Module**: Related signal processing module

---

**Created**: October 2025  
**Based on**: ECG module structure  
**Purpose**: Brain wave signal visualization and analysis for DSP tasks
