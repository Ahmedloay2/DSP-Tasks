import React, { useState, useCallback } from 'react';
import { CHANNEL_NAMES } from '../../constants/MultiChannelConfig';
import MockECGService from '../../services/MockECGService';
import ContinuousViewer from '../Viewers/ContinuousViewer';
import ChannelSelector from '../Controls/ChannelSelector';
import TimeControlPanel from '../Controls/TimeControlPanel';
import './ResamplingSection.css';

/**
 * ResamplingSection Component
 * Allows user to resample ECG signal and view aliasing effects
 * Uses ContinuousViewer for consistent visualization
 * Supports both Real API and Mock API modes
 */
const ResamplingSection = ({ recordName, apiMode = 'mock' }) => {
  const [resamplingFreq, setResamplingFreq] = useState(500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resampledData, setResampledData] = useState(null);

  // Playback state (for ContinuousViewer)
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Channel selection state
  const [selectedChannels, setSelectedChannels] = useState(() => {
    const initial = {};
    CHANNEL_NAMES.forEach(ch => {
      initial[ch] = true; // All channels selected by default
    });
    return initial;
  });

  const handleFrequencyChange = (e) => {
    setResamplingFreq(Number(e.target.value));
  };

  const handleResample = async () => {
    setLoading(true);
    setError(null);

    try {
      if (apiMode === 'real') {
        // Real API call
        const response = await fetch(`/api/resample/ecg/${recordName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetFrequency: resamplingFreq
          })
        });

        if (!response.ok) {
          throw new Error('Real API resampling failed');
        }

        const resampledData = await response.json();
        setResampledData(resampledData);
      } else {
        // Mock API mode - simulate delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Use MockECGService for consistent mock data
        const mockResampledData = MockECGService.generateSampledSignal(resamplingFreq, 10);
        setResampledData(mockResampledData);
      }

      setIsPlaying(false);
    } catch (err) {
      setError(`Failed to resample: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleSpeedChange = useCallback((speed) => {
    setPlaybackSpeed(speed);
  }, []);

  const handleZoomChange = useCallback((zoom) => {
    setZoomLevel(zoom);
  }, []);

  const handleChannelToggle = useCallback((channelId) => {
    setSelectedChannels(prev => ({
      ...prev,
      [channelId]: !prev[channelId]
    }));
  }, []);

  // Don't render if there's no valid record name (similar to MultiChannelViewer)
  if (!recordName) {
    return null;
  }

  return (
    <div className="task2-resampling-section-container">
      <div className="task2-resampling-header">
        <h4 className="task2-resampling-title">
          <span className="task2-icon">🔄</span>
          Signal Resampling & Aliasing Analysis
        </h4>
        <p className="task2-resampling-description">
          Adjust the sampling frequency to observe aliasing effects on the ECG signal
        </p>
      </div>

      {/* Frequency Control */}
      <div className="task2-resampling-controls">
        <div className="task2-frequency-control-group">
          <label className="task2-frequency-label">
            Resampling Frequency: <span className="task2-frequency-value">{resamplingFreq} Hz</span>
          </label>
          <div className="task2-frequency-slider-container">
            <span className="task2-slider-limit">0 Hz</span>
            <input
              type="range"
              min="0"
              max="1000"
              step="10"
              value={resamplingFreq}
              onChange={handleFrequencyChange}
              className="task2-frequency-slider"
              disabled={loading}
            />
            <span className="task2-slider-limit">1000 Hz</span>
          </div>
          <div className="task2-frequency-presets">
            <button onClick={() => setResamplingFreq(100)} className="task2-preset-btn">100 Hz</button>
            <button onClick={() => setResamplingFreq(250)} className="task2-preset-btn">250 Hz</button>
            <button onClick={() => setResamplingFreq(500)} className="task2-preset-btn task2-active">500 Hz</button>
            <button onClick={() => setResamplingFreq(1000)} className="task2-preset-btn">1000 Hz</button>
          </div>
        </div>

        <button
          onClick={handleResample}
          disabled={loading || !recordName}
          className="task2-resample-btn"
        >
          {loading ? (
            <>
              <div className="task2-btn-spinner"></div>
              Resampling...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,4V1L8,5L12,9V6A6,6 0 0,1 18,12C18,13.57 17.35,15 16.24,16L17.66,17.41C19.18,15.91 20,13.91 20,12A8,8 0 0,0 12,4M12,18A6,6 0 0,1 6,12C6,10.43 6.65,9 7.76,8L6.34,6.59C4.82,8.09 4,10.09 4,12A8,8 0 0,0 12,20V23L16,19L12,15V18Z"/>
              </svg>
              Apply Resampling
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="task2-resampling-error">
          <span className="task2-error-icon">⚠️</span>
          <span className="task2-error-text">{error}</span>
        </div>
      )}

      {/* Resampled Signal Viewer - Using ContinuousViewer */}
      {resampledData && (
        <div className="task2-resampled-viewer-container">
          {/* Channel Selector */}
          <ChannelSelector
            selectedChannels={selectedChannels}
            onChannelToggle={handleChannelToggle}
          />

          {/* Continuous Viewer */}
          <div className="task2-continuous-viewer-wrapper">
            <ContinuousViewer
              channels={resampledData.channels}
              selectedChannels={selectedChannels}
              samplingRate={resampledData.metadata.samplingRate}
              zoomLevel={zoomLevel}
              isPlaying={isPlaying}
            />
          </div>

          {/* Time Control Panel */}
          <TimeControlPanel
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onStop={handleStop}
            playbackSpeed={playbackSpeed}
            onSpeedChange={handleSpeedChange}
            zoomLevel={zoomLevel}
            onZoomChange={handleZoomChange}
            duration={resampledData.metadata.duration}
            samplingRate={resampledData.metadata.samplingRate}
          />

          <div className="task2-aliasing-info">
            {resamplingFreq < 250 && (
              <div className="task2-aliasing-warning">
                <span className="task2-warning-icon">⚠️</span>
                <div className="task2-warning-content">
                  <strong>Undersampling Detected</strong>
                  <p>Sampling frequency ({resamplingFreq} Hz) is below the Nyquist rate for typical ECG signals. Aliasing effects may distort the signal representation.</p>
                </div>
              </div>
            )}
            {resamplingFreq >= 250 && resamplingFreq < 500 && (
              <div className="task2-aliasing-info-box">
                <span className="task2-info-icon">ℹ️</span>
                <strong>Adequate Sampling</strong> - Signal is captured with sufficient detail for most analysis.
              </div>
            )}
            {resamplingFreq >= 500 && (
              <div className="task2-aliasing-success">
                <span className="task2-success-icon">✓</span>
                <strong>Optimal Sampling</strong> - High-quality signal capture with excellent detail preservation.
              </div>
            )}
          </div>
        </div>
      )}

      {!resampledData && !loading && (
        <div className="task2-no-resampled-data">
          <p>Click "Apply Resampling" to generate resampled signal and view aliasing effects</p>
        </div>
      )}
    </div>
  );
};

export default ResamplingSection;

