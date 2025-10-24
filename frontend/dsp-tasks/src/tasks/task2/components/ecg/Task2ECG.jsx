import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MultiChannelECGViewer from './MultiChannelECGViewer';
import Header from './Components/UI/ECGHeader.jsx';
import ResamplingSection from './Components/Resampling/ResamplingSection.jsx';
import './Task2ECG.css';

export default function Task2ECG() {
    const [apiMode, setApiMode] = useState('real');
    const [files, setFiles] = useState({
        header: null,
        data: null
    });

    const [ui, setUI] = useState({
        error: null,
        uploadStatus: 'idle',
        recordName: null
    });

    const handleFileChange = useCallback((event, fileType) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const validExtensions = {
            'header': '.hea',
            'data': '.dat'
        };
        
        const expectedExt = validExtensions[fileType];
        if (!file.name.endsWith(expectedExt)) {
            setUI(prev => ({ 
                ...prev, 
                error: `Invalid file type. Expected ${expectedExt} file.` 
            }));
            return;
        }
        
        setFiles(prev => ({
            ...prev,
            [fileType]: file
        }));
        
        // Clear error when valid file is selected
        if (ui.error) {
            setUI(prev => ({ ...prev, error: null }));
        }
    }, [ui.error]);

    // Form submission handler
    const handleSubmit = useCallback((event) => {
        event.preventDefault();
        
        if (!files.header || !files.data) {
            setUI(prev => ({ 
                ...prev, 
                error: 'Please upload both header (.hea) and data (.dat) files' 
            }));
            return;
        }

        const recordName = files.header.name.replace('.hea', '');
        
        setUI({
            error: null,
            uploadStatus: 'success',
            recordName: recordName
        });
    }, [files]);

    // Reset handler - clear everything and start fresh
    const handleReset = useCallback(() => {
        setFiles({ header: null, data: null });
        setUI({
            error: null,
            uploadStatus: 'idle',
            recordName: null
        });
    }, []);

    // Toggle API mode
    const toggleApiMode = useCallback(() => {
        setApiMode(prev => prev === 'real' ? 'mock' : 'real');
    }, []);

    return (
        <div className="task2-ecg-container">
            <Link to="/task2" className="task2-back-link">
                ← Back to Task 2 Home
            </Link>

            <div className="task2-ecg-header">
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
                // File Upload Form
                <div className="task2-ecg-upload-section">
                    <form className='task2-ecg-form' onSubmit={handleSubmit}>
                        <div className='task2-ecg-inputs-container'>
                            <div className='task2-ecg-input-group'>
                                <label htmlFor="header-file">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                                    </svg>
                                    ECG Header File (.hea)
                                </label>
                                <input 
                                    id="header-file"
                                    type='file' 
                                    accept='.hea'
                                    onChange={(e) => handleFileChange(e, 'header')}
                                />
                                {files.header && (
                                    <div className="task2-file-selected">
                                        <span className="task2-file-name">{files.header.name}</span>
                                        <span className="task2-file-size">
                                            ({(files.header.size / 1024).toFixed(1)} KB)
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            <div className='task2-ecg-input-group'>
                                <label htmlFor="data-file">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
                                    </svg>
                                    ECG Data File (.dat)
                                </label>
                                <input 
                                    id="data-file"
                                    type='file' 
                                    accept='.dat'
                                    onChange={(e) => handleFileChange(e, 'data')}
                                />
                                {files.data && (
                                    <div className="task2-file-selected">
                                        <span className="task2-file-name">{files.data.name}</span>
                                        <span className="task2-file-size">
                                            ({(files.data.size / 1024).toFixed(1)} KB)
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <button
                            className="task2-ecg-submit-btn"
                            type='submit'
                            disabled={!files.header || !files.data}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9,16.17L4.83,12l-1.42,1.41L9,19 21,7l-1.41-1.41z"/>
                            </svg>
                            Load ECG Files
                        </button>
                    </form>
                </div>
            ) : (
                // ECG Viewer Interface - Real Signal with Multi-Channel Viewer
                <div className="task2-ecg-viewer-wrapper">
                    <div className="task2-record-info-bar">
                        <div className="task2-record-name">
                            <span className="task2-label">Record Name:</span>
                            <span className="task2-value">{ui.recordName}</span>
                        </div>
                        <button onClick={handleReset} className="task2-reset-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
                            </svg>
                            Upload New Files
                        </button>
                    </div>

                    {/* Multi-Channel Viewer with 4 Modes (Continuous, XOR, Polar, Recurrence) */}
                    {/* This includes the Classification/Detection section inside */}
                    <MultiChannelECGViewer recordName={ui.recordName} apiMode={apiMode} />

                    {/* Resampling Section - Below the Classification 
                    <ResamplingSection recordName={ui.recordName} apiMode={apiMode} />*/}
                </div>
            )}
        </div>
    );
}
