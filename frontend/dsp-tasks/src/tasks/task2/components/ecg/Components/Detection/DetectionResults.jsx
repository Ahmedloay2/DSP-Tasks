import React, { useState, useEffect, useCallback } from 'react';
import RealECGService from '../../services/RealECGService';
import './DetectionResults.css';

/**
 * DetectionResults Component
 * Displays ECG classification/detection results with optimized modern design
 */
const DetectionResults = ({ recordName = 'example', samplingFrequency = 500, triggerRefetch }) => {
  const [loading, setLoading] = useState(false);
  const [classification, setClassification] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const Abnormalities = [
    'Myocardial Infarction (MI)',
    'Atrial Fibrillation/Flutter (AFIB)',
    'Other Abnormality',
    'Hypertrophy (HYP)',
    'ST-T Changes (STTC)'
  ];

  const fetchClassification = useCallback(async (freqToUse) => {
    setLoading(true);
    setError(null);

    try {
      const result = await RealECGService.fetchClassification(recordName, freqToUse);
      
      if (result.success) {
        const parsedData = RealECGService.parseClassificationString(result.data);
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
  }, [recordName]);

  useEffect(() => {
    if (recordName) {
      fetchClassification(500);
    }
  }, [recordName, fetchClassification]);

  useEffect(() => {
    if (triggerRefetch && triggerRefetch > 0) {
      fetchClassification(samplingFrequency);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerRefetch, fetchClassification]);

  const renderClassificationResults = () => {
    if (!classification) return null;

    const { className } = classification;
    
    const isNormal = !Abnormalities.some(abnormality => 
      className.toLowerCase().includes(abnormality.toLowerCase().split('(')[0].trim())
    );

    return (
      <div className="ecg-results-content">
        {/* Status Card */}
        <div className={`ecg-status-card ${isNormal ? 'ecg-status-normal' : 'ecg-status-abnormal'}`}>
          <div className="ecg-status-icon-wrapper">
            {isNormal ? (
              <svg className="ecg-status-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg className="ecg-status-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <div className="ecg-status-content">
            <h3 className="ecg-status-title">
              {isNormal ? 'Normal Heart Rhythm' : 'Abnormality Detected'}
            </h3>
            <p className="ecg-status-subtitle">
              {isNormal 
                ? 'No concerning patterns identified' 
                : 'Irregular patterns detected - requires attention'}
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="ecg-details-grid">
          {/* Classification */}
          <div className="ecg-detail-card">
            <div className="ecg-detail-header">
              <span className="ecg-detail-label">Classification</span>
              <span className="ecg-detail-badge">PRIMARY</span>
            </div>
            <p className="ecg-detail-value">{className}</p>
          </div>

          {/* Sampling Frequency */}
          <div className="ecg-detail-card">
            <span className="ecg-detail-label">Sampling Rate</span>
            <p className="ecg-detail-value">{samplingFrequency} Hz</p>
            <p className="ecg-detail-hint">Standard diagnostic quality</p>
          </div>

          {/* Timestamp */}
          <div className="ecg-detail-card">
            <span className="ecg-detail-label">
              <svg className="ecg-icon-small" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Last Updated
            </span>
            <p className="ecg-detail-value">
              {lastUpdated && new Date(lastUpdated).toLocaleTimeString()}
            </p>
            <p className="ecg-detail-hint">
              {lastUpdated && new Date(lastUpdated).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Clinical Note */}
        <div className="ecg-clinical-note">
          <svg className="ecg-icon-small" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="ecg-clinical-text">
            This is an automated analysis. Always consult with a healthcare professional for proper diagnosis and treatment.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="ecg-detection-container">
      {/* Error State */}
      {error && (
        <div className="ecg-error-card">
          <div className="ecg-error-content">
            <svg className="ecg-error-icon" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div>
              <p className="ecg-error-text">{error}</p>
              <button 
                onClick={() => fetchClassification(samplingFrequency)}
                className="ecg-error-retry"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="ecg-loading-card">
          <div className="ecg-loading-spinner-wrapper">
            <div className="ecg-loading-spinner-bg" />
            <div className="ecg-loading-spinner" />
          </div>
          <p className="ecg-loading-text">Analyzing ECG signal...</p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && classification && renderClassificationResults()}

      {/* Empty State */}
      {!loading && !error && !classification && (
        <div className="ecg-empty-state">
          <p>No classification data available. Click refresh to analyze.</p>
        </div>
      )}
    </div>
  );
};

export default DetectionResults;
