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
    <div className="task2-time-control-panel">
      {/* Playback Controls */}
      <div className="task2-playback-controls">
        <button
          className="task2-control-btn task2-play-pause-btn"
          onClick={onPlayPause}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          className="task2-control-btn task2-stop-btn"
          onClick={onStop}
          title="Stop"
        >
          ⏹
        </button>

        {/* Speed Control */}
        <div className="task2-speed-control"
        style={{ background: 'var(--bg-tertiary)' }}>
          <label className="task2-control-label">Speed:</label>
          <div className="task2-speed-buttons">
            {PLAYBACK_SPEEDS.map(speed => (
              <button
                key={speed}
                className={`task2-speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
                onClick={() => onSpeedChange(speed)}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Time Display and Seek Bar */}
      <div className="task2-time-display-section">
        <div className="task2-time-labels">
          <span className="task2-current-time">{formatTime(currentTime)}</span>
          <span className="task2-duration-time">{formatTime(duration)}</span>
        </div>
        <div className="task2-seek-bar-container">
          <input
            type="range"
            className="task2-seek-bar"
            min={0}
            max={duration}
            step={0.1}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
          />
          <div 
            className="task2-seek-progress"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="task2-navigation-controls">
        <button
          className="task2-nav-btn"
          onClick={onPanLeft}
          title="Pan Left"
        >
          ⏮
        </button>
        <button
          className="task2-nav-btn"
          onClick={onPanRight}
          title="Pan Right"
        >
          ⏭
        </button>
        
        {/* Zoom Controls - Only for Continuous viewer */}
        {showZoom && (
          <div className="task2-zoom-control">
            <label className="task2-control-label">Zoom:</label>
            <button
              className="task2-zoom-btn"
              onClick={onZoomOut}
              title="Zoom Out"
            >
              −
            </button>
            <span className="task2-zoom-level">{zoomLevel.toFixed(1)}x</span>
            <button
              className="task2-zoom-btn"
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
