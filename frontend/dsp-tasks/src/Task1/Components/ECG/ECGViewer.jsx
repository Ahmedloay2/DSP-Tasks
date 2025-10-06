import React, { useState } from 'react';
import ECGSignalViewer from './Components/Core/ECGSignalViewer';
import ECGEnhancedTabs from './Components/EnhancedVisualization/ECGEnhancedTabs';
import './ECGViewer.css';

/**
 * ECGViewer - Main component with clean architecture
 * Provides two visualization modes:
 * 1. Traditional ECG Signal Viewer with scroll enhancement
 * 2. Enhanced Analysis with Polar and Recurrence plots
 */
const ECGViewer = ({ 
  sessionId,
  metadata, 
  isPlaying, 
  currentPosition,
  visibleLeads,
  leadMode,
  showLegend = false,
  liveStreamData = null,
  onLeadToggle,
  leadControls = null
}) => {
  const [activeMode, setActiveMode] = useState('traditional');

  const viewModes = [
    {
      id: 'traditional',
      title: 'ECG Signals',
      description: 'Traditional multi-lead display',
      icon: '📊'
    },
    {
      id: 'enhanced',
      title: 'Advanced Analysis',
      description: 'Polar & Recurrence plots',
      icon: '🔬'
    }
  ];

  const renderContent = () => {
    const commonProps = {
      sessionId,
      metadata,
      isPlaying,
      currentPosition,
      visibleLeads,
      leadMode,
      showLegend,
      liveStreamData
    };

    switch (activeMode) {
      case 'enhanced':
        return (
          <ECGEnhancedTabs
            ecgData={null} // Component loads its own data
            visibleLeads={visibleLeads}
            leadMode={leadMode}
            metadata={metadata}
            isPlaying={isPlaying}
            currentPosition={currentPosition}
            isLiveMode={liveStreamData !== null}
            liveStreamData={liveStreamData}
            onLeadToggle={onLeadToggle}
            leadControls={leadControls}
          />
        );
      case 'traditional':
      default:
        return <ECGSignalViewer {...commonProps} />;
    }
  };

  return (
    <div className="ecg-viewer">
      {/* Mode Selection Tabs */}
      <div className="ecg-viewer-header">
        <div className="mode-tabs">
          {viewModes.map(mode => (
            <button
              key={mode.id}
              className={`mode-tab ${activeMode === mode.id ? 'active' : ''}`}
              onClick={() => setActiveMode(mode.id)}
              title={mode.description}
            >
              <span className="mode-icon">{mode.icon}</span>
              <span className="mode-title">{mode.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="ecg-viewer-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default ECGViewer;