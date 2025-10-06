import React, { useMemo } from 'react';
import { CHANNEL_CONFIG, CHANNEL_NAMES } from '../../constants/MultiChannelConfig';
import './ChannelSelector.css';

/**
 * ChannelSelector Component
 * Allows users to select/deselect individual EEG channels with optional selection limit
 * Supports dynamic number of channels
 * @param {Object} selectedChannels - Object mapping channel IDs to boolean selection state
 * @param {Function} onChannelToggle - Callback when a channel is toggled
 * @param {Function} onToggleAll - Callback to select/deselect all channels
 * @param {Array<string>} channelNames - Array of channel IDs (e.g., ['ch1', 'ch2', ...])
 * @param {Object} channelMetadata - Metadata with channel names from API
 * @param {number} maxSelection - Maximum number of channels that can be selected (optional)
 * @param {Array<string>} selectionOrder - Array of channel IDs in order of selection (optional, for showing X/Y labels)
 */
const ChannelSelector = ({ 
  selectedChannels, 
  onChannelToggle, 
  onToggleAll,
  channelNames = CHANNEL_NAMES,
  channelMetadata = null,
  maxSelection = null, // null = unlimited, 1 = single selection, 2 = dual selection, etc.
  selectionOrder = [] // For tracking order of selection (used in Recurrence for X/Y)
}) => {
  // Generate dynamic channel config for channels not in static config
  const getChannelConfig = useMemo(() => {
    const colors = [
      'var(--signal-primary)',
      'var(--signal-secondary)',
      'var(--signal-tertiary)',
      'var(--signal-quaternary)',
      'var(--signal-accent)',
      'var(--signal-info)',
      'var(--signal-pink)',
      'var(--primary)',
      'var(--success)',
      'var(--warning)',
      'var(--signal-neutral)',
      'var(--error)'
    ];
    
    return (channelId, index) => {
      // If channel exists in static config, use it
      if (CHANNEL_CONFIG[channelId]) {
        return CHANNEL_CONFIG[channelId];
      }
      
      // Generate dynamic config
      const colorIndex = index % colors.length;
      const channelNumber = parseInt(channelId.replace('ch', ''));
      const apiChannelName = channelMetadata?.channelNames?.[channelNumber - 1];
      
      return {
        name: apiChannelName || `CH${channelNumber}`,
        region: 'Unknown',
        color: colors[colorIndex],
        enabled: true
      };
    };
  }, [channelMetadata]);

  const selectedCount = Object.values(selectedChannels).filter(Boolean).length;
  const allSelected = channelNames.every(ch => selectedChannels[ch]);
  const noneSelected = channelNames.every(ch => !selectedChannels[ch]);
  const totalChannels = channelNames.length;

  const handleSelectAll = () => {
    // Only allow select all if no limit or limit >= totalChannels
    if (!maxSelection || maxSelection >= totalChannels) {
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
            ({selectedCount}/{maxSelection || totalChannels})
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
        {channelNames.map((channelId, index) => {
          const config = getChannelConfig(channelId, index);
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
