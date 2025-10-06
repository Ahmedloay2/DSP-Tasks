import React from 'react';
import { PLAYBACK_SPEEDS } from '../../constants/MultiChannelConfig';
import './TimeControlPanel.css';

/**
 * TimeControlPanel Component
 * Controls for playback, speed, zoom, and time navigation
 */
const TimeControlPanel = ({
  isPlaying,
  currentTime,
  duration,
  playbackSpeed,
  zoomLevel,
  onPlayPause,
  onStop,
  onSpeedChange,
  onZoomIn,
  onZoomOut,
  onSeek,
  onPanLeft,
  onPanRight,
  showZoom = false // Only show zoom for Continuous viewer
}) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="time-control-panel">
      {/* Playback Controls */}
      <div className="playback-controls">
        <button
          className="control-btn play-pause-btn"
          onClick={onPlayPause}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          className="control-btn stop-btn"
          onClick={onStop}
          title="Stop"
        >
          ⏹
        </button>

        {/* Speed Control */}
        <div className="speed-control"
        style={{ background: 'var(--bg-tertiary)' }}>
          <label className="control-label">Speed:</label>
          <div className="speed-buttons">
            {PLAYBACK_SPEEDS.map(speed => (
              <button
                key={speed}
                className={`speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
                onClick={() => onSpeedChange(speed)}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Time Display and Seek Bar */}
      <div className="time-display-section">
        <div className="time-labels">
          <span className="current-time">{formatTime(currentTime)}</span>
          <span className="duration-time">{formatTime(duration)}</span>
        </div>
        <div className="seek-bar-container">
          <input
            type="range"
            className="seek-bar"
            min={0}
            max={duration}
            step={0.1}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
          />
          <div 
            className="seek-progress"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="navigation-controls">
        <button
          className="nav-btn"
          onClick={onPanLeft}
          title="Pan Left"
        >
          ⏮
        </button>
        <button
          className="nav-btn"
          onClick={onPanRight}
          title="Pan Right"
        >
          ⏭
        </button>
        
        {/* Zoom Controls - Only for Continuous viewer */}
        {showZoom && (
          <div className="zoom-control">
            <label className="control-label">Zoom:</label>
            <button
              className="zoom-btn"
              onClick={onZoomOut}
              title="Zoom Out"
            >
              −
            </button>
            <span className="zoom-level">{zoomLevel.toFixed(1)}x</span>
            <button
              className="zoom-btn"
              onClick={onZoomIn}
              title="Zoom In"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeControlPanel;
