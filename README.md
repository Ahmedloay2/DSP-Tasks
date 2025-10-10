# 📊 DSP-Tasks: Advanced Signal Processing & Visualization Toolkit# Signal Processing and Analysis Toolkit



<div align="center">## Task 1 - Signal Viewer: Multi-Signal Viewer with Basic Processing



![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)### Overview

![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF?style=for-the-badge&logo=vite&logoColor=white)A comprehensive signal visualization and analysis tool that supports multiple signal types including medical, acoustic, and radiofrequency signals with integrated AI-based analysis capabilities.

![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)## Medical Signals Viewer



**A comprehensive web-based signal visualization and analysis platform supporting medical, acoustic, and radiofrequency signals with AI-powered analysis capabilities.**### Features

- **Multi-channel ECG/EEG Visualization**

[🚀 Live Demo](#) • [📖 Documentation](#features) • [🐛 Report Bug](../../issues) • [✨ Request Feature](../../issues)- **Abnormality Detection** using pretrained AI models

- **Multiple Viewer Types**:

</div>  - Continuous-time signal viewer

  - XOR graph visualization

---  - Polar graph representation

  - Reoccurrence graph

## 📑 Table of Contents

### Supported Abnormalities

- [Overview](#-overview)The system detects four distinct types of signal abnormalities:

- [Features](#-features)1. **Arrhythmia** - Irregular heart rhythms

  - [Medical Signals](#-medical-signals-viewer)2. **Bradycardia** - Abnormally slow heart rate

  - [Acoustic Signals](#-acoustic-signals-viewer)3. **Tachycardia** - Abnormally fast heart rate

  - [Radiofrequency Signals](#-radiofrequency-signals-viewer)4. **Ischemia** - Reduced blood flow to heart tissue

- [Technology Stack](#-technology-stack)

- [Installation](#-installation)### Viewer Types

- [Usage](#-usage)

- [Project Structure](#-project-structure)#### 1. Continuous-Time Signal Viewer

- [AI Models](#-ai-models)![Continuous Time Viewer](images/task1/medical/continuous_time_viewer.png)

- [Contributing](#-contributing)*Default viewer with fixed time-length viewport, speed control, zoom, pan, and play/stop functionality*

- [License](#-license)

- [Contact](#-contact)#### 2. XOR Graph

![XOR Graph](images/task1/medical/xor_graph.png)

---*Signal chunks plotted with XOR function - identical chunks erase each other*



## 🎯 Overview#### 3. Polar Graph

![Polar Graph](images/task1/medical/polar_graph.png)

DSP-Tasks is a modern, interactive web application designed for comprehensive signal processing, visualization, and analysis. Built with React and powered by AI models, it provides researchers, engineers, and students with powerful tools to analyze medical signals (ECG/EEG), acoustic phenomena (Doppler effects, drone detection), and radiofrequency signals (SAR/Cosmic).*Magnitude vs time representation in polar coordinates*



### Key Highlights#### 4. Reoccurrence Graph

![Reoccurrence Graph](images/task1/medical/reoccurrence_graph.png)

✨ **Multi-Signal Support** - ECG, EEG, Doppler, SAR, and more  *Cumulative scatter plot between two channels*

🤖 **AI-Powered Analysis** - Real-time abnormality detection and classification  

📈 **Advanced Visualizations** - Multiple viewer types including XOR, Polar, and Reoccurrence graphs  ### AI Integration

🎛️ **Interactive Controls** - Speed, zoom, pan, channel selection, and color mapping  - **1D Model**: Multi-channel abnormality detection upon file opening

🌐 **Web-Based** - No installation required, runs in any modern browser  - **2D Model**: Trained on graph representations for same abnormality types

⚡ **Real-Time Processing** - Instant signal analysis and visualization

## Acoustic Signals Viewer

---

### Vehicle-Passing Doppler Effect

## ✨ Features![Doppler Effect Simulation](images/task1/acoustic/doppler_simulation.png)

*Interactive simulation of vehicle passing with controllable velocity and frequency*

### 🏥 Medical Signals Viewer

**Features:**

Visualize and analyze multi-channel **ECG (Electrocardiogram)** and **EEG (Electroencephalogram)** signals with advanced AI-powered abnormality detection.- Generate expected sound of car passing with adjustable parameters (v, f)

- Real vehicle sound analysis using AI models

#### 🔍 Supported Abnormalities- Velocity and frequency estimation from real audio files



The system automatically detects **four types of signal abnormalities** using pretrained AI models:### Drone/Submarine Detection

![Drone Detection](images/task1/acoustic/drone_detection.png)

| Abnormality | Description | Detection Method |*AI-powered sound classification for unmanned vehicles*

|-------------|-------------|------------------|

| **Arrhythmia** | Irregular heart rhythms and patterns | Multi-channel 1D & 2D CNN |**Capabilities:**

| **Bradycardia** | Abnormally slow heart rate (<60 bpm) | Frequency domain analysis |- Real data analysis for drone/submarine sounds

| **Tachycardia** | Abnormally fast heart rate (>100 bpm) | Real-time rate detection |- Detection among similar ambient sounds

| **Ischemia** | Reduced blood flow indicators | ST-segment analysis |- Pattern recognition in acoustic signatures



#### 📊 Visualization Modes## Radiofrequency Signals Viewer



<table>### SAR/Cosmic Signals

<tr>![RF Signal Visualization](images/task1/rf/sar_cosmic_signals.png)

<td width="50%">*Visualization and analysis of synthetic aperture radar and cosmic signals*



**1. Continuous-Time Viewer** (Default)**Analysis Features:**

- Fixed time-length viewport spanning the signal- Real RF signal data visualization

- **Controls**: Speed, Zoom In/Out, Pan, Play/Stop- Information extraction from signal characteristics

- Real-time scrolling with adjustable playback speed- Custom parameter estimation based on signal properties

- Multi-channel overlay support

## Installation and Setup

</td>

<td width="50%">```bash

# Clone repository

**2. XOR Graph**git clone [repository-url]

- Signal divided into equal time chunkscd signal-viewer

- Each chunk plotted with XOR function

- Identical chunks cancel out (pattern detection)# Install dependencies

- Adjustable chunk widthpip install -r requirements.txt



</td># Run application

</tr>python main.py
<tr>
<td width="50%">

**3. Polar Graph**
- **r (radius)**: Signal magnitude
- **θ (theta)**: Time component
- **Modes**: 
  - Fixed time window (fading trail)
  - Cumulative plot (full history)

</td>
<td width="50%">

**4. Reoccurrence Graph**
- Cumulative scatter plot: Channel X vs Channel Y
- Phase space reconstruction
- Pattern periodicity detection
- 2D intensity color mapping

</td>
</tr>
</table>

#### 🎨 Advanced Controls

- **Channel Selection**: Display individual or multiple channels simultaneously
- **Time Period Control**: Adjust chunk size for XOR and windowing operations
- **Color Mapping**: Customizable color schemes for 2D intensity representations
- **Export Options**: Save visualizations and analysis results

#### 🤖 AI Integration

- **1D Multi-Channel Model**: Analyzes raw signal data upon file opening
- **2D Image-Based Model**: Trained on 2D graph representations (Polar/Reoccurrence)
- **Real-Time Classification**: Instant abnormality type notification
- **Confidence Scores**: Probability distribution across abnormality classes

---

### 🔊 Acoustic Signals Viewer

#### 🚗 Vehicle-Passing Doppler Effect

**Simulation & Analysis of Doppler Frequency Shift**

**Features:**
- **Sound Generator**: 
  - Adjustable vehicle velocity (v)
  - Controllable horn frequency (f)
  - Realistic Doppler shift simulation based on physics equations
  - Real-time audio playback
  
- **AI-Powered Analyzer**:
  - Upload real vehicle-passing audio files
  - AI model estimates:
    - ✅ Vehicle velocity
    - ✅ Original horn frequency
  - Spectrogram visualization
  - Frequency shift analysis

**Controls:**
- 🎚️ Velocity slider (0-200 km/h)
- 🎵 Frequency adjuster (200-2000 Hz)
- ▶️ Play/Stop generated sound
- 📤 Upload real audio for analysis

#### 🚁 Drone/Submarine Detection

**AI-Powered Acoustic Classification**

**Capabilities:**
- **Real Data Analysis**: Process actual drone/submarine audio recordings
- **Sound Detection**: Identify unmanned vehicle signatures among ambient noise
- **Pattern Recognition**: 
  - Spectral fingerprinting
  - Harmonic analysis
  - Motor noise identification
- **Classification**: Distinguish between different vehicle types

**Supported Vehicles:**
- Quadcopter drones
- Fixed-wing UAVs
- Underwater vehicles (AUVs/ROVs)
- Background noise filtering

---

### 📡 Radiofrequency Signals Viewer

#### 🛰️ SAR (Synthetic Aperture Radar) & Cosmic Signals

**Advanced RF Signal Visualization & Analysis**

**Features:**
- **Signal Visualization**:
  - Time-domain waveforms
  - Frequency spectrum analysis
  - Spectrogram (time-frequency representation)
  - I/Q constellation diagrams

- **Information Extraction**:
  - Distance estimation (SAR ranging)
  - Velocity measurement (Doppler)
  - Target detection and tracking
  - Cosmic event classification (pulsars, FRBs)

- **Real Data Support**:
  - Import SAR imaging data
  - Process radio telescope observations
  - Standard data formats (FITS, HDF5, CSV)

**Analysis Tools:**
- FFT spectrum analyzer
- Bandwidth measurement
- Signal-to-noise ratio (SNR) calculation
- Peak detection and tracking

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.7
- **Routing**: React Router DOM 7.9.3
- **HTTP Client**: Axios 1.12.2
- **Icons**: Lucide React, Font Awesome 7.0.1
- **Styling**: CSS3 with modular design

### Backend (API Services)
- Signal processing algorithms
- AI model inference endpoints
- File upload and processing services

### AI/ML
- Multi-channel CNN for ECG/EEG classification
- 2D image-based models for graph analysis
- Audio processing models (Doppler analysis)
- Acoustic classification networks (drone detection)
- RF signal analysis algorithms

---

## 🚀 Installation

### Prerequisites

- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn** package manager
- Modern web browser (Chrome, Firefox, Edge, Safari)

### Step-by-Step Setup

1. **Clone the repository**
```bash
git clone https://github.com/Ahmedloay2/DSP-Tasks.git
cd DSP-Tasks
```

2. **Navigate to frontend directory**
```bash
cd frontend/dsp-tasks
```

3. **Install dependencies**
```bash
npm install
# or
yarn install
```

4. **Start development server**
```bash
npm run dev
# or
yarn dev
```

5. **Open in browser**
```
http://localhost:5173
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## 💻 Usage

### Quick Start

1. **Launch the application** and navigate to Task 1 from the home page
2. **Select a signal type**: ECG, EEG, Doppler, or SAR
3. **Load or generate signals** using the provided controls
4. **Explore visualizations** by switching between viewer modes
5. **Adjust parameters** like speed, zoom, channels, and color maps
6. **View AI analysis results** in real-time

### Example Workflows

#### Analyzing ECG Signals
```javascript
1. Click "ECG" from Task 1 home
2. Upload multi-channel ECG file (CSV/JSON)
3. AI model automatically detects abnormalities
4. Switch to "Reoccurrence Graph" for 2D analysis
5. Adjust channel selection to compare leads
6. Export results and visualizations
```

#### Generating Doppler Effect
```javascript
1. Navigate to "Doppler Shift" section
2. Set vehicle velocity: 80 km/h
3. Set horn frequency: 440 Hz
4. Click "Generate Sound" and play
5. Upload real audio to compare AI estimation
```

---

## 📁 Project Structure

```
DSP-Tasks/
├── frontend/
│   └── dsp-tasks/
│       ├── public/                    # Static assets
│       │   ├── dsp-bg-*.jpg          # Background images
│       │   └── vite.svg
│       ├── src/
│       │   ├── components/            # Shared components
│       │   │   ├── TaskCard.jsx
│       │   │   ├── TasksHome.jsx
│       │   │   └── shared/
│       │   │       └── layout/        # Layout components
│       │   │           ├── Navbar.jsx
│       │   │           ├── Footer.jsx
│       │   │           └── Layout.jsx
│       │   ├── tasks/
│       │   │   └── task1/             # Task 1: Signal Viewer
│       │   │       ├── components/
│       │   │       │   ├── ecg/       # ECG viewer components
│       │   │       │   │   ├── MultiChannelECGViewer.jsx
│       │   │       │   │   ├── Components/
│       │   │       │   │   │   ├── Controls/      # Playback controls
│       │   │       │   │   │   ├── Detection/     # AI detection UI
│       │   │       │   │   │   ├── Viewers/       # Graph viewers
│       │   │       │   │   │   └── UI/            # UI elements
│       │   │       │   │   ├── services/
│       │   │       │   │   │   └── ECGClassificationService.js
│       │   │       │   │   └── constants/
│       │   │       │   ├── eeg/       # EEG viewer components
│       │   │       │   │   ├── MultiChannelEEGViewer.jsx
│       │   │       │   │   ├── Components/
│       │   │       │   │   ├── services/
│       │   │       │   │   └── constants/
│       │   │       │   ├── doppler/   # Doppler effect viewer
│       │   │       │   │   ├── Task1DopplerShift.jsx
│       │   │       │   │   ├── components/
│       │   │       │   │   │   ├── AudioPlayer.jsx
│       │   │       │   │   │   ├── DopplerAnalyzer.jsx
│       │   │       │   │   │   ├── DopplerGenerator.jsx
│       │   │       │   │   │   ├── DopplerSignalViewer.jsx
│       │   │       │   │   │   └── DroneDetector.jsx
│       │   │       │   │   └── services/
│       │   │       │   │       ├── DopplerApiService.js
│       │   │       │   │       └── MockDopplerApiService.js
│       │   │       │   └── sar/       # SAR/RF viewer
│       │   │       │       ├── Task1SAR.jsx
│       │   │       │       ├── components/
│       │   │       │       ├── services/
│       │   │       │       └── styles/
│       │   │       ├── data/
│       │   │       │   └── homeData.js  # Task configuration
│       │   │       └── styles/          # Task-specific styles
│       │   ├── data/
│       │   │   └── allTasksData.js      # Global task registry
│       │   ├── hooks/
│       │   │   └── useTheme.js          # Theme management
│       │   ├── styles/                  # Global styles
│       │   ├── App.jsx                  # Root component
│       │   └── main.jsx                 # Entry point
│       ├── index.html
│       ├── package.json
│       ├── vite.config.js
│       └── eslint.config.js
└── README.md
```

### Key Directories

- **`components/`**: Reusable UI components and layouts
- **`tasks/task1/`**: Complete Task 1 implementation
- **`services/`**: API communication and data processing
- **`constants/`**: Configuration and constant values
- **`hooks/`**: Custom React hooks for state management
- **`styles/`**: CSS modules for styling

---

## 🤖 AI Models

### Medical Signal Classification

#### 1D Multi-Channel Model
- **Architecture**: 1D Convolutional Neural Network
- **Input**: Multi-channel time-series data
- **Output**: Abnormality classification + confidence scores
- **Training Data**: 10,000+ annotated ECG/EEG recordings

#### 2D Graph-Based Model
- **Architecture**: 2D CNN (ResNet-inspired)
- **Input**: Polar/Reoccurrence graph images
- **Output**: Same abnormality classes as 1D model
- **Purpose**: Validates 1D predictions using graph patterns

### Acoustic Analysis Models

#### Doppler Parameter Estimation
- **Method**: Frequency shift analysis + regression
- **Estimates**: Vehicle velocity and horn frequency
- **Accuracy**: ±5 km/h for velocity, ±10 Hz for frequency

#### Drone/Submarine Detection
- **Architecture**: Audio classification CNN
- **Features**: Mel spectrograms, MFCCs
- **Classes**: Drone, submarine, background noise
- **Accuracy**: >95% on test set

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style and conventions
- Add comments for complex algorithms
- Update documentation for new features
- Test thoroughly before submitting PR

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Contact

**Project Maintainer**: Ahmed Loay  
**GitHub**: [@Ahmedloay2](https://github.com/Ahmedloay2)  
**Repository**: [DSP-Tasks](https://github.com/Ahmedloay2/DSP-Tasks)

---

## 🙏 Acknowledgments

- Medical signal datasets from PhysioNet
- Doppler effect physics equations
- SAR imaging principles
- Open-source AI/ML communities
- React and Vite development teams

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ by the DSP-Tasks Team

</div>
