import React, { useState, useRef } from 'react';
import { realSARApiService } from '../services/RealSARApiService';
import '../styles/SARImageAnalyzer.css';

/**
 * SARImageAnalyzer Component
 * 
 * Allows users to upload SAR images and analyze them using real API to estimate
 * land cover composition (land vs water percentages)
 */
const SARImageAnalyzer = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    
    if (file) {
      // Validate file using service
      const validation = realSARApiService.validateImageFile(file);
      
      if (!validation.valid) {
        setError(validation.errors.join('. '));
        return;
      }

      setError(null);
      setSelectedImage(file);
      setAnalysisResult(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      // Call real API
      const result = await realSARApiService.analyzeSARImage(selectedImage);
      setAnalysisResult(result);
    } catch (err) {
      setError('Error analyzing image: ' + err.message);
      console.error('Analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file) {
      // Simulate file input change
      const event = { target: { files: [file] } };
      handleImageSelect(event);
    }
  };

  return (
    <div className="sar-image-analyzer">
      <div className="analyzer-section">
        <h2>Upload SAR Image</h2>
        
        {/* Upload Area */}
        <div 
          className="upload-area"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {!imagePreview ? (
            <div className="upload-placeholder">
              <svg 
                className="upload-icon" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
              </svg>
              <p>Drag and drop a SAR image here</p>
              <p className="upload-hint">or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="file-input"
              />
            </div>
          ) : (
            <div className="image-preview">
              <img src={imagePreview} alt="SAR Preview" />
              <button className="remove-btn" onClick={handleReset}>
                ✕
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            <svg className="error-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            className="analyze-btn"
            onClick={handleAnalyze}
            disabled={!selectedImage || analyzing}
          >
            {analyzing ? (
              <>
                <span className="spinner"></span>
                Analyzing...
              </>
            ) : (
              'Analyze Image'
            )}
          </button>
          
          {selectedImage && !analyzing && (
            <button className="reset-btn" onClick={handleReset}>
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="analysis-results">
          <h2>Analysis Results</h2>
          
          {/* Image Display Section */}
          <div className="analyzed-image-section">
            <div className="analyzed-image-container">
              <img src={imagePreview} alt="Analyzed SAR" className="analyzed-image" />
              <div className="image-info-overlay">
                <div className="image-info-item">
                  <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                    <polyline points="13 2 13 9 20 9"/>
                  </svg>
                  <span className="info-text">{analysisResult.fileName}</span>
                </div>
                <div className="image-info-item">
                  <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="3" y1="9" x2="21" y2="9"/>
                    <line x1="9" y1="21" x2="9" y2="9"/>
                  </svg>
                  <span className="info-text">
                    {analysisResult.imageWidth} × {analysisResult.imageHeight} px
                  </span>
                </div>
                <div className="image-info-item">
                  <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                  <span className="info-text">
                    {(analysisResult.fileSize / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="results-grid">
            {/* Land Percentage */}
            <div className="result-card land-card">
              <div className="result-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 20h18M5 20V10l7-7 7 7v10"/>
                  <path d="M12 3L5 10M12 3l7 7"/>
                </svg>
              </div>
              <div className="result-content">
                <h3>Land Coverage</h3>
                <div className="percentage-display">
                  <span className="percentage-value">
                    {analysisResult.landPercentage.toFixed(2)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill land-fill"
                    style={{ width: `${analysisResult.landPercentage}%` }}
                  ></div>
                </div>
                <p className="result-description">
                  Land surfaces show varying backscatter based on roughness and moisture
                </p>
              </div>
            </div>

            {/* Water Percentage */}
            <div className="result-card water-card">
              <div className="result-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                </svg>
              </div>
              <div className="result-content">
                <h3>Water Coverage</h3>
                <div className="percentage-display">
                  <span className="percentage-value">
                    {analysisResult.waterPercentage.toFixed(2)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill water-fill"
                    style={{ width: `${analysisResult.waterPercentage}%` }}
                  ></div>
                </div>
                <p className="result-description">
                  Water bodies appear dark in SAR imagery due to specular reflection
                </p>
              </div>
            </div>
          </div>

          {/* Pie Chart Visualization */}
          <div className="visualization-section">
            <h3>Coverage Distribution</h3>
            <div className="pie-chart-container">
              <svg viewBox="0 0 200 200" className="pie-chart">
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="40"
                  strokeDasharray={`${(analysisResult.landPercentage / 100) * 502.4} 502.4`}
                  transform="rotate(-90 100 100)"
                  className="pie-segment land-segment"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="40"
                  strokeDasharray={`${(analysisResult.waterPercentage / 100) * 502.4} 502.4`}
                  strokeDashoffset={`${-(analysisResult.landPercentage / 100) * 502.4}`}
                  transform="rotate(-90 100 100)"
                  className="pie-segment water-segment"
                />
              </svg>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-color land-color"></span>
                  <span className="legend-text">Land: {analysisResult.landPercentage.toFixed(2)}%</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color water-color"></span>
                  <span className="legend-text">Water: {analysisResult.waterPercentage.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Explanation */}
          <div className="technical-info">
            <h3>How SAR Analysis Works</h3>
            <p>
              Synthetic Aperture Radar (SAR) analysis uses backscatter intensity patterns to classify surface types.
              Water bodies typically show low backscatter (appearing dark) due to specular reflection of radar waves,
              while land surfaces exhibit higher backscatter values depending on surface roughness, moisture content,
              and vegetation cover. This analysis uses advanced image processing algorithms to calculate the 
              percentage distribution of land and water in the uploaded SAR image.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SARImageAnalyzer;
