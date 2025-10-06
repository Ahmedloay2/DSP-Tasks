import React from 'react';
import { CHANNEL_CONFIG, CHANNEL_NAMES } from '../../constants/MultiChannelConfig';
import './ChannelSelector.css';

/**
 * ChannelSelector Component
 * Allows users to select/deselect individual ECG channels with optional selection limit
 * @param {Object} selectedChannels - Object mapping channel IDs to boolean selection state
 * @param {Function} onChannelToggle - Callback when a channel is toggled
 * @param {Function} onToggleAll - Callback to select/deselect all channels
 * @param {number} maxSelection - Maximum number of channels that can be selected (optional)
 * @param {Array<string>} selectionOrder - Array of channel IDs in order of selection (optional, for showing X/Y labels)
 */
const ChannelSelector = ({ 
  selectedChannels, 
  onChannelToggle, 
  onToggleAll,
  maxSelection = null, // null = unlimited, 1 = single selection, 2 = dual selection, etc.
  selectionOrder = [] // For tracking order of selection (used in Recurrence for X/Y)
}) => {
  const selectedCount = Object.values(selectedChannels).filter(Boolean).length;
  const allSelected = CHANNEL_NAMES.every(ch => selectedChannels[ch]);
  const noneSelected = CHANNEL_NAMES.every(ch => !selectedChannels[ch]);

  const handleSelectAll = () => {
    // Only allow select all if no limit or limit >= 12
    if (!maxSelection || maxSelection >= 12) {
      onToggleAll(true);
    }
  };

  const handleDeselectAll = () => {
    onToggleAll(false);
  };

  const handleChannelClick = (channelId) => {
    const isCurrentlySelected = selectedChannels[channelId];
    
    // If deselecting, always allow
    if (isCurrentlySelected) {
      onChannelToggle(channelId);
      return;
    }
    
    // If selecting, check limit
    if (maxSelection && selectedCount >= maxSelection) {
      // Don't allow selection beyond limit
      return;
    }
    
    onChannelToggle(channelId);
  };

  // Get label for ordered selection (X-axis, Y-axis, etc.)
  const getSelectionLabel = (channelId) => {
    if (!selectionOrder || selectionOrder.length === 0) return null;
    
    const orderIndex = selectionOrder.indexOf(channelId);
    if (orderIndex === -1) return null;
    
    if (maxSelection === 2) {
      return orderIndex === 0 ? 'X' : 'Y';
    }
    return orderIndex + 1; // Return number for other cases
  };

  return (
    <div className="channel-selector">
      <div className="channel-selector-header">
        <h3 className="channel-selector-title">
          Channel Selection
          <span className="channel-count">
            ({selectedCount}/{maxSelection || 12})
          </span>
        </h3>
        {!maxSelection && (
          <div className="channel-selector-actions">
            <button
              className="channel-action-btn"
              onClick={handleSelectAll}
              disabled={allSelected}
            >
              Select All
            </button>
            <button
              className="channel-action-btn"
              onClick={handleDeselectAll}
              disabled={noneSelected}
            >
              Deselect All
            </button>
          </div>
        )}
        {maxSelection && (
          <div className="selection-hint">
            {maxSelection === 1 && <span className="hint-text">Select 1 channel</span>}
            {maxSelection === 2 && <span className="hint-text">Select 2 channels (X → Y)</span>}
          </div>
        )}
      </div>

      <div className="channel-grid">
        {CHANNEL_NAMES.map(channelId => {
          const config = CHANNEL_CONFIG[channelId];
          const isSelected = selectedChannels[channelId];
          const selectionLabel = getSelectionLabel(channelId);
          const canSelect = !maxSelection || selectedCount < maxSelection || isSelected;

          return (
            <div
              key={channelId}
              className={`channel-item ${isSelected ? 'selected' : ''} ${!canSelect ? 'disabled' : ''}`}
              onClick={() => handleChannelClick(channelId)}
              style={{ cursor: canSelect ? 'pointer' : 'not-allowed' }}
            >
              <div
                className="channel-color-indicator"
                style={{ backgroundColor: config.color }}
              />
              <span className="channel-name">{config.name}</span>
              <div className="channel-checkbox">
                {isSelected && <span className="checkmark">✓</span>}
                {isSelected && selectionLabel && (
                  <span className="selection-label">{selectionLabel}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChannelSelector;
