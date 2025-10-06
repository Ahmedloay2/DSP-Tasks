import React, { useCallback } from 'react';
import './ECGLeadControls.css';

// Lead configurations (moved outside component to avoid dependency issues)
const LEAD_CONFIGURATIONS = {
  '3_lead': ['I', 'II', 'III'],
  '12_lead': ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6']
};

const ECGLeadControls = ({
  leadMode, // '3_lead' or '12_lead'
  visibleLeads,
  onLeadVisibilityChange,
  onModeChange,
  isPlaying,
  playbackState, // To track pause/resume state per lead
  individualToggle = false, // Whether to show individual toggles or bulk controls
  compactMode = false // Whether to show compact version
}) => {

  const leadColors = {
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

  // Lead groupings for better organization
  const leadGroups = {
    'Limb Leads': ['I', 'II', 'III'],
    'Augmented Leads': ['aVR', 'aVL', 'aVF'],
    'Chest Leads': ['V1', 'V2', 'V3', 'V4', 'V5', 'V6']
  };

  const currentLeads = LEAD_CONFIGURATIONS[leadMode];

  // Handle lead visibility toggle
  const handleLeadToggle = useCallback((leadName) => {
    const newVisibleLeads = {
      ...visibleLeads,
      [leadName]: !visibleLeads[leadName]
    };
    onLeadVisibilityChange(newVisibleLeads);
  }, [visibleLeads, onLeadVisibilityChange]);

  // Handle show/hide all leads
  const handleShowAllLeads = useCallback(() => {
    const allVisible = {};
    currentLeads.forEach(lead => {
      allVisible[lead] = true;
    });
    onLeadVisibilityChange(allVisible);
  }, [currentLeads, onLeadVisibilityChange]);

  const handleHideAllLeads = useCallback(() => {
    const allHidden = {};
    currentLeads.forEach(lead => {
      allHidden[lead] = false;
    });
    onLeadVisibilityChange(allHidden);
  }, [currentLeads, onLeadVisibilityChange]);

  // Toggle single lead
  const handleSingleLeadToggle = useCallback((lead) => {
    const newVisibleLeads = {
      ...visibleLeads,
      [lead]: !visibleLeads[lead]
    };
    onLeadVisibilityChange(newVisibleLeads);
  }, [visibleLeads, onLeadVisibilityChange]);

  // Handle mode change
  const handleModeChange = useCallback((newMode) => {
    onModeChange(newMode);
    
    // Reset visibility for new mode
    const newLeads = LEAD_CONFIGURATIONS[newMode];
    const newVisibleLeads = {};
    newLeads.forEach(lead => {
      newVisibleLeads[lead] = true;
    });
    onLeadVisibilityChange(newVisibleLeads);
  }, [onModeChange, onLeadVisibilityChange]);

  // Get visible lead count
  const visibleLeadCount = currentLeads.filter(lead => visibleLeads[lead]).length;

  // Group leads by category for 12-lead display
  const getLeadsByGroup = () => {
    if (leadMode === '3_lead') {
      return { 'Standard Leads': currentLeads };
    }

    const grouped = {};
    Object.entries(leadGroups).forEach(([groupName, groupLeads]) => {
      const leadsInMode = groupLeads.filter(lead => currentLeads.includes(lead));
      if (leadsInMode.length > 0) {
        grouped[groupName] = leadsInMode;
      }
    });
    return grouped;
  };

  // Compact mode rendering
  if (compactMode) {
    return (
      <div className="ecg-lead-controls compact">
        <div className="compact-header">
          <h4>Leads</h4>
          <span className="compact-status">{visibleLeadCount}/{currentLeads.length}</span>
        </div>
        <div className="compact-leads">
          {currentLeads.map(lead => (
            <button
              key={lead}
              className={`compact-lead-btn ${visibleLeads[lead] ? 'visible' : 'hidden'}`}
              onClick={() => handleSingleLeadToggle(lead)}
              title={`${visibleLeads[lead] ? 'Hide' : 'Show'} ${lead}`}
              style={{ 
                borderColor: leadColors[lead],
                color: visibleLeads[lead] ? 'white' : leadColors[lead],
                backgroundColor: visibleLeads[lead] ? leadColors[lead] : 'transparent'
              }}
            >
              {lead}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="ecg-lead-controls">
      {/* Header */}
      <div className="lead-controls-header">
        <h3 className="controls-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7v10c0 5.55 3.84 9.95 9 11 5.16-1.05 9-5.45 9-11V7l-10-5z"/>
          </svg>
          Lead Configuration
        </h3>
        <div className="lead-status">
          {visibleLeadCount} of {currentLeads.length} leads visible
        </div>
      </div>

      {/* Mode Selection */}
      <div className="mode-selection">
        <label className="mode-label">ECG Mode:</label>
        <div className="mode-buttons">
          <button
            className={`mode-btn ${leadMode === '3_lead' ? 'active' : ''}`}
            onClick={() => handleModeChange('3_lead')}
            disabled={isPlaying}
            title={isPlaying ? 'Cannot change mode during playback' : '3-Lead ECG'}
          >
            3-Lead
          </button>
          <button
            className={`mode-btn ${leadMode === '12_lead' ? 'active' : ''}`}
            onClick={() => handleModeChange('12_lead')}
            disabled={isPlaying}
            title={isPlaying ? 'Cannot change mode during playback' : '12-Lead ECG'}
          >
            12-Lead
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button
          className="action-btn show-all"
          onClick={handleShowAllLeads}
          title="Show all leads"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
          Show All
        </button>
        <button
          className="action-btn hide-all"
          onClick={handleHideAllLeads}
          title="Hide all leads"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
          </svg>
          Hide All
        </button>
      </div>

      {/* Lead List */}
      <div className="leads-container">
        {Object.entries(getLeadsByGroup()).map(([groupName, groupLeads]) => (
          <div key={groupName} className="lead-group">
            <div className="group-header">
              <h4 className="group-title">{groupName}</h4>
              <div className="group-stats">
                {groupLeads.filter(lead => visibleLeads[lead]).length}/{groupLeads.length}
              </div>
            </div>
            
            <div className="leads-list">
              {groupLeads.map(lead => (
                <div
                  key={lead}
                  className={`lead-item ${visibleLeads[lead] ? 'visible' : 'hidden'}`}
                >
                  <div className="lead-info">
                    <div
                      className="lead-color-indicator"
                      style={{ backgroundColor: leadColors[lead] }}
                    />
                    <label className="lead-name" htmlFor={`lead-${lead}`}>
                      {lead}
                    </label>
                    {playbackState && playbackState[lead] && (
                      <div className="lead-state-indicator">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16"/>
                          <rect x="14" y="4" width="4" height="16"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {individualToggle ? (
                    <button
                      className={`individual-toggle-btn ${visibleLeads[lead] ? 'visible' : 'hidden'}`}
                      onClick={() => handleSingleLeadToggle(lead)}
                      title={visibleLeads[lead] ? `Hide ${lead}` : `Show ${lead}`}
                    >
                      {visibleLeads[lead] ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                        </svg>
                      )}
                      {visibleLeads[lead] ? 'Hide' : 'Show'}
                    </button>
                  ) : (
                    <label className="toggle-switch">
                      <input
                        id={`lead-${lead}`}
                        type="checkbox"
                        checked={visibleLeads[lead] || false}
                        onChange={() => handleLeadToggle(lead)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Lead Information */}
      <div className="lead-info-panel">
        <div className="info-header">
          <h4>Lead Information</h4>
        </div>
        <div className="info-content">
          <div className="info-item">
            <span className="info-label">Current Mode:</span>
            <span className="info-value">{leadMode.replace('_', '-').toUpperCase()}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Visible Leads:</span>
            <span className="info-value">{visibleLeadCount}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Sampling Rate:</span>
            <span className="info-value">250 Hz</span>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="keyboard-shortcuts">
        <details className="shortcuts-details">
          <summary>Keyboard Shortcuts</summary>
          <div className="shortcuts-list">
            <div className="shortcut-item">
              <kbd>Space</kbd> <span>Play/Pause</span>
            </div>
            <div className="shortcut-item">
              <kbd>S</kbd> <span>Stop</span>
            </div>
            <div className="shortcut-item">
              <kbd>A</kbd> <span>Show All Leads</span>
            </div>
            <div className="shortcut-item">
              <kbd>H</kbd> <span>Hide All Leads</span>
            </div>
            <div className="shortcut-item">
              <kbd>1-9</kbd> <span>Toggle Lead</span>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default ECGLeadControls;