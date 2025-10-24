// View mode constants for ECG Signal Viewer
export const VIEW_MODES = {
  ORIGINAL: 'original',
  POLAR: 'polar',
  RECURRENCE: 'recurrence'
};

// Standard ECG lead positions in polar coordinates (degrees)
export const LEAD_ANGLES = {
  'I': 0,
  'II': 60,
  'III': 120,
  'aVR': -150,
  'aVL': -30,
  'aVF': 90,
  'V1': 115,
  'V2': 90,
  'V3': 85,
  'V4': 45,
  'V5': 30,
  'V6': 0
};

// Lead configurations (copied from ECGSignalViewer.jsx)
export const LEAD_CONFIGURATIONS = {
  '3_lead': ['I', 'II', 'III'],
  '12_lead': ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6']
};

// Lead colors (copied from ECGSignalViewer.jsx)
export const LEAD_COLORS = {
  'I': '#FF6B6B',     // Red
  'II': '#4ECDC4',    // Teal
  'III': '#45B7D1',   // Blue
  'aVR': '#96CEB4',   // Light green
  'aVL': '#FFEAA7',   // Yellow
  'aVF': '#DDA0DD',   // Plum
  'V1': '#98D8C8',    // Mint
  'V2': '#F7DC6F',    // Light yellow
  'V3': '#BB8FCE',    // Light purple
  'V4': '#85C1E9',    // Light blue
  'V5': '#F8C471',    // Orange
  'V6': '#82E0AA'     // Light green
};
