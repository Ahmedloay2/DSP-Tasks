import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MultiChannelEEGViewer from './MultiChannelEEGViewer';
import Header from './Components/UI/EEGHeader.jsx';
import EEGFileUploader from './Components/UI/EEGFileUploader.jsx';
import RealEEGDataService from './services/RealEEGDataService';
import './Task1EEG.css';

/**
 * Task1EEG Component
 * Entry point for 12-channel EEG visualization task with file upload
 */
export default function Task1EEG() {
    // File upload state
    const [files, setFiles] = useState({
        edf: null,
        set: null
    });

    // UI state
    const [ui, setUI] = useState({
        error: null,
        uploadStatus: 'idle', // 'idle', 'uploading', 'success'
        recordName: null,
        isLoading: false,
        loadingProgress: '' // Progress message during channel loading
    });

    // Channel metadata and pre-loaded data from API
    const [channelMetadata, setChannelMetadata] = useState(null);
    const [preloadedChannelData, setPreloadedChannelData] = useState(null);

    // Streaming state for the file uploader
    const [streamingState] = useState({
        connectionStatus: 'disconnected',
        sessionId: null
    });

    // File upload handler
    const handleFileChange = useCallback((event, fileType) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const validExtensions = {
            'edf': '.edf',
            'set': '.set'
        };
        
        const expectedExt = validExtensions[fileType];
        if (!file.name.endsWith(expectedExt)) {
            setUI(prev => ({ 
                ...prev, 
                error: `Please select a valid ${fileType} file (${expectedExt})`
            }));
            return;
        }
        
        setFiles(prev => ({ ...prev, [fileType]: file }));
        setUI(prev => ({ ...prev, error: null }));
    }, []);

    // Extract record name from files and upload to API
    const handleSubmit = useCallback(async (event) => {
        event.preventDefault();
        
        if (!files.edf && !files.set) {
            setUI(prev => ({ ...prev, error: 'Please upload either an EDF or SET file' }));
            return;
        }

        // Get the uploaded file
        const uploadedFile = files.edf || files.set;
        
        try {
            // Set loading state
            setUI(prev => ({
                ...prev,
                isLoading: true,
                uploadStatus: 'uploading',
                error: null,
                loadingProgress: 'Analyzing file and fetching channel data...'
            }));

            // Upload file to API and get ALL channel data pre-loaded
            // This now fetches all channels before returning!
            const response = await RealEEGDataService.uploadEEGFile(uploadedFile);
            
            console.log('✅ Upload complete! All channels loaded:', response);
            
            // Store channel metadata
            setChannelMetadata({
                channelCount: response.channelCount,
                channelNames: response.channelNames || [],
                samplingRate: response.samplingRate || 256,
                duration: response.duration,
                sampleCount: response.sampleCount,
                subjectNumber: response.subjectNumber
            });
            
            // Store pre-loaded channel data
            setPreloadedChannelData({
                channels: response.channels,
                metadata: response.metadata
            });
            
            setUI(prev => ({
                ...prev,
                error: null,
                uploadStatus: 'success',
                recordName: response.recordName || uploadedFile.name.replace(/\.(edf|set)$/, ''),
                isLoading: false,
                loadingProgress: ''
            }));
            
            console.log(`🎉 Ready to visualize ${response.channelCount} channels with ${response.sampleCount} samples each!`);
        } catch (error) {
            console.error('❌ File upload error:', error);
            setUI(prev => ({
                ...prev,
                error: `Failed to upload file: ${error.message}`,
                uploadStatus: 'idle',
                isLoading: false,
                loadingProgress: ''
            }));
        }
    }, [files]);

    // Reset form
    const handleReset = useCallback(() => {
        setFiles({ edf: null, set: null });
        setUI({ error: null, uploadStatus: 'idle', recordName: null, isLoading: false, loadingProgress: '' });
        setChannelMetadata(null);
        setPreloadedChannelData(null);
    }, []);

    return (
        <div className="task1-eeg-container">
            <Link to="/task1" className="back-link">
                ← Back to Task 1 Home
            </Link>

            <div className="task1-eeg-header">
                <Header/>
                {/*<h1>12-Channel EEG Signal Viewer</h1>
                <p>Upload EEG files to visualize multi-channel brain wave data with advanced processing</p>
            */}</div>

            {/* Error Display */}
            {ui.error && (
                <div className="error-banner">
                    <span className="error-icon">⚠️</span>
                    {ui.error}
                    <button onClick={() => setUI(prev => ({ ...prev, error: null }))} className="error-close">
                        ×
                    </button>
                </div>
            )}

            {ui.uploadStatus !== 'success' ? (
                // File Upload Form
                <EEGFileUploader
                    files={files}
                    onFileChange={handleFileChange}
                    onSubmit={handleSubmit}
                    isLoading={ui.isLoading}
                    uploadStatus={ui.uploadStatus}
                    streamingState={streamingState}
                    useMockData={false}
                    loadingProgress={ui.loadingProgress}
                />
            ) : (
                // EEG Viewer Interface
                <div className="task1-eeg-viewer-wrapper">
                    <div className="record-info-bar">
                        <div className="record-name">
                            <span className="label">Record Name:</span>
                            <span className="value">{ui.recordName}</span>
                        </div>
                        {channelMetadata && (
                            <div className="channel-info">
                                <span className="label">Channels:</span>
                                <span className="value">{channelMetadata.channelCount}</span>
                            </div>
                        )}
                        <button onClick={handleReset} className="reset-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
                            </svg>
                            Upload New Files
                        </button>
                    </div>
                    <MultiChannelEEGViewer 
                        recordName={ui.recordName} 
                        channelMetadata={channelMetadata}
                        preloadedData={preloadedChannelData}
                    />
                </div>
            )}
        </div>
    );
}
