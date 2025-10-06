import React, { useState, useRef, useCallback } from 'react';
import './DroneDetector.css';

const API_ENDPOINT = 'https://semilunate-marcene-nonsustainable.ngrok-free.dev/upload-drone-wav';

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

        // Validate file type - WAV files only for API
        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith('.wav') && !file.type.includes('wav')) {
            setError('Please upload a .wav audio file');
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

    // Detect sound using API
    const handleDetect = useCallback(async () => {
        if (!uploadedFile) {
            setError('Please upload an audio file first');
            return;
        }

        setIsLoading(true);
        setDetectionResult(null);
        setError(null);

        try {
            // Prepare form data
            const formData = new FormData();
            formData.append('wav_file', uploadedFile);

            // Call the API
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                body: formData,
                // Add headers for ngrok
                headers: {
                    'ngrok-skip-browser-warning': 'true',
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            // Get the response text (the API returns a string)
            const resultText = await response.text();
            
            // Parse the result - check for positive detection (not "no drone")
            const lowerResult = resultText.toLowerCase();
            const isDrone = lowerResult.includes('drone') && !lowerResult.includes('no drone');
            
            const detectionResults = {
                detected: isDrone,
                result: resultText,
                vehicleType: isDrone ? 'Drone' : 'Not a Drone',
                timestamp: new Date().toISOString(),
                fileName: uploadedFile.name,
                fileSize: uploadedFile.size
            };

            setDetectionResult(detectionResults);
            onDetectionComplete?.(detectionResults);

        } catch (error) {
            console.error('Detection error:', error);
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
                <h3>🚁 AI Drone Sound Detection</h3>
                <p>Upload a WAV audio file to detect drone sounds using AI</p>
            </div>

            {/* Upload Section */}
            <div className="upload-section">
                <h4>📁 Upload WAV Audio File</h4>
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
                            <p className="upload-text">Drag and drop WAV file here</p>
                            <p className="upload-hint">or click to browse</p>
                            <p className="upload-formats">Supports: WAV format only (Max 50MB)</p>
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
                    accept=".wav,audio/wav,audio/wave,audio/x-wav"
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
                            {detectionResult.detected ? '✅ Drone Detected!' : '❌ No Drone Detected'}
                        </h4>
                    </div>

                    <div className="detection-summary-main">
                        <div className={`main-result ${detectionResult.detected ? 'detected' : 'not-detected'}`}>
                            <div className="result-icon">
                                {detectionResult.detected ? '🚁' : '🔇'}
                            </div>
                            <div className="result-content">
                                <p className="result-label">Detection Result</p>
                                <p className="result-value">{detectionResult.vehicleType}</p>
                                <p className="result-response">{detectionResult.result}</p>
                            </div>
                        </div>
                    </div>

                    <div className="detection-details">
                        <h5>� File Information</h5>
                        <div className="details-grid">
                            <div className="detail-item">
                                <strong>File Name:</strong>
                                <span>{detectionResult.fileName}</span>
                            </div>
                            <div className="detail-item">
                                <strong>File Size:</strong>
                                <span>{(detectionResult.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                            <div className="detail-item">
                                <strong>Detection Time:</strong>
                                <span>{new Date(detectionResult.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="detail-item">
                                <strong>Status:</strong>
                                <span className={detectionResult.detected ? 'status-detected' : 'status-clear'}>
                                    {detectionResult.detected ? 'Drone Present' : 'Clear'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Info Section */}
            <div className="info-section">
                <h4>ℹ️ About This Feature</h4>
                <div className="info-content">
                    <p>
                        This AI-powered tool analyzes WAV audio recordings to detect drone sounds. 
                        The detection algorithm uses machine learning to identify acoustic signatures 
                        unique to drone propellers and motors.
                    </p>
                    <div className="info-features">
                        <div className="info-feature">
                            <strong>🎯 Real-time Detection:</strong>
                            <span>Quickly identifies drone sounds in uploaded WAV audio</span>
                        </div>
                        <div className="info-feature">
                            <strong>🧠 AI Classification:</strong>
                            <span>Uses trained models to detect drone acoustic patterns</span>
                        </div>
                        <div className="info-feature">
                            <strong>📈 Accurate Analysis:</strong>
                            <span>Analyzes frequency patterns and sound characteristics</span>
                        </div>
                    </div>
                    <p className="info-note">
                        <strong>Note:</strong> Only WAV format is supported. Ensure your audio file is in the correct format for accurate results.
                    </p>
                </div>
            </div>
        </div>
    );
}
