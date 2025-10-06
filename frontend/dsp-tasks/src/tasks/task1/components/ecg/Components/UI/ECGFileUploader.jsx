import React from 'react';
import './ECGFileUploader.css';

/**
 * ECG File Uploader Component - Handles WFDB file uploads (.hea, .dat, .atr)
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
export default function ECGFileUploader({ 
    files, 
    onFileChange, 
    onSubmit, 
    isLoading, 
    uploadStatus, 
    streamingState,
    useMockData 
}) {
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(e);
    };

    const getFileIcon = (fileType) => {
        const icons = {
            header: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
            ),
            data: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
                </svg>
            ),
            atr: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M15,18V16H6V18H15M18,14V12H6V14H18Z"/>
                </svg>
            )
        };
        return icons[fileType] || icons.header;
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
        <div className="task1-ecg-upload-section">
            <form className='task1-ecg-form' onSubmit={handleSubmit}>
                <div className='task1-ecg-inputs-container'>
                    {/* Header File Input */}
                    <div className='task1-ecg-input-group'>
                        <label htmlFor="header-file">
                            {getFileIcon('header')}
                            ECG Header File (.hea)
                        </label>
                        <input 
                            id="header-file"
                            type='file' 
                            accept='.hea'
                            onChange={(e) => onFileChange(e, 'header')}
                            disabled={isLoading}
                        />
                        {files.header && (
                            <div className="file-selected">
                                <span className="file-name">{files.header.name}</span>
                                <span className="file-size">
                                    ({formatFileSize(files.header.size)})
                                </span>
                            </div>
                        )}
                    </div>
                    
                    {/* Data File Input */}
                    <div className='task1-ecg-input-group'>
                        <label htmlFor="data-file">
                            {getFileIcon('data')}
                            ECG Data File (.dat)
                        </label>
                        <input 
                            id="data-file"
                            type='file' 
                            accept='.dat'
                            onChange={(e) => onFileChange(e, 'data')}
                            disabled={isLoading}
                        />
                        {files.data && (
                            <div className="file-selected">
                                <span className="file-name">{files.data.name}</span>
                                <span className="file-size">
                                    ({formatFileSize(files.data.size)})
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Annotation File Input */}
                    <div className='task1-ecg-input-group'>
                        <label htmlFor="atr-file">
                            {getFileIcon('atr')}
                            ECG Annotation File (.atr) - Optional
                        </label>
                        <input 
                            id="atr-file"
                            type='file' 
                            accept='.atr'
                            onChange={(e) => onFileChange(e, 'atr')}
                            disabled={isLoading}
                        />
                        {files.atr && (
                            <div className="file-selected">
                                <span className="file-name">{files.atr.name}</span>
                                <span className="file-size">
                                    ({formatFileSize(files.atr.size)})
                                </span>
                            </div>
                        )}
                        <div className="file-help-text">
                            💡 Annotation files contain beat annotations and rhythm classifications
                        </div>
                    </div>
                </div>
                
                {/* Submit Button */}
                <button
                    className={`task1-ecg-submit-btn ${uploadStatus}`}
                    type='submit'
                    disabled={isLoading || !files.header || !files.data}
                >
                    {isLoading ? (
                        <>
                            <div className="loading-spinner"></div>
                            Uploading & Processing...
                        </>
                    ) : (
                        <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9,16.17L4.83,12l-1.42,1.41L9,19 21,7l-1.41-1.41z"/>
                            </svg>
                            Upload ECG Files
                        </>
                    )}
                </button>
                
                {/* Upload Progress */}
                {uploadStatus === 'uploading' && (
                    <div className="upload-progress">
                        <div className="progress-bar">
                            <div className="progress-fill"></div>
                        </div>
                        <span className="progress-text">Processing ECG data...</span>
                    </div>
                )}
                
                {/* WebSocket Connection Status */}
                {streamingState.sessionId && (
                    <div className={`websocket-status ${streamingState.connectionStatus}`}>
                        <span className="status-indicator"></span>
                        <span className="status-text">
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