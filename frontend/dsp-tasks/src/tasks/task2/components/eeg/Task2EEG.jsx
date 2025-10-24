import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MultiChannelEEGViewer from './MultiChannelEEGViewer';
import Header from './Components/UI/EEGHeader.jsx';
import EEGFileUploader from './Components/UI/EEGFileUploader.jsx';
import ResamplingSection from './Components/Resampling/ResamplingSection.jsx';
import RealEEGService from './services/RealEEGService';
import './Task2EEG.css';

export default function Task2EEG() {
    const [apiMode, setApiMode] = useState('real');
    const [, setFiles] = useState({
        edf: null,
        set: null
    });

    const [ui, setUI] = useState({
        error: null,
        uploadStatus: 'idle',
        recordName: null,
        isLoading: false,
        loadingProgress: ''
    });

    const [channelMetadata, setChannelMetadata] = useState(null);
    const [preloadedChannelData, setPreloadedChannelData] = useState(null);

    const [streamingState] = useState({
        connectionStatus: 'disconnected',
        sessionId: null
    });

    const handleFileUpload = useCallback(async (uploadedFiles) => {
        setUI(prev => ({
            ...prev,
            isLoading: true,
            error: null,
            loadingProgress: 'Uploading files...'
        }));

        try {
            const { edf } = uploadedFiles;
            
            if (!edf) {
                throw new Error('EDF file is required');
            }

            setUI(prev => ({
                ...prev,
                loadingProgress: 'Processing EEG data with 500Hz sampling...'
            }));

            // Call API to upload and fetch all channels with initial sampling frequency of 500Hz
            const response = await RealEEGService.uploadEEGFile(edf, 500);

            if (response.success) {
                // Extract metadata for display
                const channelMetadata = {
                    channelCount: response.channelCount,
                    duration: response.duration,
                    samplingRate: response.samplingRate,
                    sampleCount: response.sampleCount,
                    channelNames: response.channelNames
                };

                // Prepare preloaded channel data
                const preloadedData = {
                    channels: response.channels,
                    metadata: response.metadata
                };

                setChannelMetadata(channelMetadata);
                setPreloadedChannelData(preloadedData);
                
                setFiles(uploadedFiles);
                setUI({
                    error: null,
                    uploadStatus: 'success',
                    recordName: response.recordName,
                    isLoading: false,
                    loadingProgress: ''
                });
            } else {
                throw new Error('Failed to process EEG files');
            }
        } catch (err) {
            setUI(prev => ({
                ...prev,
                error: `Upload failed: ${err.message}`,
                isLoading: false,
                loadingProgress: ''
            }));
        }
    }, []);

    // Reset handler - clear everything and start fresh
    const handleReset = useCallback(() => {
        setFiles({ edf: null, set: null });
        setUI({
            error: null,
            uploadStatus: 'idle',
            recordName: null,
            isLoading: false,
            loadingProgress: ''
        });
        setChannelMetadata(null);
        setPreloadedChannelData(null);
    }, []);

    // Toggle API mode
    const toggleApiMode = useCallback(() => {
        setApiMode(prev => prev === 'real' ? 'mock' : 'real');
    }, []);

    return (
        <div className="task2-eeg-container">
            <Link to="/task2" className="task2-back-link">
                ← Back to Task 2 Home
            </Link>

            <div className="task2-eeg-header">
                <Header/>
            </div>

            {/* API Mode Toggle */}
            <div className="task2-api-mode-toggle-container">
                <div className="task2-api-mode-info">
                    <span className="task2-mode-icon">{apiMode === 'real' ? '🌐' : '🧪'}</span>
                    <div className="task2-mode-text">
                        <strong>{apiMode === 'real' ? 'Real API Mode' : 'Mock API Mode'}</strong>
                        <span className="task2-mode-description">
                            {apiMode === 'real' 
                                ? 'Using production API endpoints' 
                                : 'Using mock data for testing'}
                        </span>
                    </div>
                </div>
                <button 
                    className={`task2-api-mode-toggle-btn ${apiMode}`}
                    onClick={toggleApiMode}
                    title={`Switch to ${apiMode === 'real' ? 'Mock' : 'Real'} API`}
                >
                    <span className="task2-toggle-track">
                        <span className="task2-toggle-thumb"></span>
                    </span>
                    <span className="task2-toggle-label">
                        {apiMode === 'real' ? 'Real API' : 'Mock API'}
                    </span>
                </button>
            </div>

            {/* Error Banner */}
            {ui.error && (
                <div className="task2-error-banner">
                    <span className="task2-error-icon">⚠️</span>
                    <span className="task2-error-text">{ui.error}</span>
                    <button 
                        className="task2-error-close"
                        onClick={() => setUI(prev => ({ ...prev, error: null }))}
                    >
                        ×
                    </button>
                </div>
            )}

            {ui.uploadStatus !== 'success' ? (
                // File Upload Section
                <div className="task2-eeg-upload-section">
                    <EEGFileUploader
                        onFileUpload={handleFileUpload}
                        isLoading={ui.isLoading}
                        loadingProgress={ui.loadingProgress}
                        streamingState={streamingState}
                    />
                </div>
            ) : (
                // EEG Viewer Interface - Real Signal with Multi-Channel Viewer
                <div className="task2-eeg-viewer-wrapper">
                    <div className="task2-record-info-bar">
                        <div className="task2-record-name">
                            <span className="task2-label">Record Name:</span>
                            <span className="task2-value">{ui.recordName}</span>
                        </div>
                        {channelMetadata && (
                            <div className="task2-channel-metadata">
                                <span className="task2-metadata-item">
                                    📊 {channelMetadata.channelCount} channels
                                </span>
                                <span className="task2-metadata-item">
                                    ⏱ {channelMetadata.duration}s
                                </span>
                                <span className="task2-metadata-item">
                                    📈 {channelMetadata.samplingRate}Hz
                                </span>
                            </div>
                        )}
                        <button onClick={handleReset} className="task2-reset-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
                            </svg>
                            Upload New Files
                        </button>
                    </div>

                    {/* Multi-Channel Viewer with 4 Modes (Continuous, XOR, Polar, Recurrence) */}
                    {/* This includes the Classification/Detection section inside */}
                    <MultiChannelEEGViewer 
                        recordName={ui.recordName}
                        channelMetadata={channelMetadata}
                        preloadedData={preloadedChannelData}
                        apiMode={apiMode}
                    />

                    {/* Resampling Section - Below the Classification */}
                    <ResamplingSection recordName={ui.recordName} apiMode={apiMode} />
                </div>
            )}
        </div>
    );
}

