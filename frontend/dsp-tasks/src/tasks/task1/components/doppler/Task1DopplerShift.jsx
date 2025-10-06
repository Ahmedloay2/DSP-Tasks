import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DopplerGenerator from './components/DopplerGenerator';
import DopplerAnalyzer from './components/DopplerAnalyzer';
import DopplerSignalViewer from './components/DopplerSignalViewer';
import DopplerHeader from './components/DopplerHeader';
import DroneDetector from './components/DroneDetector';
import DopplerApiService from './services/DopplerApiService';
import './Task1DopplerShift.css';

export default function Task1DopplerShift() {
    // Active tab state
    const [activeTab, setActiveTab] = useState('generate');
    
    // UI state
    const [ui, setUI] = useState({
        isLoading: false,
        error: null,
        successMessage: null
    });

    // Generated audio state
    const [generatedAudio, setGeneratedAudio] = useState({
        audioUrl: null,
        metadata: null,
        sessionId: null
    });

    // Analysis results state
    const [analysisResults, setAnalysisResults] = useState(null);

    // Detection results state
    const [detectionResults, setDetectionResults] = useState(null);

    // Error display helper
    const showError = useCallback((message) => {
        setUI(prev => ({ ...prev, error: message }));
        setTimeout(() => {
            setUI(prev => ({ ...prev, error: null }));
        }, 5000);
    }, []);

    // Success message helper
    const showSuccess = useCallback((message) => {
        setUI(prev => ({ ...prev, successMessage: message }));
        setTimeout(() => {
            setUI(prev => ({ ...prev, successMessage: null }));
        }, 3000);
    }, []);

    // Handle audio generation completion
    const handleAudioGenerated = useCallback((result) => {
        setGeneratedAudio({
            audioUrl: result.audioUrl,
            metadata: result.metadata,
            sessionId: result.sessionId
        });
        showSuccess('Audio generated successfully! 🎵');
    }, [showSuccess]);

    // Handle analysis completion
    const handleAnalysisComplete = useCallback((result) => {
        setAnalysisResults(result);
        showSuccess('Audio analysis completed! 📊');
    }, [showSuccess]);

    // Handle detection completion
    const handleDetectionComplete = useCallback((result) => {
        setDetectionResults(result);
        if (result.detected) {
            showSuccess(`${result.vehicleType} detected with ${(result.confidence * 100).toFixed(1)}% confidence! 🎯`);
        } else {
            showSuccess('Analysis complete. No vehicle detected.');
        }
    }, [showSuccess]);

    // Handle audio download
    const handleDownloadAudio = useCallback(() => {
        try {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
            const filename = `doppler_audio_${timestamp}.wav`;
            DopplerApiService.downloadAudio(filename);
            showSuccess(`Audio downloaded as ${filename}`);
        } catch (error) {
            showError(`Download failed: ${error.message}`);
        }
    }, [showError, showSuccess]);

    // Clear generated audio
    const clearGeneratedAudio = useCallback(() => {
        if (generatedAudio.audioUrl) {
            URL.revokeObjectURL(generatedAudio.audioUrl);
        }
        setGeneratedAudio({
            audioUrl: null,
            metadata: null,
            sessionId: null
        });
    }, [generatedAudio.audioUrl]);

    // Clear analysis results
    const clearAnalysisResults = useCallback(() => {
        if (analysisResults && analysisResults.uploadedAudioUrl) {
            URL.revokeObjectURL(analysisResults.uploadedAudioUrl);
        }
        setAnalysisResults(null);
    }, [analysisResults]);

    // Clear detection results
    const clearDetectionResults = useCallback(() => {
        setDetectionResults(null);
    }, []);

    // Tab change handler
    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
        setUI(prev => ({ ...prev, error: null, successMessage: null }));
        
        // Clear analysis results when switching away from analyze tab
        if (tab !== 'analyze' && analysisResults) {
            clearAnalysisResults();
        }
        
        // Clear detection results when switching away from detect tab
        if (tab !== 'detect' && detectionResults) {
            clearDetectionResults();
        }
    }, [analysisResults, detectionResults, clearAnalysisResults, clearDetectionResults]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            DopplerApiService.clearSession();
        };
    }, []);

    return (
        <div className="task1-doppler-container">
            <Link to="/task1" className="back-link">
                ← Back to Task 1 Home
            </Link>

            <div className="task1-doppler-header">
                <DopplerHeader />
            </div>

            {/* Tab Navigation */}
            <div className="doppler-tabs">
                <div className="tabs-container">
                    <button
                        className={`tab-btn ${activeTab === 'generate' ? 'active' : ''}`}
                        onClick={() => handleTabChange('generate')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,6V12L15.2,14.2L16,12.9L12.5,11.1V6H11Z"/>
                        </svg>
                        Generate Audio
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'analyze' ? 'active' : ''}`}
                        onClick={() => handleTabChange('analyze')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
                        </svg>
                        Analyze Audio
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'detect' ? 'active' : ''}`}
                        onClick={() => handleTabChange('detect')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
                        </svg>
                        Detect Vehicle
                    </button>
                </div>
            </div>

            {/* Error and Success Messages */}
            {ui.error && (
                <div className="task1-doppler-error">
                    <div className="error-message">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/>
                        </svg>
                        {ui.error}
                    </div>
                    <button 
                        className="error-dismiss"
                        onClick={() => setUI(prev => ({ ...prev, error: null }))}
                        aria-label="Dismiss error"
                    >
                        ×
                    </button>
                </div>
            )}

            {ui.successMessage && (
                <div className="task1-doppler-success">
                    <div className="success-message">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z"/>
                        </svg>
                        {ui.successMessage}
                    </div>
                </div>
            )}

            {/* Tab Content */}
            <div className="doppler-tab-content">
                {activeTab === 'generate' && (
                    <div className="doppler-generate-layout">
                        <div className="generate-controls">
                            <DopplerGenerator
                                onAudioGenerated={handleAudioGenerated}
                                isLoading={ui.isLoading}
                                setIsLoading={(loading) => setUI(prev => ({ ...prev, isLoading: loading }))}
                                setError={showError}
                            />
                        </div>
                        
                        {generatedAudio.audioUrl && (
                            <div className="generate-results">
                                <div className="results-header">
                                    <h3>🎵 Generated Audio</h3>
                                    <button
                                        className="clear-btn"
                                        onClick={clearGeneratedAudio}
                                        title="Clear generated audio"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                                        </svg>
                                        Clear
                                    </button>
                                </div>
                                <DopplerSignalViewer
                                    audioUrl={generatedAudio.audioUrl}
                                    metadata={generatedAudio.metadata}
                                    onDownload={handleDownloadAudio}
                                    isGeneratedAudio={true}
                                />
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'analyze' && (
                    <div className="doppler-analyze-layout">
                        <div className="analyze-controls">
                            <DopplerAnalyzer
                                onAnalysisComplete={handleAnalysisComplete}
                                isLoading={ui.isLoading}
                                setIsLoading={(loading) => setUI(prev => ({ ...prev, isLoading: loading }))}
                                setError={showError}
                            />
                        </div>
                        
                        {analysisResults && (
                            <div className="analyze-results">
                                <div className="results-header">
                                    <h3>📊 Analysis Complete</h3>
                                    <button
                                        className="clear-btn"
                                        onClick={clearAnalysisResults}
                                        title="Clear analysis results"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                                        </svg>
                                        Clear
                                    </button>
                                </div>
                                
                                {/* Signal Visualization for Analyzed Audio */}
                                <DopplerSignalViewer
                                    audioUrl={analysisResults.uploadedAudioUrl}
                                    metadata={{
                                        sourceFrequency: analysisResults.analysis.estimatedSourceFrequency,
                                        sourceVelocity: analysisResults.analysis.estimatedSourceVelocity,
                                        duration: analysisResults.analysis.duration
                                    }}
                                    showPlaybackControls={true}
                                    isGeneratedAudio={false}
                                />
                                
                                <div className="analysis-summary">
                                    <p>Analysis completed for <strong>{analysisResults.fileName}</strong></p>
                                    <p>Estimated source frequency: <strong>{analysisResults.analysis.estimatedSourceFrequency} Hz</strong></p>
                                    <p>Estimated source velocity: <strong>{analysisResults.analysis.estimatedSourceVelocity} m/s</strong></p>
                                    <p>Confidence: <strong>{(analysisResults.analysis.confidence * 100).toFixed(1)}%</strong></p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'detect' && (
                    <div className="doppler-detect-layout">
                        <DroneDetector
                            onDetectionComplete={handleDetectionComplete}
                            isLoading={ui.isLoading}
                            setIsLoading={(loading) => setUI(prev => ({ ...prev, isLoading: loading }))}
                            setError={showError}
                        />
                    </div>
                )}
            </div>

            {/* Loading Overlay */}
            {ui.isLoading && (
                <div className="loading-overlay">
                    <div className="loading-content">
                        <div className="loading-spinner-large"></div>
                        <p>
                            {activeTab === 'generate' 
                                ? 'Generating Doppler shifted audio...' 
                                : activeTab === 'analyze'
                                ? 'Analyzing audio for Doppler effect...'
                                : 'Detecting vehicle sounds...'
                            }
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}