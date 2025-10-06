import React, { useState, useRef, useCallback } from 'react';
import './DroneDetector.css';

export default function DroneDetector({ 
    onDetectionComplete, 
    isLoading, 
    setIsLoading, 
    setError 
}) {
    const [uploadedFile, setUploadedFile] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [detectionResult, setDetectionResult] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);
    const audioRef = useRef(null);

    // Handle file selection
    const handleFileSelect = useCallback((file) => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('audio/')) {
            setError('Please upload a valid audio file');
            return;
        }

        // Validate file size (max 50MB)
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('File size must be less than 50MB');
            return;
        }

        // Create audio URL
        const url = URL.createObjectURL(file);
        setAudioUrl(url);
        setUploadedFile(file);
        setDetectionResult(null);
    }, [setError]);

    // Handle file input change
    const handleFileChange = useCallback((e) => {
        const file = e.target.files?.[0];
        handleFileSelect(file);
    }, [handleFileSelect]);

    // Handle drag and drop
    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const file = e.dataTransfer?.files?.[0];
        handleFileSelect(file);
    }, [handleFileSelect]);

    // Detect sound using AI (mock for now)
    const handleDetect = useCallback(async () => {
        if (!uploadedFile) {
            setError('Please upload an audio file first');
            return;
        }

        setIsLoading(true);
        setDetectionResult(null);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mock detection results
            const mockResults = {
                detected: Math.random() > 0.3,
                vehicleType: ['Drone', 'Submarine', 'Helicopter', 'Ship'][Math.floor(Math.random() * 4)],
                confidence: 0.75 + Math.random() * 0.24,
                frequency: {
                    dominant: 150 + Math.random() * 300,
                    range: [100, 600]
                },
                features: {
                    propellerBlades: Math.floor(2 + Math.random() * 6),
                    rpm: Math.floor(2000 + Math.random() * 3000),
                    signature: 'Unique acoustic pattern detected'
                },
                timestamp: new Date().toISOString()
            };

            setDetectionResult(mockResults);
            onDetectionComplete?.(mockResults);

        } catch (error) {
            setError(`Detection failed: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [uploadedFile, setIsLoading, setError, onDetectionComplete]);

    // Clear uploaded file
    const handleClear = useCallback(() => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(null);
        setUploadedFile(null);
        setDetectionResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [audioUrl]);

    return (
        <div className="drone-detector">
            {/* Header */}
            <div className="detector-header">
                <h3>🚁 Drone/Submarine Sound Detection</h3>
                <p>Upload audio and use AI to identify unmanned vehicle sounds</p>
            </div>

            {/* Upload Section */}
            <div className="upload-section">
                <h4>📁 Upload Audio File</h4>
                <div
                    className={`upload-zone ${dragActive ? 'drag-active' : ''} ${uploadedFile ? 'has-file' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => !uploadedFile && fileInputRef.current?.click()}
                >
                    {!uploadedFile ? (
                        <>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M12,19L8,15H10.5V12H13.5V15H16L12,19Z"/>
                            </svg>
                            <p className="upload-text">Drag and drop audio file here</p>
                            <p className="upload-hint">or click to browse</p>
                            <p className="upload-formats">Supports: WAV, MP3, OGG, FLAC (Max 50MB)</p>
                        </>
                    ) : (
                        <div className="file-info">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M12,15L9.5,13.5V10.5H12.5V13.5L12,15Z"/>
                            </svg>
                            <p className="file-name">{uploadedFile.name}</p>
                            <p className="file-size">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            <button 
                                className="clear-file-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClear();
                                }}
                            >
                                Remove File
                            </button>
                        </div>
                    )}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
            </div>

            {/* Audio Player */}
            {audioUrl && (
                <div className="audio-player-section">
                    <h4>🎧 Audio Preview</h4>
                    <audio
                        ref={audioRef}
                        controls
                        src={audioUrl}
                        className="audio-player"
                    >
                        Your browser does not support the audio element.
                    </audio>
                </div>
            )}

            {/* Detect Button */}
            {uploadedFile && (
                <div className="detect-section">
                    <button
                        className="detect-btn"
                        onClick={handleDetect}
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
                                    <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z"/>
                                </svg>
                                Detect Sound
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Detection Results */}
            {detectionResult && (
                <div className="detection-results">
                    <div className="results-header">
                        <h4>
                            {detectionResult.detected ? '✅ Vehicle Detected!' : '❌ No Vehicle Detected'}
                        </h4>
                    </div>

                    {detectionResult.detected && (
                        <>
                            <div className="detection-summary">
                                <div className="summary-card">
                                    <div className="summary-icon">🚁</div>
                                    <div className="summary-content">
                                        <p className="summary-label">Vehicle Type</p>
                                        <p className="summary-value">{detectionResult.vehicleType}</p>
                                    </div>
                                </div>

                                <div className="summary-card">
                                    <div className="summary-icon">📊</div>
                                    <div className="summary-content">
                                        <p className="summary-label">Confidence</p>
                                        <p className="summary-value">{(detectionResult.confidence * 100).toFixed(1)}%</p>
                                    </div>
                                </div>

                                <div className="summary-card">
                                    <div className="summary-icon">🎵</div>
                                    <div className="summary-content">
                                        <p className="summary-label">Dominant Frequency</p>
                                        <p className="summary-value">{detectionResult.frequency.dominant.toFixed(1)} Hz</p>
                                    </div>
                                </div>
                            </div>

                            <div className="detection-details">
                                <h5>🔍 Acoustic Features</h5>
                                <div className="details-grid">
                                    <div className="detail-item">
                                        <strong>Propeller Blades:</strong>
                                        <span>{detectionResult.features.propellerBlades}</span>
                                    </div>
                                    <div className="detail-item">
                                        <strong>Estimated RPM:</strong>
                                        <span>{detectionResult.features.rpm.toLocaleString()}</span>
                                    </div>
                                    <div className="detail-item">
                                        <strong>Frequency Range:</strong>
                                        <span>{detectionResult.frequency.range[0]} - {detectionResult.frequency.range[1]} Hz</span>
                                    </div>
                                    <div className="detail-item">
                                        <strong>Signature:</strong>
                                        <span>{detectionResult.features.signature}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="confidence-bar-container">
                                <p className="confidence-label">Detection Confidence</p>
                                <div className="confidence-bar">
                                    <div 
                                        className="confidence-fill"
                                        style={{ width: `${detectionResult.confidence * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Info Section */}
            <div className="info-section">
                <h4>ℹ️ About This Feature</h4>
                <div className="info-content">
                    <p>
                        This AI-powered tool analyzes audio recordings to detect and classify sounds from unmanned vehicles 
                        like drones and submarines. The detection algorithm uses machine learning to identify acoustic signatures 
                        unique to different vehicle types.
                    </p>
                    <div className="info-features">
                        <div className="info-feature">
                            <strong>🎯 Real-time Detection:</strong>
                            <span>Quickly identifies vehicle sounds in uploaded audio</span>
                        </div>
                        <div className="info-feature">
                            <strong>🧠 AI Classification:</strong>
                            <span>Uses trained models to classify vehicle types</span>
                        </div>
                        <div className="info-feature">
                            <strong>📈 Feature Extraction:</strong>
                            <span>Analyzes frequency patterns and acoustic signatures</span>
                        </div>
                    </div>
                    <p className="info-note">
                        <strong>Note:</strong> Currently using mock data. Real API endpoints will be integrated in production.
                    </p>
                </div>
            </div>
        </div>
    );
}
