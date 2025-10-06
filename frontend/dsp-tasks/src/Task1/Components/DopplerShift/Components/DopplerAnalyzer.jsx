import React, { useState, useRef } from 'react';
import './DopplerAnalyzer.css';

const DopplerAnalyzer = ({ onAnalysisComplete, isLoading, setIsLoading, setError }) => {
    const [uploadedFile, setUploadedFile] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('audio/')) {
            setError('Please select a valid audio file (MP3, WAV, etc.)');
            return;
        }

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
        }

        setUploadedFile(file);
        setError(null);
        setAnalysisResult(null);
    };

    const handleAnalyze = async () => {
        if (!uploadedFile) {
            setError('Please select an audio file first');
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            // Create audio URL from uploaded file
            const uploadedAudioUrl = URL.createObjectURL(uploadedFile);
            
            const { MockDopplerApiService } = await import('../services/MockDopplerApiService');
            const result = await MockDopplerApiService.analyzeAudioFile(uploadedFile);
            
            // Add the uploaded audio URL to the result
            const resultWithAudioUrl = {
                ...result,
                uploadedAudioUrl
            };
            
            setAnalysisResult(resultWithAudioUrl);
            onAnalysisComplete(resultWithAudioUrl);
        } catch (err) {
            setError(`Analysis failed: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const clearFile = () => {
        setUploadedFile(null);
        setAnalysisResult(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="doppler-analyzer">
            <div className="analyzer-header">
                <h3>🔍 Analyze Audio for Doppler Effect</h3>
                <p>Upload an audio file to detect frequency shifts and estimate source velocity</p>
            </div>

            <div className="analyzer-content">
                {/* File Upload Section */}
                <div className="upload-section">
                    <div className="upload-area">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="audio/*"
                            onChange={handleFileUpload}
                            disabled={isLoading}
                            className="file-input"
                            id="audio-upload"
                        />
                        <label htmlFor="audio-upload" className="upload-label">
                            <div className="upload-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                                </svg>
                            </div>
                            <div className="upload-text">
                                <h4>Choose Audio File</h4>
                                <p>Click to browse or drag and drop</p>
                                <p className="upload-formats">Supports MP3, WAV, AAC, OGG (max 10MB)</p>
                            </div>
                        </label>
                    </div>

                    {uploadedFile && (
                        <div className="file-info">
                            <div className="file-details">
                                <div className="file-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                                    </svg>
                                </div>
                                <div className="file-meta">
                                    <div className="file-name">{uploadedFile.name}</div>
                                    <div className="file-size">{formatFileSize(uploadedFile.size)}</div>
                                    <div className="file-type">{uploadedFile.type}</div>
                                </div>
                                <button
                                    className="file-remove"
                                    onClick={clearFile}
                                    disabled={isLoading}
                                    aria-label="Remove file"
                                >
                                    ×
                                </button>
                            </div>

                            <button
                                className="analyze-btn"
                                onClick={handleAnalyze}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="loading-spinner"></div>
                                        Analyzing Audio...
                                    </>
                                ) : (
                                    <>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
                                        </svg>
                                        Start Analysis
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Analysis Results */}
                {analysisResult && (
                    <div className="analysis-results">
                        <h4>📊 Analysis Results</h4>
                        <div className="results-grid">
                            <div className="result-card primary">
                                <div className="result-icon">🎵</div>
                                <div className="result-content">
                                    <div className="result-label">Source Frequency</div>
                                    <div className="result-value">
                                        {analysisResult.analysis.estimatedSourceFrequency} Hz
                                    </div>
                                </div>
                            </div>

                            <div className="result-card primary">
                                <div className="result-icon">🚗</div>
                                <div className="result-content">
                                    <div className="result-label">Source Velocity</div>
                                    <div className="result-value">
                                        {analysisResult.analysis.estimatedSourceVelocity} m/s
                                    </div>
                                </div>
                            </div>

                            <div className="result-card">
                                <div className="result-content">
                                    <div className="result-label">Confidence Score</div>
                                    <div className="result-value">
                                        {(analysisResult.analysis.confidence * 100).toFixed(1)}%
                                    </div>
                                </div>
                            </div>

                            <div className="result-card">
                                <div className="result-content">
                                    <div className="result-label">Duration</div>
                                    <div className="result-value">
                                        {analysisResult.analysis.duration.toFixed(1)}s
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="analysis-details">
                            <h5>📋 Analysis Details</h5>
                            <div className="details-grid">
                                <div className="detail-item">
                                    <strong>Analysis Method:</strong> {analysisResult.analysis.analysisMethod}
                                </div>
                                <div className="detail-item">
                                    <strong>File Name:</strong> {analysisResult.fileName}
                                </div>
                                <div className="detail-item">
                                    <strong>File Size:</strong> {formatFileSize(analysisResult.fileSize)}
                                </div>
                                <div className="detail-item">
                                    <strong>Quality Score:</strong> {(analysisResult.analysis.qualityScore * 100).toFixed(1)}%
                                </div>
                            </div>
                        </div>

                        <div className="velocity-interpretation">
                            <h5>🎯 Results Summary</h5>
                            <div className="interpretation-content">
                                {analysisResult.analysis.estimatedSourceVelocity > 0 ? (
                                    <div className="interpretation approaching">
                                        <div className="interpretation-icon">➡️</div>
                                        <div className="interpretation-text">
                                            <strong>Source Approaching</strong>
                                            <p>The sound source was moving towards the observer at {Math.abs(analysisResult.analysis.estimatedSourceVelocity)} m/s with a source frequency of {analysisResult.analysis.estimatedSourceFrequency} Hz.</p>
                                        </div>
                                    </div>
                                ) : analysisResult.analysis.estimatedSourceVelocity < 0 ? (
                                    <div className="interpretation receding">
                                        <div className="interpretation-icon">⬅️</div>
                                        <div className="interpretation-text">
                                            <strong>Source Receding</strong>
                                            <p>The sound source was moving away from the observer at {Math.abs(analysisResult.analysis.estimatedSourceVelocity)} m/s with a source frequency of {analysisResult.analysis.estimatedSourceFrequency} Hz.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="interpretation stationary">
                                        <div className="interpretation-icon">⭕</div>
                                        <div className="interpretation-text">
                                            <strong>Stationary Source</strong>
                                            <p>The source appears to be stationary with a frequency of {analysisResult.analysis.estimatedSourceFrequency} Hz.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Analysis Info */}
                <div className="analysis-info">
                    <h4>ℹ️ How It Works</h4>
                    <div className="info-grid">
                        <div className="info-item">
                            <div className="info-icon">🔊</div>
                            <div className="info-content">
                                <h5>Frequency Detection</h5>
                                <p>Uses FFT analysis to identify the dominant frequency in the audio signal.</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-icon">📈</div>
                            <div className="info-content">
                                <h5>Doppler Calculation</h5>
                                <p>Applies the Doppler formula in reverse to estimate the source velocity.</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-icon">🎯</div>
                            <div className="info-content">
                                <h5>Accuracy</h5>
                                <p>Results depend on audio quality and the presence of clear tonal components.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DopplerAnalyzer;