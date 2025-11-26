
import React, { useState, useEffect, useRef, useCallback } from 'react';
import AudioUpload from '../shared/AudioUpload';
import DualSpectrumViewer from '../shared/DualSpectrumViewer';
import CineSignalViewer from '../shared/CineSignalViewer';
import SpectrogramViewer from '../shared/SpectrogramViewer';
import {
    createGenericMode,
    addSubdivision,
    removeSubdivision,
    updateSubdivision,
    processSignalInChunks,
    generateSyntheticSignal,
    saveConfig,
    loadConfig
} from '../../services/equalizerService';
import './Task3GenericEqualizer.css';

export default function Task3GenericEqualizer() {
    // Refs for audio players
    const inputAudioRef = useRef(null);

    // Signal state
    const [inputSignal, setInputSignal] = useState([]);
    const [outputSignal, setOutputSignal] = useState([]);
    const [sampleRate, setSampleRate] = useState(44100);
    const [fileName, setFileName] = useState('');
    const [inputAudioUrl, setInputAudioUrl] = useState(null);
    const [processedAudioUrl, setProcessedAudioUrl] = useState(null);

    // Configuration state
    const [config, setConfig] = useState(null);

    // UI state
    const [showModal, setShowModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [configName, setConfigName] = useState('');
    const [showSpectrograms, setShowSpectrograms] = useState(false);

    // Linked viewer state for synchronization
    const [linkedViewerState, setLinkedViewerState] = useState({
        zoom: 1.0,
        panX: 0,
        panY: 0,
        currentTime: 0,
        playbackSpeed: 1.0,
        isPlaying: false,
    });

    // Handle view state change with debouncing to prevent loops
    const handleViewStateChange = useCallback((newState) => {
        setLinkedViewerState(prev => {
            // Only update if values actually changed
            if (
                Math.abs(prev.zoom - newState.zoom) > 0.001 ||
                Math.abs(prev.panX - newState.panX) > 0.1 ||
                Math.abs(prev.panY - newState.panY) > 0.01 ||
                Math.abs(prev.currentTime - newState.currentTime) > 0.01 ||
                Math.abs(prev.playbackSpeed - newState.playbackSpeed) > 0.01 ||
                prev.isPlaying !== newState.isPlaying
            ) {
                return newState;
            }
            return prev;
        });
    }, []);

    // Initialize with default sliders (3 bands) - only run once on mount
    useEffect(() => {
        const initialConfig = createGenericMode(sampleRate);
        // Add 3 default bands
        addSubdivision(initialConfig, 20, 500, 1.0);    // Low frequencies
        addSubdivision(initialConfig, 500, 2000, 1.0);  // Mid frequencies
        addSubdivision(initialConfig, 2000, 8000, 1.0); // High frequencies
        setConfig(initialConfig);
    }, []); // Empty dependency array - only run once

    const handleAudioLoaded = (audioData) => {
        console.log('=== Audio Loaded ===');
        console.log('Audio sample rate:', audioData.sampleRate);
        console.log('Current sampleRate state:', sampleRate);
        console.log('Current config:', config);

        setInputSignal(audioData.signal);
        setSampleRate(audioData.sampleRate);
        setFileName(audioData.fileName);
        setOutputSignal([]);
        setProcessedAudioUrl(null);

        // Use the audioUrl from upload if available, otherwise create from signal
        if (audioData.audioUrl) {
            setInputAudioUrl(audioData.audioUrl);
        } else {
            const inputAudioUrl = signalToAudioUrl(audioData.signal, audioData.sampleRate);
            setInputAudioUrl(inputAudioUrl);
        }

        // Update config with new sample rate WITHOUT losing subdivisions
        if (config) {
            const updatedConfig = {
                ...config,
                sampleRate: audioData.sampleRate
            };
            console.log('Updated config:', updatedConfig);
            setConfig(updatedConfig);
        } else {
            console.warn('Config is null! Creating new config with audio sample rate');
            const newConfig = createGenericMode(audioData.sampleRate);
            setConfig(newConfig);
        }
    };

    const handleGenerateSignal = () => {
        const frequencies = [100, 300, 500, 1000, 2000, 4000, 8000];
        const amplitudes = [1.0, 0.8, 1.0, 0.9, 0.7, 0.8, 0.6];
        const signal = generateSyntheticSignal(frequencies, amplitudes, sampleRate, 3.0);

        setInputSignal(signal);
        setFileName('Synthetic Test Signal');
        setOutputSignal([]);
        setProcessedAudioUrl(null);

        // Create audio URL for synthetic signal
        const inputAudioUrl = signalToAudioUrl(signal, sampleRate);
        setInputAudioUrl(inputAudioUrl);
    };

    const handleProcess = async () => {
        if (inputSignal.length === 0 || !config) {
            alert('Please load audio first!');
            return;
        }

        // Debug logging
        console.log('=== Processing Debug Info ===');
        console.log('Input signal length:', inputSignal.length);
        console.log('Sample rate state:', sampleRate);
        console.log('Config sample rate:', config.sampleRate);
        console.log('Duration (input):', inputSignal.length / sampleRate, 'seconds');

        // Warn for very large files
        const durationInSeconds = inputSignal.length / sampleRate;
        if (durationInSeconds > 60) {
            const proceed = window.confirm(
                `This audio file is ${Math.round(durationInSeconds)} seconds long. ` +
                `Processing may take some time and could slow down your browser. ` +
                `Do you want to continue?`
            );
            if (!proceed) return;
        }

        setIsProcessing(true);
        setProgress(0);

        try {
            const processed = await processSignalInChunks(
                inputSignal,
                config,
                (p) => setProgress(p)
            );

            console.log('Processed signal length:', processed.length);
            console.log('Duration (output):', processed.length / sampleRate, 'seconds');

            setOutputSignal(processed);

            // Create audio URL
            const audioUrl = signalToAudioUrl(processed, sampleRate);
            setProcessedAudioUrl(audioUrl);

            setIsProcessing(false);
        } catch (error) {
            console.error('Processing error:', error);
            alert('Error processing audio: ' + error.message);
            setIsProcessing(false);
        }
    };

    const signalToAudioUrl = (signal, sr) => {
        console.log('Creating audio URL with sample rate:', sr);
        console.log('Signal length:', signal.length);
        console.log('Expected duration:', signal.length / sr, 'seconds');

        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        const buffer = audioCtx.createBuffer(1, signal.length, sr);
        const channelData = buffer.getChannelData(0);

        for (let i = 0; i < signal.length; i++) {
            channelData[i] = signal[i];
        }

        console.log('AudioBuffer created:');
        console.log('- Sample rate:', buffer.sampleRate);
        console.log('- Length:', buffer.length);
        console.log('- Duration:', buffer.duration, 'seconds');

        // Convert to WAV
        const wav = audioBufferToWav(buffer);
        const blob = new Blob([wav], { type: 'audio/wav' });
        return URL.createObjectURL(blob);
    };

    const audioBufferToWav = (buffer) => {
        const length = buffer.length * buffer.numberOfChannels * 2;
        const arrayBuffer = new ArrayBuffer(44 + length);
        const view = new DataView(arrayBuffer);

        // Write WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, buffer.numberOfChannels, true);
        view.setUint32(24, buffer.sampleRate, true);
        view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true);
        view.setUint16(32, buffer.numberOfChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length, true);

        // Write audio data
        let offset = 44;
        for (let i = 0; i < buffer.length; i++) {
            for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }

        return arrayBuffer;
    };

    const handleReset = () => {
        setOutputSignal([]);
        setProcessedAudioUrl(null);
        setProgress(0);

        // Stop and reset audio players - only input audio ref
        if (inputAudioRef.current) {
            inputAudioRef.current.pause();
            inputAudioRef.current.currentTime = 0;
        }
    };

    const handleDownload = () => {
        if (!processedAudioUrl) return;

        const a = document.createElement('a');
        a.href = processedAudioUrl;
        a.download = 'equalized-audio.wav';
        a.click();
    };

    const handleAddBand = (startFreq, endFreq, scale) => {
        // Check for overlapping or duplicate frequency ranges
        const isDuplicate = config.subdivisions.some(sub =>
            (startFreq >= sub.startFreq && startFreq < sub.endFreq) ||
            (endFreq > sub.startFreq && endFreq <= sub.endFreq) ||
            (startFreq <= sub.startFreq && endFreq >= sub.endFreq)
        );

        if (isDuplicate) {
            alert('This frequency range overlaps with an existing band. Please choose a different range.');
            return;
        }

        const newConfig = { ...config };
        addSubdivision(newConfig, startFreq, endFreq, scale);
        setConfig(newConfig);
        setShowModal(false);
    };

    const handleRemoveBand = async (index) => {
        const newConfig = { ...config };
        removeSubdivision(newConfig, index);
        setConfig(newConfig);

        // Automatically process audio if input signal exists
        if (inputSignal.length > 0) {
            try {
                setIsProcessing(true);
                const processed = await processSignalInChunks(
                    inputSignal,
                    newConfig,
                    (p) => setProgress(p)
                );
                setOutputSignal(processed);
                const audioUrl = signalToAudioUrl(processed, sampleRate);
                setProcessedAudioUrl(audioUrl);
                setIsProcessing(false);
            } catch (error) {
                console.error('Processing error:', error);
                setIsProcessing(false);
            }
        }
    };

    const handleUpdateBand = async (index, field, value) => {
        const newConfig = { ...config };
        const sub = newConfig.subdivisions[index];

        if (field === 'startFreq') {
            updateSubdivision(newConfig, index, parseFloat(value), sub.endFreq, sub.scale);
        } else if (field === 'endFreq') {
            updateSubdivision(newConfig, index, sub.startFreq, parseFloat(value), sub.scale);
        } else if (field === 'scale') {
            updateSubdivision(newConfig, index, sub.startFreq, sub.endFreq, parseFloat(value));
        }

        setConfig(newConfig);

        // Automatically process audio if input signal exists
        if (inputSignal.length > 0) {
            try {
                setIsProcessing(true);
                const processed = await processSignalInChunks(
                    inputSignal,
                    newConfig,
                    (p) => setProgress(p)
                );
                setOutputSignal(processed);
                const audioUrl = signalToAudioUrl(processed, sampleRate);
                setProcessedAudioUrl(audioUrl);
                setIsProcessing(false);
            } catch (error) {
                console.error('Processing error:', error);
                setIsProcessing(false);
            }
        }
    };


    const handleSaveConfig = () => {
        if (!configName.trim()) {
            alert('Please enter a configuration name');
            return;
        }

        const jsonString = saveConfig(config, configName);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${configName}.json`;
        a.click();

        URL.revokeObjectURL(url);
    };

    const handleLoadConfig = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedConfig = loadConfig(e.target.result);
                setConfig(loadedConfig);
                setSampleRate(loadedConfig.sampleRate);
                alert('Configuration loaded successfully!');
            } catch (error) {
                alert('Error loading configuration: ' + error.message);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="task3-generic-equalizer">
            {/* Audio Upload */}
            <AudioUpload
                onAudioLoaded={handleAudioLoaded}
                fileName={fileName}
                onGenerateSignal={handleGenerateSignal}
                mode="generic"
            />

            {/* Control Panel */}
            <section className="control-panel">
                <h2>Generic Mode - Custom Frequency Bands</h2>



                {/* Subdivisions List */}
                <div className="subdivisions-container">
                    <h3>Frequency Subdivisions</h3>
                    <div className="subdivisions-list">
                        {config && config.subdivisions.map((sub, index) => (
                            <div key={index} className="subdivision-item">
                                <button
                                    className="remove-icon-btn"
                                    onClick={() => handleRemoveBand(index)}
                                    title="Remove this band"
                                    aria-label="Remove band"
                                >
                                    ✕
                                </button>
                                <div className="subdivision-header">
                                    <span className="subdivision-title">
                                        Band {index + 1}: {sub.startFreq} Hz - {sub.endFreq} Hz
                                    </span>
                                </div>
                                <div className="subdivision-controls">
                                    <div className="slider-group">
                                        <label>
                                            Gain: <span className="slider-value">{sub.scale.toFixed(2)}x</span>
                                        </label>
                                        <div className="slider-container">
                                            <span className="slider-label">0x</span>
                                            <input
                                                type="range"
                                                min="0"
                                                max="2"
                                                step="0.01"
                                                value={sub.scale}
                                                onChange={(e) => handleUpdateBand(index, 'scale', e.target.value)}
                                                className="gain-slider"
                                            />
                                            <span className="slider-label">2x</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        ➕ Add Band
                    </button>
                </div>
            </section>

            {/* Processing Section */}
            {inputSignal.length > 0 && (
                <section className="processing-section-inline">
                    <div className="process-controls">
                        <button className="secondary-btn" onClick={handleReset}>
                            🔄 Reset
                        </button>
                        {processedAudioUrl && !isProcessing && (
                            <button className="download-btn" onClick={handleDownload}>
                                💾 Download
                            </button>
                        )}
                    </div>

                    {isProcessing && (
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${progress * 100}%` }}></div>
                            <span className="progress-text">Processing... {Math.round(progress * 100)}%</span>
                        </div>
                    )}
                </section>
            )}

            {/* Linked Cine Signal Viewers */}
            {inputSignal.length > 0 && (
                <div className="linked-viewers-section">
                    <h2>Time-Domain Signal Analysis (Linked & Synchronized)</h2>
                    <div className="viewers-grid">
                        <div className="viewer-with-audio">
                            <CineSignalViewer
                                signal={inputSignal}
                                sampleRate={sampleRate}
                                title="Input Signal"
                                audioUrl={inputAudioUrl}
                                linkedViewerState={linkedViewerState}
                                onViewStateChange={handleViewStateChange}
                                cursorFollowOnly={true}
                            />
                        </div>
                        <div className="viewer-with-audio">
                            <CineSignalViewer
                                signal={outputSignal}
                                sampleRate={sampleRate}
                                title="Output Signal (Processed)"
                                audioUrl={processedAudioUrl}
                                linkedViewerState={linkedViewerState}
                                onViewStateChange={handleViewStateChange}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Spectrum Viewers - Separate for Input and Output */}
            {inputSignal.length > 0 && (
                <>
                    {/* Linear Scale - Side by Side */}
                    <section className="dual-spectrum-viewer">
                        <h2>Linear Scale Spectrum Analysis</h2>
                        <div className="dual-spectrum-container side-by-side">
                            <DualSpectrumViewer
                                originalSignal={inputSignal}
                                processedSignal={outputSignal}
                                sampleRate={sampleRate}
                                showInput={true}
                                showOutput={false}
                                title="Input"
                                inline={true}
                            />
                            {outputSignal.length > 0 && (
                                <DualSpectrumViewer
                                    originalSignal={inputSignal}
                                    processedSignal={outputSignal}
                                    sampleRate={sampleRate}
                                    showInput={false}
                                    showOutput={true}
                                    title="Output"
                                    inline={true}
                                />
                            )}
                        </div>
                    </section>

                    {/* Audiogram Scale - Side by Side */}
                    <section className="dual-spectrum-viewer">
                        <h2>Audiogram Scale Spectrum Analysis</h2>
                        <div className="dual-spectrum-container side-by-side">
                            <DualSpectrumViewer
                                originalSignal={inputSignal}
                                processedSignal={outputSignal}
                                sampleRate={sampleRate}
                                showInput={true}
                                showOutput={false}
                                title="Input"
                                inline={true}
                                audiogramOnly={true}
                            />
                            {outputSignal.length > 0 && (
                                <DualSpectrumViewer
                                    originalSignal={inputSignal}
                                    processedSignal={outputSignal}
                                    sampleRate={sampleRate}
                                    showInput={false}
                                    showOutput={true}
                                    title="Output"
                                    inline={true}
                                    audiogramOnly={true}
                                />
                            )}
                        </div>
                    </section>
                </>
            )}

            {/* Spectrograms with Toggle */}
            {inputSignal.length > 0 && (
                <div className="spectrograms-section">
                    <div className="section-header">
                        <h2>Spectrograms (Time-Frequency Analysis)</h2>
                        <button
                            className="toggle-btn"
                            onClick={() => setShowSpectrograms(!showSpectrograms)}
                        >
                            {showSpectrograms ? '👁️ Hide' : '👁️ Show'} Spectrograms
                        </button>
                    </div>

                    {showSpectrograms && (
                        <div className="spectrograms-grid">
                            <SpectrogramViewer
                                signal={inputSignal}
                                sampleRate={sampleRate}
                                title="Input Spectrogram"
                            />
                            <SpectrogramViewer
                                signal={outputSignal.length > 0 ? outputSignal : inputSignal}
                                sampleRate={sampleRate}
                                title="Output Spectrogram"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Configuration Management */}
            <section className="config-section">
                <h2>Configuration Management</h2>
                <div className="config-controls">
                    <input
                        type="text"
                        className="config-input"
                        placeholder="Configuration name..."
                        value={configName}
                        onChange={(e) => setConfigName(e.target.value)}
                    />
                    <button className="secondary-btn" onClick={handleSaveConfig}>
                        💾 Save Config
                    </button>
                    <button className="secondary-btn" onClick={() => document.getElementById('configFile').click()}>
                        📂 Load Config
                    </button>
                    <input
                        type="file"
                        id="configFile"
                        accept=".json"
                        style={{ display: 'none' }}
                        onChange={handleLoadConfig}
                    />
                </div>
            </section>

            {/* Modal for Adding Band */}
            {showModal && (
                <BandModal
                    onClose={() => setShowModal(false)}
                    onAdd={handleAddBand}
                />
            )}
        </div>
    );
}

// Band Modal Component
function BandModal({ onClose, onAdd }) {
    const [startFreq, setStartFreq] = useState(100);
    const [endFreq, setEndFreq] = useState(1000);
    const [scale, setScale] = useState(1.0);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (startFreq >= endFreq) {
            alert('Start frequency must be less than end frequency');
            return;
        }

        if (startFreq < 0 || endFreq < 0 || startFreq > 20000 || endFreq > 20000) {
            alert('Frequency values must be between 0 and 20000 Hz');
            return;
        }

        onAdd(startFreq, endFreq, scale);
    };

    const handleStartFreqInputChange = (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
            setStartFreq(Math.max(0, Math.min(20000, value)));
        }
    };

    const handleEndFreqInputChange = (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
            setEndFreq(Math.max(0, Math.min(20000, value)));
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Add Frequency Band</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>
                            Start Frequency: <span className="slider-value">{startFreq} Hz</span>
                        </label>
                        <div className="frequency-input-group">
                            <input
                                type="number"
                                min="0"
                                max="20000"
                                step="1"
                                value={startFreq}
                                onChange={handleStartFreqInputChange}
                                className="frequency-input"
                                placeholder="Enter frequency in Hz"
                            />
                            <span className="input-unit">Hz</span>
                        </div>
                        <div className="slider-container">
                            <span className="slider-label">0 Hz</span>
                            <input
                                type="range"
                                min="0"
                                max="20000"
                                step="10"
                                value={startFreq}
                                onChange={(e) => setStartFreq(parseInt(e.target.value))}
                                className="frequency-slider"
                            />
                            <span className="slider-label">20000 Hz</span>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>
                            End Frequency: <span className="slider-value">{endFreq} Hz</span>
                        </label>
                        <div className="frequency-input-group">
                            <input
                                type="number"
                                min="0"
                                max="20000"
                                step="1"
                                value={endFreq}
                                onChange={handleEndFreqInputChange}
                                className="frequency-input"
                                placeholder="Enter frequency in Hz"
                            />
                            <span className="input-unit">Hz</span>
                        </div>
                        <div className="slider-container">
                            <span className="slider-label">0 Hz</span>
                            <input
                                type="range"
                                min="0"
                                max="20000"
                                step="10"
                                value={endFreq}
                                onChange={(e) => setEndFreq(parseInt(e.target.value))}
                                className="frequency-slider"
                            />
                            <span className="slider-label">20000 Hz</span>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>
                            Initial Gain: <span className="slider-value">{scale.toFixed(2)}x</span>
                        </label>
                        <div className="slider-container">
                            <span className="slider-label">0x</span>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.01"
                                value={scale}
                                onChange={(e) => setScale(parseFloat(e.target.value))}
                                className="gain-slider"
                            />
                            <span className="slider-label">2x</span>
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="secondary-btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="primary-btn">
                            Add Band
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
