import React, { useState, useCallback } from 'react';
import './SamplingFrequencySelector.css';

/**
 * SamplingFrequencySelector Component
 * 
 * Allows users to select and visualize different sampling frequencies
 * to demonstrate undersampling and oversampling effects on ECG signals.
 */
export default function SamplingFrequencySelector({ onFrequencyChange, onVisualize }) {
  const [samplingFreq, setSamplingFreq] = useState(250);
  const [showEffect, setShowEffect] = useState(false);

  const frequencyPresets = [
    { label: 'Undersample (50 Hz)', value: 50 },
    { label: 'Low (100 Hz)', value: 100 },
    { label: 'Standard (250 Hz)', value: 250 },
    { label: 'High (500 Hz)', value: 500 },
    { label: 'Oversample (1000 Hz)', value: 1000 }
  ];

  const handleFrequencyChange = useCallback((newFreq) => {
    setSamplingFreq(newFreq);
    onFrequencyChange?.(newFreq);
  }, [onFrequencyChange]);

  const handleSliderChange = useCallback((e) => {
    const newFreq = parseInt(e.target.value);
    handleFrequencyChange(newFreq);
  }, [handleFrequencyChange]);

  const handleVisualize = useCallback(() => {
    setShowEffect(true);
    onVisualize?.(samplingFreq);
  }, [samplingFreq, onVisualize]);

  const handleReset = useCallback(() => {
    setShowEffect(false);
    setSamplingFreq(250);
    onFrequencyChange?.(250);
  }, [onFrequencyChange]);

  return (
    <div className="task2-sampling-frequency-selector">
      <div className="task2-sampling-header">
        <h2>Sampling Frequency Control</h2>
        <p>Adjust the sampling frequency to observe undersampling and oversampling effects</p>
      </div>

      <div className="task2-sampling-content">
        {/* Preset Buttons */}
        <div className="task2-sampling-presets">
          <label className="task2-sampling-label">Quick Presets:</label>
          <div className="task2-preset-buttons">
            {frequencyPresets.map((preset) => (
              <button
                key={preset.value}
                className={`task2-preset-btn ${task2-samplingFreq === preset.task2-value ? 'active' : ''}`}
                onClick={() => handleFrequencyChange(preset.value)}
                title={preset.label}
              >
                {preset.value} Hz
              </button>
            ))}
          </div>
        </div>

        {/* Frequency Slider */}
        <div className="task2-sampling-slider-section">
          <label className="task2-sampling-label">Fine Tuning:</label>
          <div className="task2-slider-container">
            <span className="task2-slider-min">50 Hz</span>
            <input
              type="range"
              min="50"
              max="1000"
              value={samplingFreq}
              onChange={handleSliderChange}
              className="task2-frequency-slider"
              step="10"
            />
            <span className="task2-slider-max">1000 Hz</span>
          </div>
          <div className="task2-frequency-display">
            <span className="task2-frequency-value">{samplingFreq} Hz</span>
            <span className="task2-frequency-info">
              {samplingFreq < 100 && '(Undersample - High aliasing)'}
              {samplingFreq >= 100 && samplingFreq < 250 && '(Low frequency - Aliasing possible)'}
              {samplingFreq >= 250 && samplingFreq <= 500 && '(Standard - Good quality)'}
              {samplingFreq > 500 && '(Oversample - Maximum detail)'}
            </span>
          </div>
        </div>

        {/* Effect Description */}
        <div className="task2-sampling-effects">
          <div className="task2-effect-card task2-undersampling">
            <h3>Undersampling (Aliasing)</h3>
            <p>Sampling frequency too low. Signal information is lost, creating artifacts.</p>
          </div>
          <div className="task2-effect-card task2-oversampling">
            <h3>Oversampling (Detail)</h3>
            <p>Sampling frequency very high. Maximum signal detail preserved.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="task2-sampling-actions">
          <button
            className="task2-visualize-btn"
            onClick={handleVisualize}
          >
            {showEffect ? 'Refresh Visualization' : 'Visualize Signal with this Frequency'}
          </button>
          <button
            className="task2-reset-btn"
            onClick={handleReset}
          >
            Reset to Standard
          </button>
        </div>

        {/* Status Message */}
        {showEffect && (
          <div className="task2-sampling-status">
            <span className="task2-status-icon">✓</span>
            Signal visualization updated with {samplingFreq} Hz sampling frequency
          </div>
        )}
      </div>
    </div>
  );
}
