// ECG Components - Clean Architecture Index
// This file provides clean imports for all ECG components

// Core Components
export { default as ECGSignalViewer } from './Components/Core/ECGSignalViewer';

// Control Components  
export { default as ECGPlaybackControls } from './Components/Controls/ECGPlaybackControls';
export { default as ECGLeadControls } from './Components/Controls/ECGLeadControls';

// Enhanced Visualization Components
export { default as ECGEnhancedTabs } from './Components/EnhancedVisualization/ECGEnhancedTabs';
export { default as PolarVisualization } from './Components/EnhancedVisualization/PolarVisualization';
export { default as RecurrenceVisualization } from './Components/EnhancedVisualization/RecurrenceVisualization';

// Main ECG Viewer
export { default as ECGViewer } from './ECGViewer';

// Services
export { default as ECGApiService } from './services/ECGApiService';
export { MockECGDataService } from './services/MockECGApiService';

// Constants
export * from './constants/ECGConstants';