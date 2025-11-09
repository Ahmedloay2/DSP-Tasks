/**
 * All Tasks Data Configuration
 * 
 * Defines all available DSP tasks for the main landing page.
 * Each task represents a different signal processing implementation.
 */

export const allTasksData = [
  {
    id: 'task1',
    title: 'Signal Viewer',
    language: 'python',
    path: '/task1',
    features: [
      'Signal viewer for ECG',
      'Signal viewer for EEG', 
      'Signal viewer for Doppler Shift',
      'Signal viewer for SAR'
    ]
  },
  {
    id: 'task2',
    title: 'Sampling & Aliasing',
    language: 'python',
    path: '/task2',
    features: [
      'ECG signal with sampling control',
      'EEG signal with frequency adjustment',
      'Speech recognition & processing',
      'Doppler shift analysis',
      'SAR image analysis'
    ]
  },
  {
    id: 'task3',
    title: 'Signal Equalizer',
    language: 'python',
    path: '/task3',
    features: [
      'Generic frequency equalizer',
      'Musical instruments separation',
      'Animal sounds mixing',
      'Human voice control',
      'Real-time spectrogram display'
    ]
  }
];

export default allTasksData;