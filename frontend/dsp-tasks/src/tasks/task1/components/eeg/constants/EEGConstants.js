// View mode constants for EEG Signal Viewer
export const VIEW_MODES = {
  ORIGINAL: 'original',
  POLAR: 'polar',
  RECURRENCE: 'recurrence'
};

// Standard EEG electrode positions (10-20 system) in polar coordinates (degrees)
// Based on the International 10-20 system for electrode placement
export const ELECTRODE_ANGLES = {
  'Fp1': -45,
  'Fp2': 45,
  'F7': -120,
  'F3': -60,
  'Fz': 0,
  'F4': 60,
  'F8': 120,
  'T3': -150,
  'C3': -90,
  'Cz': 0,
  'C4': 90,
  'T4': 150
};

// EEG channel configurations
export const CHANNEL_CONFIGURATIONS = {
  '12_channel': ['Fp1', 'Fp2', 'F7', 'F3', 'Fz', 'F4', 'F8', 'T3', 'C3', 'Cz', 'C4', 'T4'],
  '8_channel': ['Fp1', 'Fp2', 'F3', 'F4', 'C3', 'C4', 'P3', 'P4']
};

// EEG frequency bands (Hz)
export const FREQUENCY_BANDS = {
  DELTA: { min: 0.5, max: 4, name: 'Delta (0.5-4 Hz)', color: '#8B4513' },      // Brown
  THETA: { min: 4, max: 8, name: 'Theta (4-8 Hz)', color: '#9370DB' },         // Purple
  ALPHA: { min: 8, max: 13, name: 'Alpha (8-13 Hz)', color: '#4169E1' },       // Royal Blue
  BETA: { min: 13, max: 30, name: 'Beta (13-30 Hz)', color: '#32CD32' },       // Lime Green
  GAMMA: { min: 30, max: 100, name: 'Gamma (30-100 Hz)', color: '#FF4500' }    // Orange Red
};

// Channel colors optimized for EEG visualization
export const CHANNEL_COLORS = {
  'Fp1': '#FF6B6B',     // Red - Frontal left
  'Fp2': '#4ECDC4',     // Teal - Frontal right
  'F7': '#45B7D1',      // Blue - Frontal left lateral
  'F3': '#96CEB4',      // Light green - Frontal left
  'Fz': '#FFEAA7',      // Yellow - Frontal midline
  'F4': '#DDA0DD',      // Plum - Frontal right
  'F8': '#98D8C8',      // Mint - Frontal right lateral
  'T3': '#F7DC6F',      // Light yellow - Temporal left
  'C3': '#BB8FCE',      // Light purple - Central left
  'Cz': '#85C1E9',      // Light blue - Central midline
  'C4': '#F8C471',      // Orange - Central right
  'T4': '#82E0AA'       // Light green - Temporal right
};

// Brain regions mapped to electrodes
export const BRAIN_REGIONS = {
  FRONTAL: ['Fp1', 'Fp2', 'F7', 'F3', 'Fz', 'F4', 'F8'],
  CENTRAL: ['C3', 'Cz', 'C4'],
  TEMPORAL: ['T3', 'T4'],
  PARIETAL: ['P3', 'Pz', 'P4'],
  OCCIPITAL: ['O1', 'O2']
};

// EEG artifact types
export const ARTIFACT_TYPES = {
  EYE_BLINK: 'Eye Blink',
  MUSCLE: 'Muscle Artifact',
  MOTION: 'Motion Artifact',
  ELECTRICAL: 'Electrical Noise'
};

// Mental states and their associated frequency patterns
export const MENTAL_STATES = {
  RELAXED: { dominantBand: 'ALPHA', description: 'Relaxed, eyes closed' },
  ALERT: { dominantBand: 'BETA', description: 'Alert, focused attention' },
  DROWSY: { dominantBand: 'THETA', description: 'Drowsy, light sleep' },
  DEEP_SLEEP: { dominantBand: 'DELTA', description: 'Deep sleep' },
  ACTIVE_THINKING: { dominantBand: 'GAMMA', description: 'Active cognitive processing' }
};
