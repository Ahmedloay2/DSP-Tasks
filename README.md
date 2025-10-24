# Multi-Channel Signal Viewer & Classifier

A comprehensive web-based application for visualizing and classifying biomedical, acoustic, and radio frequency signals using advanced signal processing techniques and AI-powered analysis.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
  - [🫀 ECG Signal Analysis](#-ecg-signal-analysis)
  - [🧠 EEG Signal Analysis](#-eeg-signal-analysis)
  - [🔊 Acoustic Signal Processing](#-acoustic-signal-processing)
    - [Doppler Effect Generator](#doppler-effect-generator)
    - [Doppler Effect Detector](#doppler-effect-detector)
    - [Drone Sound Classifier](#drone-sound-classifier)
  - [📡 SAR Signal Analysis](#-sar-signal-analysis)
- [Technology Stack](#technology-stack)
  - [Frontend](#frontend)
  - [Backend](#backend)
- [Architecture](#architecture)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Frontend Setup](#frontend-setup)
  - [Backend Setup](#backend-setup)
- [Usage](#usage)
  - [ECG/EEG Analysis](#ecgeeg-analysis)
  - [Doppler Effect Generator](#doppler-effect-generator-1)
  - [Doppler Effect Detector](#doppler-effect-detector-1)
  - [Drone Sound Detection](#drone-sound-detection)
  - [SAR Image Analysis](#sar-image-analysis)
- [API Endpoints](#api-endpoints)
  - [Biomedical Signals](#biomedical-signals)
    - [ECG](#ecg)
    - [EEG](#eeg)
  - [Acoustic Signals](#acoustic-signals)
    - [Doppler Effect](#doppler-effect)
    - [Drone Detection](#drone-detection)
  - [RF Signals](#rf-signals)
    - [SAR Analysis](#sar-analysis)
- [Project Structure](#project-structure)
- [Model Information](#model-information)

## Overview

This project provides a unified platform for analyzing multiple types of signals across different domains:
- **Biomedical Signals**: ECG and EEG with multiple visualization modes
- **Acoustic Signals**: Doppler effect simulation and detection, drone sound classification
- **RF Signals**: SAR image analysis for land-water segmentation

## Features

### 🫀 ECG Signal Analysis

**Visualization Modes:**
- Continuous-time signal viewer
- XOR graph representation
- Polar graph visualization
- Recurrence plot analysis

**AI-Powered Classification:**
The system classifies ECG signals into six categories:
- Atrial Fibrillation/Flutter (AFIB)
- Hypertrophy (HYP)
- Myocardial Infarction (MI)
- Normal Sinus Rhythm
- Other Abnormality
- ST-T Changes (STTC)

### 🧠 EEG Signal Analysis

**Visualization Modes:**
- Continuous-time signal viewer
- XOR graph representation
- Polar graph visualization
- Recurrence plot analysis

**AI-Powered Classification:**
The system detects neurological conditions:
- Normal
- Alzheimer's Disease
- Epilepsy
- Parkinson's Disease

### 🔊 Acoustic Signal Processing

#### Doppler Effect Generator
Simulates the sound of a passing vehicle with configurable parameters:
- Vehicle velocity
- Sound frequency

Generates realistic Doppler-shifted audio demonstrating frequency compression and expansion.

#### Doppler Effect Detector
Analyzes uploaded audio files to:
- Detect presence of Doppler effect
- Estimate vehicle velocity
- Determine original sound frequency

#### Drone Sound Classifier
Binary AI classifier that determines whether an audio sample contains drone sounds.

### 📡 SAR Signal Analysis

Processes Synthetic Aperture Radar (SAR) images to estimate:
- Water-to-land ratio
- Geographic terrain composition

Uses deep learning models for accurate segmentation and analysis.

## Technology Stack

### Frontend
- **React 18**: Modern, component-based UI framework
- **Vite**: Fast build tool and development server
- **Interactive Visualizations**: Real-time signal rendering and graph generation
- **Custom Hooks**: Theme management and reusable logic
- **Modular Architecture**: Task-based component organization

### Backend
- **Flask**: Lightweight Python web framework
- **RESTful API**: Clean interface for data exchange
- **MNE-Python**: EEG/MEG data processing library
- **NumPy**: Numerical computing for signal processing
- **SciPy**: Advanced signal processing algorithms


## Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   React     │ ◄────►  │  Flask API       │ ◄────►  │  Cloud-Hosted   │
│  Frontend   │  HTTP   │  (Jupyter NB)    │  REST   │   AI Models     │
│  (Vite)     │         │                  │         │                 │
└─────────────┘         └──────────────────┘         └─────────────────┘
     │                         │                          │
     │                         │                          │
     ▼                         ▼                          ▼
Signal Upload          Data Processing           Classification
Visualization          Request Routing           Analysis Results
User Interaction       Response Handling         Model Inference
```

The Flask API (implemented as a Jupyter Notebook) serves as a middleware layer that:
1. Receives signal data from the React frontend
2. Preprocesses and formats data for ML models
3. Manages communication with cloud-hosted AI services
4. Handles file uploads (audio, images, signal data)
5. Returns classification results and analysis to the frontend

**Development Flexibility:**
- Can be run locally via Jupyter Notebook
- Can be deployed on Google Colab for cloud execution
- Uses ngrok or similar tunneling for remote access when needed

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm package manager
- Python 3.8+ (for backend server)
- pip package manager

### Frontend Setup

```bash
# Clone the repository
git clone https://github.com/ahmedloay2/dsp-tasks.git
cd dsp-tasks/frontend/dsp-tasks

# Install dependencies
npm install

# Start development server
npm run dev
```

The React application will start using Vite dev server (typically `http://localhost:5173`)

### Backend Setup

The backend API is implemented as a Jupyter Notebook in the repository.

```bash
# Navigate to the repository
cd dsp-tasks

# Install required packages
pip install flask numpy mne scipy

# Open and run the API notebook
jupyter notebook
# OR if using Google Colab, upload the notebook to Colab
```

**Running the API:**
1. Open the API notebook (located in the repository)
2. Install all required dependencies in the notebook
3. Run all cells to start the Flask server
4. The API will be accessible at `http://localhost:5000` (or through Colab's tunneling service)

**Required Python Packages:**
- Flask (web framework)
- numpy (numerical computing)
- mne (EEG data processing - EEGLAB format support)
- scipy (signal processing)
- werkzeug (secure file handling)
- Additional ML inference libraries for classification models

**Note:** If running in Google Colab, you may need to use ngrok or Colab's built-in tunneling to expose the Flask server to your local frontend.

## Usage

### ECG/EEG Analysis

**ECG:**
1. Select signal by name (identifier)
2. Fetch signal data using the signal name
3. Select visualization mode (continuous, XOR, polar, or recurrence)
4. View real-time signal rendering
5. Click "Classify" to receive AI-powered diagnosis

**EEG:**
1. Specify subject number (e.g., 001, 002, ...)
2. Select channel number to view
3. System loads EEG data from `.set` files (EEGLAB format)
4. View first 5000 data points of selected channel
5. Click "Classify" to detect neurological conditions

### Doppler Effect Generator
1. Navigate to Acoustic Signals → Doppler Generator
2. Set vehicle velocity (m/s)
3. Set sound frequency (Hz)
4. Click "Generate" to create Doppler-shifted audio
5. Play or download the generated sound

### Doppler Effect Detector
1. Upload an audio file
2. Click "Analyze"
3. View detection results:
   - Doppler effect presence (Yes/No)
   - Estimated velocity
   - Original frequency

### Drone Sound Detection
1. Upload an audio sample
2. Receive binary classification (Drone/Not Drone)
3. View confidence score

### SAR Image Analysis
1. Upload SAR image (supported formats: .tif, .png, .jpg)
2. Click "Analyze"
3. View segmentation results and water-to-land ratio

## API Endpoints

### Biomedical Signals

#### ECG
- `GET /ecg_data?name=<signal_name>` - Retrieve ECG signal data
  - Query Parameters:
    - `name`: Signal identifier (first 5 characters used)
  - Returns: JSON array of ECG data points

- `GET /ecg_classification?name=<signal_name>` - Classify ECG signal
  - Query Parameters:
    - `name`: Signal identifier (first 5 characters used)
  - Returns: Classification result (AFIB, HYP, MI, Normal, Other, or STTC)

#### EEG
- `POST /upload-eeg?subject_num=<num>&channel_num=<num>` - Retrieve EEG data
  - Query Parameters:
    - `subject_num`: Subject identifier (3-digit format)
    - `channel_num`: EEG channel to retrieve
  - Returns: JSON object with:
    - `number_of_channels`: Total available channels
    - `single_channel`: Array of 5000 data points from specified channel

- `POST /eeg_classify?subject_num=<num>` - Classify EEG signal
  - Query Parameters:
    - `subject_num`: Subject identifier (2-digit format)
  - Returns: Classification result (Normal, Alzheimer, Epilepsy, or Parkinson)

### Acoustic Signals

#### Doppler Effect
- `POST /generate-doppler-sound` - Generate Doppler effect audio
  - Query Parameters:
    - `source_velocity`: Vehicle velocity (m/s)
    - `source_freq`: Sound frequency (Hz)
    - `normal_distance`: Perpendicular distance from observer (meters)
    - `half_simulation_duration`: Duration for half of simulation (seconds)
  - Returns: WAV file (`doppler_effect.wav`)

#### Drone Detection
- `POST /upload-drone-wav` - Classify drone sound
  - Form Data:
    - `wav_file`: Audio file (WAV format)
  - Returns: Classification result (Drone/Not Drone)
  - Uploaded file saved to: `uploaded_drone_audio/uploaded_drone_audio.wav`

### RF Signals

#### SAR Analysis
- `POST /upload-sar-image` - Analyze SAR image
  - Form Data:
    - `sar_image`: SAR image file (BMP format)
  - Returns: Water-to-land ratio analysis
  - Uploaded file saved to: `uploaded_sar_image/uploaded_sar_image.bmp`

## Project Structure

```
ahmedloay2-dsp-tasks/
├── README.md
└── frontend/
    └── dsp-tasks/
        ├── README.md
        ├── package.json
        ├── vite.config.js
        ├── eslint.config.js
        ├── index.html
        └── src/
            ├── App.jsx
            ├── App.css
            ├── main.jsx
            ├── index.css
            ├── components/
            │   ├── TaskCard.jsx
            │   ├── TasksHome.jsx
            │   └── shared/
            │       └── layout/
            │           ├── Layout.jsx
            │           ├── Navbar.jsx
            │           └── Footer.jsx
            ├── data/
            │   └── allTasksData.js
            ├── hooks/
            │   └── useTheme.js
            ├── styles/
            │   ├── TaskCard.css
            │   └── TasksHome.css
            └── tasks/
                └── task1/
                    ├── index.js
                    ├── components/
                    │   ├── Task1.jsx
                    │   ├── Task1Home.jsx
                    │   ├── Task1HomeCard.jsx
                    │   ├── ecg/
                    │   │   ├── MultiChannelECGViewer.jsx
                    │   │   ├── Task1ECG.jsx
                    │   │   ├── Components/
                    │   │   │   ├── Controls/
                    │   │   │   │   ├── ChannelSelector.jsx
                    │   │   │   │   └── TimeControlPanel.jsx
                    │   │   │   ├── Detection/
                    │   │   │   │   └── DetectionResults.jsx
                    │   │   │   ├── UI/
                    │   │   │   │   ├── ECGFileUploader.jsx
                    │   │   │   │   └── ECGHeader.jsx
                    │   │   │   └── Viewers/
                    │   │   │       ├── ContinuousViewer.jsx
                    │   │   │       ├── PolarViewer.jsx
                    │   │   │       ├── RecurrenceViewer.jsx
                    │   │   │       └── XORViewer.jsx
                    │   │   ├── constants/
                    │   │   │   ├── ECGConstants.js
                    │   │   │   └── MultiChannelConfig.js
                    │   │   └── services/
                    │   │       ├── ECGClassificationService.js
                    │   │       ├── RealECGDataService.js
                    │   │       └── XORProcessor.js
                    │   ├── eeg/
                    │   │   ├── MultiChannelEEGViewer.jsx
                    │   │   ├── Task1EEG.jsx
                    │   │   ├── Components/
                    │   │   │   ├── Controls/
                    │   │   │   │   ├── ChannelSelector.jsx
                    │   │   │   │   └── TimeControlPanel.jsx
                    │   │   │   ├── Detection/
                    │   │   │   │   └── DetectionResults.jsx
                    │   │   │   ├── UI/
                    │   │   │   │   ├── EEGFileUploader.jsx
                    │   │   │   │   └── EEGHeader.jsx
                    │   │   │   └── Viewers/
                    │   │   │       ├── ContinuousViewer.jsx
                    │   │   │       ├── PolarViewer.jsx
                    │   │   │       ├── RecurrenceViewer.jsx
                    │   │   │       └── XORViewer.jsx
                    │   │   ├── constants/
                    │   │   │   ├── EEGConstants.js
                    │   │   │   └── MultiChannelConfig.js
                    │   │   └── services/
                    │   │       ├── EEGClassificationService.js
                    │   │       └── RealEEGDataService.js
                    │   ├── doppler/
                    │   │   ├── Task1DopplerShift.jsx
                    │   │   ├── components/
                    │   │   │   ├── AudioPlayer.jsx
                    │   │   │   ├── DopplerAnalyzer.jsx
                    │   │   │   ├── DopplerGenerator.jsx
                    │   │   │   ├── DopplerHeader.jsx
                    │   │   │   ├── DopplerSignalViewer.jsx
                    │   │   │   └── DroneDetector.jsx
                    │   │   └── services/
                    │   │       ├── DopplerApiService.js
                    │   │       └── MockDopplerApiService.js
                    │   └── sar/
                    │       ├── Task1SAR.jsx
                    │       ├── components/
                    │       │   ├── SARHeader.jsx
                    │       │   └── SARImageAnalyzer.jsx
                    │       └── services/
                    │           ├── RealSARApiService.js
                    │           └── MockSARApiService.js
                    ├── data/
                    │   └── homeData.js
                    └── styles/
                        ├── Task1Home.css
                        └── Task1HomeCard.css
```

**Backend Structure (Jupyter Notebook):**
```
backend/
├── API_notebook.ipynb (Flask server implementation)
├── api/
│   └── doppler/
│       └── doppler_effect.wav
├── alzheimer_eeg_data/
│   └── sub-XXX/
│       └── eeg/
│           └── sub-XXX_task-eyesclosed_eeg.set
├── epilepsy_data/
│   └── chb02_XX.edf
├── uploaded_drone_audio/
│   └── uploaded_drone_audio.wav
└── uploaded_sar_image/
    └── uploaded_sar_image.bmp
```

## Task 2 Structure & Features

Task 2 focuses on **Sampling, Aliasing, and Anti-Aliasing** concepts in digital signal processing. This task demonstrates the effects of different sampling frequencies on signal quality, exploring the Nyquist theorem, aliasing artifacts, and anti-aliasing techniques.

### Task 2 Signal Processing Modules

#### 🫀 ECG Signal Viewer with Resampling
**Location:** `frontend/dsp-tasks/src/tasks/task2/components/ecg/`

**Features:**
- Real-time ECG monitoring with multi-lead visualization
- Sampling frequency adjustment (50Hz - 1000Hz)
- Aliasing demonstration and analysis
- Multiple visualization modes:
  - Continuous-time signal viewer
  - XOR graph representation
  - Polar graph visualization
  - Recurrence plot analysis
  - **Sampling viewer** - visualizes effects of different sampling rates
- Heart rate analysis
- Anti-aliasing filter application
- Resampling section for frequency manipulation

**Key Components:**
- `Task2ECG.jsx` - Main ECG interface with file upload (.hea, .dat)
- `MultiChannelECGViewer.jsx` - Multi-channel ECG visualization
- `ResamplingSection.jsx` - Sampling frequency control
- Viewer components: ContinuousViewer, XORViewer, PolarViewer, RecurrenceViewer, SamplingViewer

#### 🧠 EEG Signal Viewer with Resampling
**Location:** `frontend/dsp-tasks/src/tasks/task2/components/eeg/`

**Features:**
- Real-time EEG monitoring with brain wave analysis
- Multi-channel visualization (all channels loaded at 500Hz initial sampling)
- Sampling frequency adjustment (50Hz - 1000Hz)
- Aliasing effect demonstration
- Frequency domain analysis
- Multiple visualization modes (continuous, XOR, polar, recurrence, sampling)
- EDF file format support

**Key Components:**
- `Task2EEG.jsx` - Main EEG interface with EDF file upload
- `MultiChannelEEGViewer.jsx` - Multi-channel EEG visualization
- `EEGFileUploader.jsx` - File upload handler for .edf files
- `ResamplingSection.jsx` - Sampling frequency manipulation
- Full suite of viewer components

#### 🔊 Speech Recognition with Aliasing Demo
**Location:** `frontend/dsp-tasks/src/tasks/task2/components/speech/`

**Features:**
- Audio signal upload and playback (WAV, MP3, OGG, WebM)
- Gender recognition (Male/Female) using AI
- Real-time speech waveform visualization
- Sampling frequency manipulation (1kHz - 48kHz)
- Aliasing effect demonstration in audio signals
- Anti-aliasing filter application
- Speech quality comparison at different sampling rates
- Three independent processing stages:
  1. **Original Audio Analysis** - Upload and analyze with gender recognition
  2. **Resampled Audio** - Downsample with configurable frequency
  3. **Anti-Aliased Audio** - Apply anti-aliasing filters before resampling

**Key Components:**
- `Task2Speech.jsx` - Main speech processing interface
- `OriginalAudioSection.jsx` - Original audio playback and gender recognition
- `ResampledAudioSection.jsx` - Downsampled audio analysis
- `AntiAliasedAudioSection.jsx` - Anti-aliased audio comparison
- `AudioPlayer.jsx` - Audio playback controls
- `SpeechHeader.jsx` - Task header and information

**API Modes:**
- Real API mode - connects to Flask backend
- Mock API mode - for testing without backend

#### 📡 Doppler Shift Analysis
**Location:** `frontend/dsp-tasks/src/tasks/task2/components/doppler/`

**Features:**
- Audio signal generation with Doppler effect
- Frequency shift analysis
- Interactive parameter control (velocity, frequency)
- Real-time visualization
- Audio playback capabilities
- Doppler effect detection in uploaded audio
- Drone sound classifier

**Key Components:**
- `Task2DopplerShift.jsx` - Main Doppler interface
- `DopplerGenerator.jsx` - Generate Doppler-shifted audio
- `DopplerAnalyzer.jsx` - Analyze uploaded audio for Doppler effects
- `DroneDetector.jsx` - Binary drone sound classification
- `DopplerSignalViewer.jsx` - Real-time signal visualization
- `AudioPlayer.jsx` - Audio playback controls

#### 🛰️ SAR Image Analysis
**Location:** `frontend/dsp-tasks/src/tasks/task2/components/sar/`

**Features:**
- SAR image upload and visualization
- Automated land-water classification
- Earth/water coverage percentage estimation
- Real-time image analysis
- Backscatter-based surface detection
- Support for multiple image formats (.tif, .png, .jpg, .bmp)

**Key Components:**
- `Task2SAR.jsx` - Main SAR interface
- `SARImageAnalyzer.jsx` - Image upload and analysis
- `SARHeader.jsx` - Task header and SAR information

### Task 2 Project Structure

```
frontend/dsp-tasks/src/tasks/task2/
├── index.js                          # Task 2 module exports
├── components/
│   ├── Task2.jsx                     # Task 2 root component (Outlet)
│   ├── Task2Home.jsx                 # Task 2 landing page
│   ├── Task2HomeCard.jsx             # Task card component
│   │
│   ├── ecg/                          # ECG Signal Processing
│   │   ├── Task2ECG.jsx              # ECG main interface
│   │   ├── MultiChannelECGViewer.jsx # Multi-channel viewer
│   │   ├── Task2ECG.css
│   │   ├── MultiChannelECGViewer.css
│   │   ├── Components/
│   │   │   ├── Controls/             # UI controls
│   │   │   │   ├── ChannelSelector.jsx
│   │   │   │   └── TimeControlPanel.jsx
│   │   │   ├── Detection/
│   │   │   │   └── DetectionResults.jsx
│   │   │   ├── Resampling/
│   │   │   │   └── ResamplingSection.jsx   # Sampling freq control
│   │   │   ├── UI/
│   │   │   │   ├── ECGFileUploader.jsx
│   │   │   │   └── ECGHeader.jsx
│   │   │   └── Viewers/
│   │   │       ├── ContinuousViewer.jsx
│   │   │       ├── XORViewer.jsx
│   │   │       ├── PolarViewer.jsx
│   │   │       ├── RecurrenceViewer.jsx
│   │   │       └── SamplingViewer.jsx      # NEW: Sampling visualization
│   │   ├── constants/
│   │   │   ├── ECGConstants.js
│   │   │   └── MultiChannelConfig.js
│   │   └── services/
│   │       ├── ECGClassificationService.js
│   │       ├── RealECGDataService.js
│   │       └── XORProcessor.js
│   │
│   ├── eeg/                          # EEG Signal Processing
│   │   ├── Task2EEG.jsx              # EEG main interface
│   │   ├── MultiChannelEEGViewer.jsx # Multi-channel viewer
│   │   ├── Task2EEG.css
│   │   ├── MultiChannelEEGViewer.css
│   │   ├── Components/
│   │   │   ├── Controls/
│   │   │   │   ├── ChannelSelector.jsx
│   │   │   │   └── TimeControlPanel.jsx
│   │   │   ├── Detection/
│   │   │   │   └── DetectionResults.jsx
│   │   │   ├── Resampling/
│   │   │   │   └── ResamplingSection.jsx
│   │   │   ├── UI/
│   │   │   │   ├── EEGFileUploader.jsx
│   │   │   │   └── EEGHeader.jsx
│   │   │   └── Viewers/
│   │   │       ├── ContinuousViewer.jsx
│   │   │       ├── XORViewer.jsx
│   │   │       ├── PolarViewer.jsx
│   │   │       ├── RecurrenceViewer.jsx
│   │   │       └── SamplingViewer.jsx
│   │   ├── constants/
│   │   │   ├── EEGConstants.js
│   │   │   └── MultiChannelConfig.js
│   │   └── services/
│   │       ├── EEGClassificationService.js
│   │       └── RealEEGService.js
│   │
│   ├── speech/                       # Speech Signal Processing
│   │   ├── Task2Speech.jsx           # Speech main interface
│   │   ├── Task2Speech.css
│   │   ├── components/
│   │   │   ├── SpeechHeader.jsx
│   │   │   ├── AudioPlayer.jsx       # Audio playback controls
│   │   │   ├── OriginalAudioSection.jsx      # Original audio analysis
│   │   │   ├── ResampledAudioSection.jsx     # Resampled audio analysis
│   │   │   └── AntiAliasedAudioSection.jsx   # Anti-aliased audio
│   │   ├── services/
│   │   │   ├── RealSpeechService.js
│   │   │   └── MockSpeechService.js
│   │   └── index.js
│   │
│   ├── doppler/                      # Doppler Shift Analysis
│   │   ├── Task2DopplerShift.jsx     # Doppler main interface
│   │   ├── Task2DopplerShift.css
│   │   ├── components/
│   │   │   ├── DopplerHeader.jsx
│   │   │   ├── DopplerGenerator.jsx  # Generate Doppler audio
│   │   │   ├── DopplerAnalyzer.jsx   # Analyze Doppler effects
│   │   │   ├── DroneDetector.jsx     # Drone sound classifier
│   │   │   ├── DopplerSignalViewer.jsx
│   │   │   └── AudioPlayer.jsx
│   │   ├── services/
│   │   │   ├── DopplerApiService.js
│   │   │   └── MockDopplerApiService.js
│   │   └── Styles/
│   │
│   └── sar/                          # SAR Image Analysis
│       ├── Task2SAR.jsx              # SAR main interface
│       ├── Task2SAR.css
│       ├── components/
│       │   ├── SARHeader.jsx
│       │   └── SARImageAnalyzer.jsx  # Image upload and analysis
│       ├── services/
│       │   ├── RealSARApiService.js
│       │   └── MockSARApiService.js
│       ├── styles/
│       └── index.js
│
├── data/
│   ├── homeData.js                   # Task 2 navigation data
│   └── index.js
│
└── styles/
    ├── Task2Home.css
    └── Task2HomeCard.css
```

### Task 2 Key Concepts

**Sampling Theory:**
- Nyquist-Shannon Sampling Theorem
- Nyquist frequency = 2 × maximum signal frequency
- Proper sampling preserves signal information

**Aliasing:**
- Occurs when sampling rate < Nyquist frequency
- High-frequency components appear as lower frequencies
- Causes signal distortion and information loss
- Demonstrated in all Task 2 modules (ECG, EEG, Speech)

**Anti-Aliasing:**
- Low-pass filtering before downsampling
- Removes frequency components above Nyquist limit
- Prevents aliasing artifacts
- Implemented in Speech and ECG/EEG modules

**Resampling:**
- Changing signal sampling rate
- Upsampling: Increasing sampling rate (interpolation)
- Downsampling: Decreasing sampling rate (decimation)
- Demonstrated with adjustable frequency controls

### Task 2 API Integration

Task 2 modules support both Real API and Mock API modes:

**Real API Mode:**
- Connects to Flask backend for actual signal processing
- Uploads files and receives processed results
- Gender recognition, classification, and analysis

**Mock API Mode:**
- Simulated responses for development/testing
- No backend connection required
- Useful for UI development and debugging

## Model Information

All AI models are hosted on cloud infrastructure for:
- **Scalability**: Handle multiple concurrent requests
- **Performance**: GPU-accelerated inference
- **Maintainability**: Easy model updates without redeployment
- **Reliability**: High availability and failover support
