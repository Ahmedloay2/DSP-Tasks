import React, { useState, useRef } from 'react';
import { realSARService } from '../services/RealSARService';
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
      const validation = realSARService.validateImageFile(file);
      
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
      const result = await realSARService.analyzeSARImage(selectedImage);
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
    <div className="task2-sar-image-analyzer">
      <div className="task2-analyzer-section">
        <h2>Upload SAR Image</h2>
        
        {/* Upload Area */}
        <div 
          className="task2-upload-area"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {!imagePreview ? (
            <div className="task2-upload-placeholder">
              <svg 
                className="task2-upload-icon" 
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
              <p className="task2-upload-hint">or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="task2-file-input"
              />
            </div>
          ) : (
            <div className="task2-image-preview">
              <img src={imagePreview} alt="SAR Preview" />
              <button className="task2-remove-btn" onClick={handleReset}>
                ?
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="task2-error-message">
            <svg className="task2-error-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="task2-action-buttons">
          <button
            className="task2-analyze-btn"
            onClick={handleAnalyze}
            disabled={!selectedImage || analyzing}
          >
            {analyzing ? (
              <>
                <span className="task2-spinner"></span>
                Analyzing...
              </>
            ) : (
              'Analyze Image'
            )}
          </button>
          
          {selectedImage && !analyzing && (
            <button className="task2-reset-btn" onClick={handleReset}>
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="task2-analysis-results">
          <h2>Analysis Results</h2>
          
          {/* Image Display Section */}
          <div className="task2-analyzed-image-section">
            <div className="task2-analyzed-image-container">
              <img src={imagePreview} alt="Analyzed SAR" className="task2-analyzed-image" />
              <div className="task2-image-info-overlay">
                <div className="task2-image-info-item">
                  <svg className="task2-info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                    <polyline points="13 2 13 9 20 9"/>
                  </svg>
                  <span className="task2-info-text">{analysisResult.fileName}</span>
                </div>
                <div className="task2-image-info-item">
                  <svg className="task2-info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="3" y1="9" x2="21" y2="9"/>
                    <line x1="9" y1="21" x2="9" y2="9"/>
                  </svg>
                  <span className="task2-info-text">
                    {analysisResult.imageWidth} � {analysisResult.imageHeight} px
                  </span>
                </div>
                <div className="task2-image-info-item">
                  <svg className="task2-info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                  <span className="task2-info-text">
                    {(analysisResult.fileSize / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="task2-results-grid">
            {/* Land Percentage */}
            <div className="task2-result-card task2-land-card">
              <div className="task2-result-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 20h18M5 20V10l7-7 7 7v10"/>
                  <path d="M12 3L5 10M12 3l7 7"/>
                </svg>
              </div>
              <div className="task2-result-content">
                <h3>Land Coverage</h3>
                <div className="task2-percentage-display">
                  <span className="task2-percentage-value">
                    {analysisResult.landPercentage.toFixed(2)}%
                  </span>
                </div>
                <div className="task2-progress-bar">
                  <div 
                    className="task2-progress-fill task2-land-fill"
                    style={{ width: `${analysisResult.landPercentage}%` }}
                  ></div>
                </div>
                <p className="task2-result-description">
                  Land surfaces show varying backscatter based on roughness and moisture
                </p>
              </div>
            </div>

            {/* Water Percentage */}
            <div className="task2-result-card task2-water-card">
              <div className="task2-result-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                </svg>
              </div>
              <div className="task2-result-content">
                <h3>Water Coverage</h3>
                <div className="task2-percentage-display">
                  <span className="task2-percentage-value">
                    {analysisResult.waterPercentage.toFixed(2)}%
                  </span>
                </div>
                <div className="task2-progress-bar">
                  <div 
                    className="task2-progress-fill task2-water-fill"
                    style={{ width: `${analysisResult.waterPercentage}%` }}
                  ></div>
                </div>
                <p className="task2-result-description">
                  Water bodies appear dark in SAR imagery due to specular reflection
                </p>
              </div>
            </div>
          </div>

          {/* Pie Chart Visualization */}
          <div className="task2-visualization-section">
            <h3>Coverage Distribution</h3>
            <div className="task2-pie-chart-container">
              <svg viewBox="0 0 200 200" className="task2-pie-chart">
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="40"
                  strokeDasharray={`${(analysisResult.landPercentage / 100) * 502.4} 502.4`}
                  transform="rotate(-90 100 100)"
                  className="task2-pie-segment task2-land-segment"
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
                  className="task2-pie-segment task2-water-segment"
                />
              </svg>
              <div className="task2-chart-legend">
                <div className="task2-legend-item">
                  <span className="task2-legend-color task2-land-color"></span>
                  <span className="task2-legend-text">Land: {analysisResult.landPercentage.toFixed(2)}%</span>
                </div>
                <div className="task2-legend-item">
                  <span className="task2-legend-color task2-water-color"></span>
                  <span className="task2-legend-text">Water: {analysisResult.waterPercentage.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Explanation */}
          <div className="task2-technical-info">
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


