import React, { useState, useCallback, useEffect } from 'react';
import './ECGPlaybackControls.css';

const ECGPlaybackControls = ({
  isPlaying,
  currentPosition,
  duration,
  onPlay,
  onPause,
  onStop,
  onSeek,
  showShortcuts = true
}) => {
  const [isDragging, setIsDragging] = useState(false);

  // Keyboard shortcuts handler
  useEffect(() => {
    if (!showShortcuts) return;
    
    const handleKeyDown = (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') {
        return; // Don't interfere with form inputs
      }
      
      switch (event.code) {
        case 'Space':
          event.preventDefault();
          if (isPlaying) {
            onPause();
          } else {
            onPlay();
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          onSeek(Math.max(0, currentPosition - duration * 0.05)); // Seek back 5%
          break;
        case 'ArrowRight':
          event.preventDefault();
          onSeek(Math.min(duration, currentPosition + duration * 0.05)); // Seek forward 5%
          break;
        default:
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showShortcuts, isPlaying, onPlay, onPause, onSeek, currentPosition, duration]);

  // Format time display
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Handle play/pause toggle
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  }, [isPlaying, onPlay, onPause]);

  // Handle timeline scrubbing
  const handleTimelineClick = useCallback((event) => {
    const timeline = event.currentTarget;
    const rect = timeline.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newPosition = Math.max(0, Math.min(duration, percentage * duration));
    onSeek(newPosition);
  }, [duration, onSeek]);

  // Handle timeline drag
  const handleTimelineDrag = useCallback((event) => {
    if (!isDragging) return;
    
    const timeline = event.currentTarget;
    const rect = timeline.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newPosition = percentage * duration;
    onSeek(newPosition);
  }, [isDragging, duration, onSeek]);



  const currentTime = formatTime(currentPosition / 250); // Assuming 250Hz sampling rate
  const totalTime = formatTime(duration / 250);
  const progressPercentage = duration > 0 ? (currentPosition / duration) * 100 : 0;

  return (
    <div className="ecg-playback-controls">
      <div className="playback-main-controls">
        {/* Stop Button */}
        <button
          className="control-btn stop-btn"
          onClick={onStop}
          title="Stop"
          aria-label="Stop playback"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="4" y="4" width="16" height="16" rx="2"/>
          </svg>
        </button>

        {/* Play/Pause Button */}
        <button
          className={`control-btn play-pause-btn ${isPlaying ? 'playing' : 'paused'}`}
          onClick={handlePlayPause}
          title={isPlaying ? 'Pause' : 'Play'}
          aria-label={isPlaying ? 'Pause playback' : 'Play recording'}
        >
          {isPlaying ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"/>
              <rect x="14" y="4" width="4" height="16"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          )}
        </button>

        {/* Time Display */}
        <div className="time-display">
          <span className="current-time">{currentTime}</span>
          <span className="time-separator">/</span>
          <span className="total-time">{totalTime}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="timeline-container">
        <div
          className="timeline"
          onClick={handleTimelineClick}
          onMouseDown={() => setIsDragging(true)}
          onMouseMove={handleTimelineDrag}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          role="slider"
          aria-label="Playback timeline"
          aria-valuemin="0"
          aria-valuemax={duration}
          aria-valuenow={currentPosition}
        >
          <div className="timeline-track">
            <div
              className="timeline-progress"
              style={{ width: `${progressPercentage}%` }}
            />
            <div
              className="timeline-handle"
              style={{ left: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Waveform Info */}
      <div className="waveform-info">
        <span className="sample-rate">500 Hz</span>
        <span className="position-indicator">
          Position: {Math.floor(currentPosition).toLocaleString()} samples
        </span>
      </div>

      {/* Keyboard Shortcuts Info - Only show if enabled */}
      {showShortcuts && (
        <div className="shortcuts-info">
          <div className="shortcuts-title">Keyboard Shortcuts:</div>
          <div className="shortcuts-list">
            <span className="shortcut"><kbd>Space</kbd> Play/Pause</span>
            <span className="shortcut"><kbd>←→</kbd> Seek</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ECGPlaybackControls;