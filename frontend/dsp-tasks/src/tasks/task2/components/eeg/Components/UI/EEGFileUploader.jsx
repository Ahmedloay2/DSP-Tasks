import React from 'react';
import './EEGFileUploader.css';

/**
 * EEG File Uploader Component - Handles EEG file uploads (.edf and .set)
 * @param {Object} props - Component props
 * @param {Object} props.files - Current file state
 * @param {Function} props.onFileChange - File change handler
 * @param {Function} props.onSubmit - Form submission handler
 * @param {boolean} props.isLoading - Loading state
 * @param {string} props.uploadStatus - Upload status
 * @param {Object} props.streamingState - Streaming connection state
 * @param {boolean} props.useMockData - Whether using mock data
 * @returns {JSX.Element} File uploader component
 */
export default function EEGFileUploader({ 
    files, 
    onFileChange, 
    onSubmit, 
    isLoading, 
    uploadStatus, 
    streamingState,
    useMockData,
    loadingProgress = '' 
}) {
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(e);
    };

    const getFileIcon = (fileType) => {
        const icons = {
            edf: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
            ),
            set: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
                </svg>
            )
        };
        return icons[fileType] || icons.edf;
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    if (useMockData) {
        return null; // Don't show upload form when using mock data
    }

    return (
        <div className="task2-task1-eeg-upload-section">
            <form className='task2-task1-eeg-form' onSubmit={handleSubmit}>
                <div className='task2-task1-eeg-inputs-container'>
                    {/* EDF File Input */}
                    <div className='task2-task1-eeg-input-group'>
                        <label htmlFor="edf-file">
                            {getFileIcon('edf')}
                            EEG Data File (.edf)
                        </label>
                        <input 
                            id="edf-file"
                            type='file' 
                            accept='.edf'
                            onChange={(e) => onFileChange(e, 'edf')}
                            disabled={isLoading}
                        />
                        {files.edf && (
                            <div className="task2-file-selected">
                                <span className="task2-file-name">{files.edf.name}</span>
                                <span className="task2-file-size">
                                    ({formatFileSize(files.edf.size)})
                                </span>
                            </div>
                        )}
                        <div className="task2-file-help-text">
                            💡 European Data Format - Standard format for EEG recordings
                        </div>
                    </div>
                    
                    {/* SET File Input */}
                    <div className='task2-task1-eeg-input-group'>
                        <label htmlFor="set-file">
                            {getFileIcon('set')}
                            EEG Data File (.set) - Alternative
                        </label>
                        <input 
                            id="set-file"
                            type='file' 
                            accept='.set'
                            onChange={(e) => onFileChange(e, 'set')}
                            disabled={isLoading}
                        />
                        {files.set && (
                            <div className="task2-file-selected">
                                <span className="task2-file-name">{files.set.name}</span>
                                <span className="task2-file-size">
                                    ({formatFileSize(files.set.size)})
                                </span>
                            </div>
                        )}
                        <div className="task2-file-help-text">
                            💡 EEGLAB SET format - Used by EEGLAB software
                        </div>
                    </div>
                </div>
                
                {/* Submit Button */}
                <button
                    className={`task2-task1-eeg-submit-btn ${uploadStatus}`}
                    type='submit'
                    disabled={isLoading || (!files.edf && !files.set)}
                >
                    {isLoading ? (
                        <>
                            <div className="task2-loading-spinner"></div>
                            {loadingProgress || 'Uploading & Processing...'}
                        </>
                    ) : (
                        <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9,16.17L4.83,12l-1.42,1.41L9,19 21,7l-1.41-1.41z"/>
                            </svg>
                            Upload EEG File
                        </>
                    )}
                </button>
                
                {/* Upload Progress */}
                {uploadStatus === 'uploading' && (
                    <div className="task2-upload-progress">
                        <div className="task2-progress-bar">
                            <div className="task2-progress-fill"></div>
                        </div>
                        <span className="task2-progress-text">
                            {loadingProgress || 'Processing EEG data...'}
                        </span>
                    </div>
                )}
                
                {/* WebSocket Connection Status */}
                {streamingState.sessionId && (
                    <div className={`task2-websocket-status ${streamingState.connectionStatus}`}>
                        <span className="task2-status-indicator"></span>
                        <span className="task2-status-text">
                            {streamingState.connectionStatus === 'connected' && 'Real-time streaming ready'}
                            {streamingState.connectionStatus === 'connecting' && 'Connecting to server...'}
                            {streamingState.connectionStatus === 'disconnected' && 'Disconnected from server'}
                            {streamingState.connectionStatus === 'error' && 'Connection error'}
                            {streamingState.connectionStatus === 'unavailable' && 'Server unavailable - using fallback'}
                        </span>
                    </div>
                )}
            </form>
        </div>
    );
}
