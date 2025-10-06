import React, { useState, useEffect } from 'react';
import ECGClassificationService from '../../services/ECGClassificationService';
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
      const result = await ECGClassificationService.fetchClassification(recordName);
      
      if (result.success) {
        // classificationData is now an object, pass it directly
        const parsedData = ECGClassificationService.parseClassificationString(result.data);
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

    const { className, /*confidence,*/ isNormal} = classification;
    const statusClass = isNormal ? 'status-normal' : 'status-abnormal';

    return (
      <div className="detection-results-grid">
        <div className={`detection-result ${statusClass}`}>
          <div className="result-label">Status:</div>
          <div className="result-value status-badge">
            {isNormal ? '✓ Normal' : '⚠ Abnormal'}
          </div>
        </div>
        
        <div className="detection-result">
          <div className="result-label">Classification:</div>
          <div className="result-value classification-text">{className}</div>
        </div>
        
        {/*<div className="detection-result">
          <div className="result-label">Confidence:</div>
          <div className="result-value confidence-text">
            {confidence.toFixed(2)}%
            <div className="confidence-bar">
              <div 
                className="confidence-fill" 
                style={{ width: `${Math.min(confidence, 100)}%` }}
              />
            </div>
          </div>
        </div>*/}
      </div>
    );
  };

  return (
    <div className="detection-results-container">
      <div className="detection-header">
        <h4 className="detection-title">
          <span className="icon">🔍</span>
          ECG Detection & Classification
        </h4>
      </div>

      {error && (
        <div className="detection-error">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <p className="error-text">Error: {error}</p>
            <button className="retry-btn" onClick={fetchClassification}>
              Retry Analysis
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="detection-loading">
          <div className="loading-spinner" />
          <p className="loading-text">Analyzing ECG signal...</p>
        </div>
      )}

      {classification && !loading && !error && (
        <div className="detection-content">
          {renderClassificationResults()}
          
          {lastUpdated && (
            <div className="detection-footer">
              <span className="timestamp-label">Last updated: </span>
              <span className="timestamp-value">
                {new Date(lastUpdated).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}

      {!classification && !loading && !error && (
        <div className="detection-empty">
          <p>No classification data available. Click refresh to analyze.</p>
        </div>
      )}
    </div>
  );
};

export default DetectionResults;