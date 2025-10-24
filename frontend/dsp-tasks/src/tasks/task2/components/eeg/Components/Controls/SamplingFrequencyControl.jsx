import React from 'react';
import './SamplingFrequencyControl.css';

/**
 * SamplingFrequencyControl Component
 * Provides slider and resample button for changing sampling frequency
 * Task 2: Demonstrates aliasing and anti-aliasing effects
 */
const SamplingFrequencyControl = ({ 
  currentFrequency, 
  onFrequencyChange, 
  onResample,
  isResampling = false,
  minFrequency = 50,
  maxFrequency = 1000,
  step = 10
}) => {
  const handleSliderChange = (e) => {
    const newFrequency = parseInt(e.target.value, 10);
    onFrequencyChange(newFrequency);
  };

  return (
    <div className="task2-sampling-frequency-control">
      <div className="task2-control-header">
        <h3 className="task2-control-title">
          <span className="task2-icon">🎛️</span>
          Sampling Frequency Control
        </h3>
        <div className="task2-frequency-display">
          <span className="task2-frequency-value">{currentFrequency}</span>
          <span className="task2-frequency-unit">Hz</span>
        </div>
      </div>

      <div className="task2-control-body">
        <div className="task2-slider-container">
          <div className="task2-slider-labels">
            <span className="task2-label-min">{minFrequency} Hz</span>
            <span className="task2-label-max">{maxFrequency} Hz</span>
          </div>
          <input
            type="range"
            className="task2-frequency-slider"
            min={minFrequency}
            max={maxFrequency}
            step={step}
            value={currentFrequency}
            onChange={handleSliderChange}
            disabled={isResampling}
          />
          <div className="task2-slider-track-fill" 
               style={{ 
                 width: `${((currentFrequency - minFrequency) / (maxFrequency - minFrequency)) * 100}%` 
               }}
          />
        </div>

        <button
          className={`task2-resample-btn ${isResampling ? 'resampling' : ''}`}
          onClick={onResample}
          disabled={isResampling}
        >
          {isResampling ? (
            <>
              <span className="task2-spinner"></span>
              Resampling...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
              </svg>
              Apply Resampling
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SamplingFrequencyControl;
