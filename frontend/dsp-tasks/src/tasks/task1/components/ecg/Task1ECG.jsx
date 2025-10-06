import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MultiChannelECGViewer from './MultiChannelECGViewer';
import Header from './Components/UI/ECGHeader.jsx';
import './Task1ECG.css';

/**
 * Task1ECG Component
 * Entry point for 12-channel ECG visualization task with file upload
 */
export default function Task1ECG() {
    // File upload state
    const [files, setFiles] = useState({
        header: null,
        data: null
    });

    // UI state
    const [ui, setUI] = useState({
        error: null,
        uploadStatus: 'idle', // 'idle', 'success'
        recordName: null
    });

    // File upload handler
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
                error: `Please select a valid ${fileType} file (${expectedExt})`
            }));
            return;
        }
        
        setFiles(prev => ({ ...prev, [fileType]: file }));
        setUI(prev => ({ ...prev, error: null }));
    }, []);

    // Extract record name from files
    const handleSubmit = useCallback((event) => {
        event.preventDefault();
        
        if (!files.header || !files.data) {
            setUI(prev => ({ ...prev, error: 'Please upload both header and data files' }));
            return;
        }

        // Extract record name (filename without extension)
        const recordName = files.header.name.replace('.hea', '');
        
        setUI({
            error: null,
            uploadStatus: 'success',
            recordName: recordName
        });
    }, [files]);

    // Reset form
    const handleReset = useCallback(() => {
        setFiles({ header: null, data: null });
        setUI({ error: null, uploadStatus: 'idle', recordName: null });
    }, []);

    return (
        <div className="task1-ecg-container">
            <Link to="/task1" className="back-link">
                ← Back to Task 1 Home
            </Link>

            <div className="task1-ecg-header">
                <Header/>
                {/*<h1>12-Channel ECG Signal Viewer</h1>
                <p>Upload ECG files to visualize multi-channel data with advanced processing</p>
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
                <div className="task1-ecg-upload-section">
                    <form className='task1-ecg-form' onSubmit={handleSubmit}>
                        <div className='task1-ecg-inputs-container'>
                            <div className='task1-ecg-input-group'>
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
                                    <div className="file-selected">
                                        <span className="file-name">{files.header.name}</span>
                                        <span className="file-size">
                                            ({(files.header.size / 1024).toFixed(1)} KB)
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            <div className='task1-ecg-input-group'>
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
                                    <div className="file-selected">
                                        <span className="file-name">{files.data.name}</span>
                                        <span className="file-size">
                                            ({(files.data.size / 1024).toFixed(1)} KB)
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <button
                            className="task1-ecg-submit-btn"
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
                // ECG Viewer Interface
                <div className="task1-ecg-viewer-wrapper">
                    <div className="record-info-bar">
                        <div className="record-name">
                            <span className="label">Record Name:</span>
                            <span className="value">{ui.recordName}</span>
                        </div>
                        <button onClick={handleReset} className="reset-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
                            </svg>
                            Upload New Files
                        </button>
                    </div>
                    <MultiChannelECGViewer recordName={ui.recordName} />
                </div>
            )}
        </div>
    );
}
