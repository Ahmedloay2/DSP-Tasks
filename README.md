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

## Model Information

All AI models are hosted on cloud infrastructure for:
- **Scalability**: Handle multiple concurrent requests
- **Performance**: GPU-accelerated inference
- **Maintainability**: Easy model updates without redeployment
- **Reliability**: High availability and failover support
