import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ECGApiService from './services/ECGApiService';
import { MockECGDataService as MockECGApiService } from './services/MockECGApiService';
import ECGViewer from './ECGViewer';
import ECGPlaybackControls from './Components/Controls/ECGPlaybackControls';
import ECGLeadControls from './Components/Controls/ECGLeadControls';
import './Task1ECG.css';

export default function Task1ECG() {
    // Configuration state
    const [config, setConfig] = useState({
        useMockData: true,
        mockCondition: 'normal',
        leadMode: '3_lead'
    });
    
    // Session and data state
    const [session, setSession] = useState({
        id: null,
        metadata: null,
        patientData: null,
        classificationResults: null
    });
    
    // Live streaming state
    const [streaming, setStreaming] = useState({
        data: null,
        status: 'stopped', // 'stopped', 'starting', 'streaming'
        realTimeHeartRate: 75
    });
    
    // UI state
    const [ui, setUI] = useState({
        isLoading: false,
        error: null,
        uploadStatus: 'idle' // 'idle', 'uploading', 'success', 'error'
    });

    // File upload state
    const [files, setFiles] = useState({
        header: null,
        data: null,
        atr: null
    });

    // Playback state
    const [playback, setPlayback] = useState({
        isPlaying: false,
        currentPosition: 0,
        duration: 0
    });

    // ECG display state
    const [display, setDisplay] = useState({
        visibleLeads: {},
        pausedLeadStates: {} // Track pause state per lead
    });

    // Initialize visible leads when mode changes
    useEffect(() => {
        const leadConfigs = {
            '3_lead': ['I', 'II', 'III'],
            '12_lead': ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6']
        };
        
        const currentLeads = leadConfigs[config.leadMode] || leadConfigs['3_lead'];
        const initialVisibleLeads = Object.fromEntries(
            currentLeads.map(lead => [lead, true])
        );
        
        setDisplay(prev => ({ ...prev, visibleLeads: initialVisibleLeads }));
    }, [config.leadMode]);

    // Optimized file upload handler
    const handleFileChange = useCallback((event, fileType) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const validExtensions = {
            'header': '.hea',
            'data': '.dat', 
            'atr': '.atr'
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

    // Optimized mock data generators with cached templates
    const mockDataTemplates = useMemo(() => ({
        patientProfiles: {
            normal: {
                ageRange: [20, 60],
                heartRateRange: [60, 80],
                genderProb: 0.5
            },
            atrial_fibrillation: {
                ageRange: [50, 80],
                heartRateRange: [90, 130],
                genderProb: 0.7 // More common in males
            },
            myocardial_infarction: {
                ageRange: [45, 70],
                heartRateRange: [55, 85],
                genderProb: 0.6
            },
            bundle_branch_block: {
                ageRange: [40, 75],
                heartRateRange: [65, 90],
                genderProb: 0.5
            }
        },
        classificationTemplates: {
            normal: {
                classification: 'Normal',
                confidence: 0.94,
                rhythm: 'Normal Sinus Rhythm',
                abnormalities: []
            },
            atrial_fibrillation: {
                classification: 'Abnormal',
                confidence: 0.89,
                rhythm: 'Atrial Fibrillation',
                abnormalities: ['Irregular R-R intervals', 'Absent P waves', 'Fibrillatory waves']
            },
            myocardial_infarction: {
                classification: 'Abnormal',
                confidence: 0.91,
                rhythm: 'Sinus Rhythm',
                abnormalities: ['ST elevation in leads II, III, aVF', 'Pathological Q waves', 'T-wave inversion']
            },
            bundle_branch_block: {
                classification: 'Abnormal',
                confidence: 0.87,
                rhythm: 'Sinus Rhythm',
                abnormalities: ['Wide QRS complex (>120ms)', 'Right bundle branch block pattern', 'RSR pattern in V1']
            }
        }
    }), []);
    
    const generateMockPatientData = useCallback((condition) => {
        const profile = mockDataTemplates.patientProfiles[condition] || mockDataTemplates.patientProfiles.normal;
        const [minAge, maxAge] = profile.ageRange;
        const [minHR, maxHR] = profile.heartRateRange;
        
        return {
            gender: Math.random() > profile.genderProb ? 'Male' : 'Female',
            age: Math.floor(Math.random() * (maxAge - minAge)) + minAge,
            heartRate: Math.floor(Math.random() * (maxHR - minHR)) + minHR,
            samplingRate: 500,
            patientId: `P${Math.floor(Math.random() * 9000) + 1000}`,
            recordingDate: new Date().toISOString().split('T')[0]
        };
    }, [mockDataTemplates]);

    const generateMockClassificationResults = useCallback((condition) => {
        const template = mockDataTemplates.classificationTemplates[condition] || 
                        mockDataTemplates.classificationTemplates.normal;
        
        return {
            ...template,
            heartRate: mockDataTemplates.patientProfiles[condition]?.heartRateRange[0] + 
                      Math.floor(Math.random() * 
                      (mockDataTemplates.patientProfiles[condition]?.heartRateRange[1] - 
                       mockDataTemplates.patientProfiles[condition]?.heartRateRange[0] || 15)),
            timestamp: new Date().toISOString()
        };
    }, [mockDataTemplates]);

    // Auto-stop helper function (moved before handlePlay to fix hoisting issue)
    const handleAutoStop = useCallback(async () => {
        try {
            await MockECGApiService.stopLiveStream();
            setStreaming({ data: null, status: 'stopped', realTimeHeartRate: 75 });
            setPlayback({ isPlaying: false, currentPosition: 0, duration: 0 });
            setSession(prev => ({ ...prev, id: null, metadata: null }));
        } catch (error) {
            setUI(prev => ({ ...prev, error: `Failed to auto-stop: ${error.message}` }));
        }
    }, []);

    // Optimized playback control methods
    const handlePlay = useCallback(async () => {
        if (!session.id) {
            setUI(prev => ({ ...prev, error: 'Please generate a mock session first' }));
            return;
        }
        
        const isMockSession = session.id.includes('mock_session');
        
        try {
            if (isMockSession && streaming.status !== 'streaming') {
                // Start live streaming for mock session
                setStreaming(prev => ({ ...prev, status: 'starting' }));
                
                const leads = config.leadMode === '3_lead' ? ['I', 'II', 'III'] : 
                             ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
                
                // Register callback for real-time data before starting stream
                MockECGApiService.registerStreamCallback((data) => {
                    setStreaming(prev => ({ ...prev, data }));
                    
                    const newPosition = Math.floor(data.streamTime * 250);
                    setPlayback(prev => ({ ...prev, currentPosition: newPosition }));
                    
                    // Auto-stop when reaching maximum duration
                    if (session.metadata?.duration && data.streamTime >= session.metadata.duration) {
                        handleAutoStop();
                    }
                });
                
                await MockECGApiService.startLiveStream(leads, 250, config.mockCondition);
                
                setStreaming(prev => ({ ...prev, status: 'streaming' }));
                setPlayback(prev => ({ ...prev, isPlaying: true, currentPosition: 0 }));
            } else if (streaming.status === 'streaming' && !playback.isPlaying) {
                // Resume paused live stream
                await MockECGApiService.resumeLiveStream();
                setPlayback(prev => ({ ...prev, isPlaying: true }));
            } else if (streaming.status !== 'streaming') {
                // Regular file playback
                const ApiService = isMockSession ? MockECGApiService : ECGApiService;
                const visibleLeadsList = Object.keys(display.visibleLeads).filter(lead => display.visibleLeads[lead]);
                
                const response = await ApiService.controlPlayback(session.id, 'play', playback.currentPosition, visibleLeadsList);
                setPlayback(prev => ({ ...prev, isPlaying: true, currentPosition: response.current_position }));
            }
        } catch (error) {
            setUI(prev => ({ ...prev, error: `Play failed: ${error.message}` }));
            setStreaming(prev => ({ ...prev, status: 'stopped' }));
        }
    }, [session.id, playback.currentPosition, display.visibleLeads, streaming.status, playback.isPlaying, 
        config.leadMode, config.mockCondition, session.metadata, handleAutoStop]);
        
    const handlePause = useCallback(async () => {
        if (streaming.status === 'streaming') {
            try {
                await MockECGApiService.pauseLiveStream();
                setPlayback(prev => ({ ...prev, isPlaying: false }));
            } catch (error) {
                setUI(prev => ({ ...prev, error: `Failed to pause live stream: ${error.message}` }));
            }
        } else if (session.id && streaming.status !== 'streaming') {
            try {
                const isMockSession = session.id.includes('mock_session');
                const ApiService = isMockSession ? MockECGApiService : ECGApiService;
                
                await ApiService.controlPlayback(session.id, 'pause');
                setPlayback(prev => ({ ...prev, isPlaying: false }));
            } catch (error) {
                setUI(prev => ({ ...prev, error: `Pause failed: ${error.message}` }));
            }
        }
    }, [session.id, streaming.status]);

    const handleStop = useCallback(async () => {
        try {
            // Always force stop the UI first
            setPlayback({ isPlaying: false, currentPosition: 0, duration: playback.duration || 0 });
            
            if (streaming.status === 'streaming') {
                try {
                    await MockECGApiService.stopLiveStream();
                    setStreaming({ data: null, status: 'stopped', realTimeHeartRate: 75 });
                    setSession(prev => ({ ...prev, id: null, metadata: null }));
                } catch (streamError) {
                    console.warn('Failed to stop live stream:', streamError);
                    // Force stop even if API fails
                    setStreaming({ data: null, status: 'stopped', realTimeHeartRate: 75 });
                }
            } else if (session.id) {
                try {
                    const isMockSession = session.id.includes('mock_session');
                    const ApiService = isMockSession ? MockECGApiService : ECGApiService;
                    
                    await ApiService.controlPlayback(session.id, 'stop');
                } catch (apiError) {
                    console.warn('API stop failed:', apiError);
                    // Continue with UI stop even if API fails
                }
            }
            
            // Clear any errors and ensure stopped state
            setUI(prev => ({ ...prev, error: null }));
        } catch (error) {
            // Final fallback - ensure everything is stopped
            setPlayback({ isPlaying: false, currentPosition: 0, duration: 0 });
            setStreaming({ data: null, status: 'stopped', realTimeHeartRate: 75 });
            setUI(prev => ({ ...prev, error: `Stop operation completed with warnings: ${error.message}` }));
        }
    }, [session.id, streaming.status, playback.duration]);

    const handleSeek = useCallback(async (position) => {
        if (!session.id || streaming.status === 'streaming') return;
        
        try {
            const isMockSession = session.id.includes('mock_session');
            const ApiService = isMockSession ? MockECGApiService : ECGApiService;
            
            const response = await ApiService.controlPlayback(session.id, 'seek', position);
            setPlayback(prev => ({ ...prev, currentPosition: response.current_position }));
        } catch (error) {
            setUI(prev => ({ ...prev, error: `Seek failed: ${error.message}` }));
        }
    }, [session.id, streaming.status]);

    // Poll for classification results
    const pollClassificationResults = useCallback(async (sessionId) => {
        try {
            const status = await ECGApiService.getClassificationStatus();
            
            if (status.completed) {
                const results = await ECGApiService.getClassification();
                setSession(prev => ({ ...prev, classificationResults: results }));
            } else {
                setTimeout(() => pollClassificationResults(sessionId), 2000);
            }
        } catch (error) {
            console.warn('Classification polling failed:', error.message);
        }
    }, []);

    // Optimized form submission handler
    const handleSubmit = useCallback(async (event) => {
        event.preventDefault();
        
        if (!config.useMockData && (!files.header || !files.data)) {
            setUI(prev => ({ ...prev, error: 'Please select both header (.hea) and data (.dat) files' }));
            return;
        }

        setUI(prev => ({ ...prev, isLoading: true, uploadStatus: 'uploading', error: null }));

        try {
            const ApiService = config.useMockData ? MockECGApiService : ECGApiService;
            const uploadResponse = config.useMockData
                ? await ApiService.generateTestData(config.mockCondition, config.leadMode)
                : await ApiService.uploadECGFiles(files.header, files.data, files.atr);
            
            if (uploadResponse.session_id) {
                const leads = uploadResponse.metadata?.leads || [];
                const detectedMode = leads.length <= 3 ? '3_lead' : '12_lead';
                const samples = uploadResponse.metadata?.samples || 0;
                
                setSession({
                    id: uploadResponse.session_id,
                    metadata: uploadResponse.metadata,
                    patientData: uploadResponse.metadata?.patient || null,
                    classificationResults: null
                });
                
                setConfig(prev => ({ ...prev, leadMode: detectedMode }));
                setPlayback(prev => ({ ...prev, duration: samples }));
                setUI(prev => ({ ...prev, uploadStatus: 'success' }));
                
                // Start polling for classification results if not using mock data
                if (!config.useMockData && uploadResponse.session_id) {
                    pollClassificationResults(uploadResponse.session_id);
                }
            }
        } catch (err) {
            setUI(prev => ({ ...prev, error: `Upload failed: ${err.message}`, uploadStatus: 'error' }));
        } finally {
            setUI(prev => ({ ...prev, isLoading: false }));
        }
    }, [files, config, pollClassificationResults]);

    // Optimized mock data generation
    const handleGenerateMockData = useCallback(async (condition = 'normal', mode = '12_lead') => {
        setUI(prev => ({ ...prev, isLoading: true, uploadStatus: 'uploading', error: null }));
        
        try {
            const MockECGApiServiceModule = await import('./services/MockECGApiService');
            const MockECGDataService = MockECGApiServiceModule.MockECGDataService;
            
            const sessionId = `mock_session_${Date.now()}`;
            const mockMetadata = MockECGDataService.generateMockMetadata(mode, false);
            mockMetadata.session_id = sessionId;
            mockMetadata.condition = condition;
            mockMetadata.duration = 30;
            mockMetadata.samples = mockMetadata.sampling_rate * mockMetadata.duration;
            
            MockECGApiService.currentSession = sessionId;
            MockECGApiService.mockData = {
                metadata: mockMetadata,
                data: {}
            };
            
            const results = generateMockClassificationResults(condition);
            const patient = generateMockPatientData(condition);
            
            setSession({
                id: sessionId,
                metadata: mockMetadata,
                patientData: patient,
                classificationResults: results
            });
            
            setConfig(prev => ({ ...prev, leadMode: mode, mockCondition: condition }));
            setPlayback({ isPlaying: false, currentPosition: 0, duration: mockMetadata.samples });
            setStreaming({ data: null, status: 'stopped', realTimeHeartRate: 75 });
            setUI(prev => ({ ...prev, uploadStatus: 'success' }));
            
        } catch (err) {
            setUI(prev => ({ ...prev, error: `Mock data generation failed: ${err.message}`, uploadStatus: 'error' }));
        } finally {
            setUI(prev => ({ ...prev, isLoading: false }));
        }
    }, [generateMockClassificationResults, generateMockPatientData]);

    // Optimized lead visibility handlers
    const handleLeadVisibilityChange = useCallback(async (newVisibleLeads) => {
        const newPausedStates = { ...display.pausedLeadStates };
        
        Object.entries(display.visibleLeads).forEach(([lead, wasVisible]) => {
            const willBeVisible = newVisibleLeads[lead];
            if (wasVisible && !willBeVisible && playback.isPlaying) {
                newPausedStates[lead] = playback.currentPosition;
            }
        });
        
        setDisplay({
            visibleLeads: newVisibleLeads,
            pausedLeadStates: newPausedStates
        });

        if (session.id && !config.useMockData) {
            try {
                for (const [lead, wasVisible] of Object.entries(display.visibleLeads)) {
                    const willBeVisible = newVisibleLeads[lead];
                    if (wasVisible !== willBeVisible) {
                        await ECGApiService.toggleLead(lead);
                    }
                }
            } catch (err) {
                setUI(prev => ({ ...prev, error: `Failed to update lead configuration: ${err.message}` }));
            }
        }
    }, [session.id, display, playback, config.useMockData]);

    const handleModeChange = useCallback(async (newMode) => {
        if (session.id && !playback.isPlaying) {
            try {
                const leadConfigs = {
                    '3_lead': ['I', 'II', 'III'],
                    '12_lead': ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6']
                };
                
                const ApiService = config.useMockData ? MockECGApiService : ECGApiService;
                await ApiService.setLeadConfiguration(session.id, newMode, leadConfigs[newMode]);
                
                setConfig(prev => ({ ...prev, leadMode: newMode }));
            } catch (err) {
                setUI(prev => ({ ...prev, error: `Failed to change mode: ${err.message}` }));
            }
        }
    }, [session.id, playback.isPlaying, config.useMockData]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (session.id) {
                const ApiService = config.useMockData ? MockECGApiService : ECGApiService;
                ApiService.deleteSession(session.id).catch(console.error);
            }
        };
    }, [session.id, config.useMockData]);

    return (
        <>
            <section className='task1-ecg-header'>
                <h1 className='task1-ecg-header-main'>Welcome to our ECG Signal Viewer</h1>
                <h4 className='task1-ecg-header-description'>What you can do here:</h4>
                <ul className='task1-ecg-header-list'>
                    <li className='task1-ecg-header-list-item'>View ECG signals in 3-lead or 12-lead modes</li>
                    <li className='task1-ecg-header-list-item'>Interactive playback with play/pause/stop controls</li>
                    <li className='task1-ecg-header-list-item'>Show/hide individual leads while maintaining numbering</li>
                    <li className='task1-ecg-header-list-item'>Real-time signal analysis and classification</li>
                </ul>
            </section>

            {/* Mode Toggle */}
            <div className="testing-controls">
                <div className="mode-toggle-section">
                    <h3>Testing Mode</h3>
                    <div className="mode-toggle">
                        <label className="toggle-label">
                            <input
                                type="checkbox"
                                checked={config.useMockData}
                                onChange={(e) => setConfig(prev => ({ ...prev, useMockData: e.target.checked }))}
                            />
                            <span className="toggle-text">
                                {config.useMockData ? '🧪 Using Mock Data (Testing)' : '🔌 Using Real API'}
                            </span>
                        </label>
                    </div>
                    
                    {config.useMockData && (
                        <div className="mock-controls">
                            <h4>Quick Test Data Generation</h4>
                            <div className="test-buttons">
                                <button 
                                    className="test-btn normal"
                                    onClick={() => handleGenerateMockData('normal', '3_lead')}
                                    disabled={ui.isLoading}
                                >
                                    Normal 3-Lead ECG
                                </button>
                                <button 
                                    className="test-btn normal"
                                    onClick={() => handleGenerateMockData('normal', '12_lead')}
                                    disabled={ui.isLoading}
                                >
                                    Normal 12-Lead ECG
                                </button>
                                <button 
                                    className="test-btn abnormal"
                                    onClick={() => handleGenerateMockData('atrial_fibrillation', '12_lead')}
                                    disabled={ui.isLoading}
                                >
                                    Atrial Fibrillation
                                </button>
                                <button 
                                    className="test-btn abnormal"
                                    onClick={() => handleGenerateMockData('myocardial_infarction', '12_lead')}
                                    disabled={ui.isLoading}
                                >
                                    Myocardial Infarction
                                </button>
                                <button 
                                    className="test-btn abnormal"
                                    onClick={() => handleGenerateMockData('bundle_branch_block', '12_lead')}
                                    disabled={ui.isLoading}
                                >
                                    Bundle Branch Block
                                </button>
                            </div>
                            
                            <div className="condition-selector">
                                <label htmlFor="condition-select">Custom Condition:</label>
                                <select 
                                    value={config.mockCondition} 
                                    onChange={(e) => setConfig(prev => ({ ...prev, mockCondition: e.target.value }))}
                                >
                                    <option value="normal">Normal ECG</option>
                                    <option value="atrial_fibrillation">Atrial Fibrillation</option>
                                    <option value="myocardial_infarction">Myocardial Infarction</option>
                                    <option value="bundle_branch_block">Bundle Branch Block</option>
                                    <option value="ventricular_tachycardia">Ventricular Tachycardia</option>
                                    <option value="bradycardia">Bradycardia</option>
                                    <option value="pacemaker">Pacemaker Rhythm</option>
                                </select>
                                
                                <select 
                                    value={config.leadMode} 
                                    onChange={(e) => setConfig(prev => ({ ...prev, leadMode: e.target.value }))}
                                    disabled={streaming.status === 'streaming'}
                                >
                                    <option value="3_lead">3-Lead Mode</option>
                                    <option value="12_lead">12-Lead Mode</option>
                                </select>
                                <button 
                                    onClick={() => handleGenerateMockData(config.mockCondition, config.leadMode)}
                                    disabled={ui.isLoading || streaming.status === 'streaming'}
                                    className="generate-btn"
                                >
                                    Generate Mock Session
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Error Display */}
            {ui.error && (
                <div className="task1-ecg-error">
                    <div className="error-message">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
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

            {ui.uploadStatus !== 'success' ? (
                // File Upload Form (only show if not using mock data)
                !config.useMockData && (
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
                                        disabled={ui.isLoading}
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
                                        disabled={ui.isLoading}
                                    />
                                    {files.data && (
                                        <div className="file-selected">
                                            <span className="file-name">{files.data.name}</span>
                                            <span className="file-size">
                                                ({(files.data.size / 1024 / 1024).toFixed(1)} MB)
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className='task1-ecg-input-group'>
                                    <label htmlFor="atr-file">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M15,18V16H6V18H15M18,14V12H6V14H18Z"/>
                                        </svg>
                                        ECG Annotation File (.atr) - Optional
                                    </label>
                                    <input 
                                        id="atr-file"
                                        type='file' 
                                        accept='.atr'
                                        onChange={(e) => handleFileChange(e, 'atr')}
                                        disabled={ui.isLoading}
                                    />
                                    {files.atr && (
                                        <div className="file-selected">
                                            <span className="file-name">{files.atr.name}</span>
                                            <span className="file-size">
                                                ({(files.atr.size / 1024).toFixed(1)} KB)
                                            </span>
                                        </div>
                                    )}
                                    <div className="file-help-text">
                                        💡 Annotation files contain beat annotations and rhythm classifications
                                    </div>
                                </div>
                            </div>
                            
                            <button
                                className={`task1-ecg-submit-btn ${ui.uploadStatus}`}
                                type='submit'
                                disabled={ui.isLoading || !files.header || !files.data}
                            >
                                {ui.isLoading ? (
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
                            
                            {ui.uploadStatus === 'uploading' && (
                                <div className="upload-progress">
                                    <div className="progress-bar">
                                        <div className="progress-fill"></div>
                                    </div>
                                    <span className="progress-text">Processing ECG data...</span>
                                </div>
                            )}
                        </form>
                    </div>
                )
            ) : (
                // ECG Viewer Interface - New Wide Layout
                <div className="task1-ecg-viewer-container-wide">
                    
                    {/* Top Section: Controls and Patient Data */}
                    <div className="ecg-top-section">
                        {/* Playback Controls - Above viewer */}
                        <div className="ecg-controls-top">
                            <ECGPlaybackControls
                                isPlaying={playback.isPlaying}
                                currentPosition={playback.currentPosition}
                                duration={playback.duration}
                                onPlay={handlePlay}
                                onPause={handlePause}
                                onStop={handleStop}
                                onSeek={handleSeek}
                                showShortcuts={false}
                            />
                        </div>

                        {/* Patient Data Panel - Right side */}
                        <div className="patient-data-panel">
                            <h3>Patient Information</h3>
                            {session.patientData || session.metadata ? (
                                <div className="patient-info-grid">
                                    <div className="info-box">
                                        <div className="info-label">Heart Rate</div>
                                        <div className="info-value">
                                            {session.classificationResults?.heartRate || session.patientData?.heartRate || 'N/A'}
                                            {(session.classificationResults?.heartRate || session.patientData?.heartRate) && ' BPM'}
                                        </div>
                                    </div>
                                    
                                    <div className="info-box">
                                        <div className="info-label">Gender</div>
                                        <div className="info-value">
                                            {session.patientData?.gender || session.metadata?.patient?.gender || 'Not specified'}
                                        </div>
                                    </div>
                                    
                                    <div className="info-box">
                                        <div className="info-label">Age</div>
                                        <div className="info-value">
                                            {session.patientData?.age || session.metadata?.patient?.age || 'N/A'}
                                        </div>
                                    </div>
                                    
                                    <div className="info-box">
                                        <div className="info-label">Sampling Rate</div>
                                        <div className="info-value">
                                            {session.metadata?.samplingRate || session.patientData?.samplingRate || '500'} Hz
                                        </div>
                                    </div>
                                    
                                    <div className="info-box">
                                        <div className="info-label">Duration</div>
                                        <div className="info-value">
                                            {session.metadata?.duration ? `${session.metadata.duration.toFixed(1)}s` : 'N/A'}
                                        </div>
                                    </div>
                                    
                                    <div className="info-box">
                                        <div className="info-label">Lead Mode</div>
                                        <div className="info-value">
                                            {config.leadMode.replace('_', '-').toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="no-patient-data">
                                    <div className="no-data-icon">📋</div>
                                    <p>Patient data will appear here</p>
                                </div>
                            )}
                        </div>

                        {/* Lead Controls - Compact version */}
                        <div className="lead-controls-compact">
                            <ECGLeadControls
                                leadMode={config.leadMode}
                                visibleLeads={display.visibleLeads}
                                onLeadVisibilityChange={handleLeadVisibilityChange}
                                onModeChange={handleModeChange}
                                isPlaying={playback.isPlaying}
                                playbackState={display.pausedLeadStates}
                                individualToggle={true}
                                compactMode={true}
                            />
                        </div>
                    </div>

                    {/* Main ECG Display - Clean Architecture */}
                    <div className="ecg-main-display-wide">
                        <div className="ecg-signal-section-ultra-wide">
                            <ECGViewer
                                sessionId={session.id}
                                metadata={session.metadata}
                                isPlaying={playback.isPlaying || streaming.status === 'streaming'}
                                currentPosition={playback.currentPosition}
                                onPositionChange={(pos) => setPlayback(prev => ({ ...prev, currentPosition: pos }))}
                                visibleLeads={display.visibleLeads}
                                leadMode={config.leadMode}
                                showLegend={true}
                                liveStreamData={streaming.data}
                                onLeadToggle={handleLeadVisibilityChange}
                                leadControls={
                                    <ECGLeadControls
                                        leadMode={config.leadMode}
                                        visibleLeads={display.visibleLeads}
                                        onLeadVisibilityChange={handleLeadVisibilityChange}
                                        onModeChange={handleModeChange}
                                        isPlaying={playback.isPlaying}
                                        playbackState={display.pausedLeadStates}
                                        individualToggle={true}
                                        compactMode={true}
                                    />
                                }
                            />
                        </div>
                    </div>

                    {/* Bottom Section: Classification Results */}
                    <div className="ecg-bottom-section">
                        <div className="classification-analysis-section">
                            <h3>📊 ECG Analysis & Diagnosis</h3>
                            {session.classificationResults ? (
                                <div className="analysis-grid">
                                    <div className="analysis-primary">
                                        <div className="primary-result">
                                            <div className="result-classification">
                                                <span className="classification-label">Classification</span>
                                                <span className={`classification-value ${session.classificationResults.classification?.toLowerCase()}`}>
                                                    {session.classificationResults.classification}
                                                </span>
                                            </div>
                                            <div className="result-confidence">
                                                <span className="confidence-label">Confidence</span>
                                                <div className="confidence-bar">
                                                    <div 
                                                        className="confidence-fill"
                                                        style={{ width: `${(session.classificationResults.confidence * 100)}%` }}
                                                    ></div>
                                                    <span className="confidence-text">
                                                        {(session.classificationResults.confidence * 100).toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {session.classificationResults.rhythm && (
                                            <div className="rhythm-analysis">
                                                <span className="rhythm-label">Rhythm Analysis</span>
                                                <span className="rhythm-value">{session.classificationResults.rhythm}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {session.classificationResults.abnormalities && session.classificationResults.abnormalities.length > 0 && (
                                        <div className="analysis-abnormalities">
                                            <h4>🚨 Detected Abnormalities</h4>
                                            <div className="abnormalities-grid">
                                                {session.classificationResults.abnormalities.map((abnormality, index) => (
                                                    <div key={index} className="abnormality-card">
                                                        <div className="abnormality-icon">⚠️</div>
                                                        <div className="abnormality-text">{abnormality}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="no-analysis">
                                    <div className="no-analysis-content">
                                        <div className="no-analysis-icon">�</div>
                                        <h4>Awaiting ECG Analysis</h4>
                                        <p>Classification results and diagnostic information will appear here once the ECG data is processed by our AI analysis engine.</p>
                                        <div className="analysis-features">
                                            <div className="feature-item">📈 Rhythm Analysis</div>
                                            <div className="feature-item">🫀 Abnormality Detection</div>
                                            <div className="feature-item">📊 Confidence Scoring</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Link to='/task1' className='back-btn'>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                </svg>
                Back
            </Link>
        </>
    );
}