/**
 * Processing Section Component
 * Handles audio processing controls and results display
 */
import React from 'react';
import './ProcessingSection.css';

export default function ProcessingSection({ 
  onProcess, 
  onReset, 
  onDownload,
  processedAudio,
  isProcessing,
  progress,
  audioRef
}) {
  return (
    <section className="processing-section">
      <h2>Process Audio</h2>

      <div className="process-controls">
        <button 
          className="process-btn" 
          onClick={onProcess}
          disabled={isProcessing}
        >
          <span className="icon">⚡</span>
          {isProcessing ? 'Processing...' : 'Apply Equalizer'}
        </button>
        <button className="secondary-btn" onClick={onReset}>
          🔄 Reset
        </button>
      </div>

      {isProcessing && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress * 100}%` }}></div>
          <span className="progress-text">Processing... {Math.round(progress * 100)}%</span>
        </div>
      )}

      {processedAudio && !isProcessing && (
        <div className="results">
          <h3>Processed Audio</h3>
          <audio ref={audioRef} controls src={processedAudio} />
          <button className="download-btn" onClick={onDownload}>
            💾 Download
          </button>
        </div>
      )}
    </section>
  );
}
