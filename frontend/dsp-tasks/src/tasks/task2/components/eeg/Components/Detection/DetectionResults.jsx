import React, { useState, useEffect } from 'react';
import RealEEGService from '../../services/RealEEGService';
import './DetectionResults.css';

/**
 * DetectionResults Component
 * Displays ECG classification/detection results from the API
 */
const DetectionResults = ({ recordName = 'example' }) => {
  const [loading, setLoading] = useState(false);
  const [classification, setClassification] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchClassification = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await RealEEGService.fetchClassification(recordName);
      
      if (result.success) {
        // classificationData is now an object, pass it directly
        const parsedData = RealEEGService.parseClassificationString(result.data);
        setClassification(parsedData);
        setLastUpdated(result.timestamp);
      } else {
        setError(result.error || 'Failed to fetch classification');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-fetch immediately on mount and when recordName changes
    if (recordName) {
      fetchClassification();
    }
  }, [recordName]);

  const renderClassificationResults = () => {
    if (!classification) return null;

    const { className, confidence, isNormal} = classification;
    const statusClass = isNormal ? 'status-normal' : 'status-abnormal';

    return (
      <div className="task2-detection-results-grid">
        <div className={`task2-detection-result ${statusClass}`}>
          <div className="task2-result-label">Status:</div>
          <div className="task2-result-value task2-status-badge">
            {isNormal ? '✓ Normal' : '⚠ Abnormal'}
          </div>
        </div>
        
        <div className="task2-detection-result">
          <div className="task2-result-label">Classification:</div>
          <div className="task2-result-value task2-classification-text">{className}</div>
        </div>
        
        <div className="task2-detection-result">
          <div className="task2-result-label">Confidence:</div>
          <div className="task2-result-value task2-confidence-text">
            {confidence.toFixed(2)}%
            <div className="task2-confidence-bar">
              <div 
                className="task2-confidence-fill" 
                style={{ width: `${Math.min(confidence, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="task2-detection-results-container">
      <div className="task2-detection-header">
        <h4 className="task2-detection-title">
          <span className="task2-icon">🔍</span>
          EEG Detection & Classification
        </h4>
      </div>

      {error && (
        <div className="task2-detection-error">
          <div className="task2-error-icon">⚠️</div>
          <div className="task2-error-content">
            <p className="task2-error-text">Error: {error}</p>
            <button className="task2-retry-btn" onClick={fetchClassification}>
              Retry Analysis
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="task2-detection-loading">
          <div className="task2-loading-spinner" />
          <p className="task2-loading-text">Analyzing EEG signal...</p>
        </div>
      )}

      {classification && !loading && !error && (
        <div className="task2-detection-content">
          {renderClassificationResults()}
          
          {lastUpdated && (
            <div className="task2-detection-footer">
              <span className="task2-timestamp-label">Last updated: </span>
              <span className="task2-timestamp-value">
                {new Date(lastUpdated).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}

      {!classification && !loading && !error && (
        <div className="task2-detection-empty">
          <p>No classification data available. Click refresh to analyze.</p>
        </div>
      )}
    </div>
  );
};

export default DetectionResults;

