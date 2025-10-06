import React, { useState } from 'react';
import './ECGEnhancedTabs.css';
import PolarVisualization from './PolarVisualization';
import RecurrenceVisualization from './RecurrenceVisualization';

const ECGEnhancedTabs = ({ 
  ecgData, 
  visibleLeads, 
  leadMode, 
  metadata, 
  isPlaying, 
  currentPosition, 
  isLiveMode,
  liveStreamData,
  onLeadToggle,
  leadControls = null
}) => {
  const [activeTab, setActiveTab] = useState('polar');

  const tabs = [
    {
      id: 'polar',
      title: 'Polar Graph',
      description: 'Vectorcardiogram View',
      icon: '🎯'
    },
    {
      id: 'recurrence',
      title: 'Recurrence Plot',
      description: 'Pattern Analysis',
      icon: '🔄'
    }
  ];

  const renderContent = () => {
    const commonProps = {
      ecgData,
      visibleLeads,
      leadMode,
      metadata,
      isPlaying,
      currentPosition,
      isLiveMode,
      liveStreamData,
      onLeadToggle
    };

    switch (activeTab) {
      case 'polar':
        return <PolarVisualization {...commonProps} />;
      case 'recurrence':
        return <RecurrenceVisualization {...commonProps} />;
      default:
        return <PolarVisualization {...commonProps} />;
    }
  };

  return (
    <div className="ecg-enhanced-tabs">
      <div className="enhanced-tabs-container">
        <div className="enhanced-tabs-header">
          <h3>Enhanced ECG Visualization</h3>
          <p>Advanced analysis and visualization modes</p>
        </div>
        
        <div className="enhanced-tabs-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`enhanced-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <div className="tab-content">
                <span className="tab-title">{tab.title}</span>
                <span className="tab-description">{tab.description}</span>
              </div>
            </button>
          ))}
        </div>
        
        {/* Lead Controls - show active leads like normal viewer */}
        {leadControls && (
          <div className="enhanced-lead-controls">
            {leadControls}
          </div>
        )}
      </div>

      <div className="enhanced-tabs-content-container">
        <div className="enhanced-tabs-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ECGEnhancedTabs;