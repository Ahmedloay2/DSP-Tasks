
import React, { useState, useEffect, useRef, useCallback } from 'react';
import AudioUpload from '../shared/AudioUpload';
import DualSpectrumViewer from '../shared/DualSpectrumViewer';
import CineSignalViewer from '../shared/CineSignalViewer';
import SpectrogramViewer from '../shared/SpectrogramViewer';
import { INSTRUMENT_PRESETS } from '../../data/modePresets';
import {
  createGenericMode,
  addSubdivision,
  updateSubdivision,
  processSignalInChunks,
  generateSyntheticSignal
} from '../../services/equalizerService';
import {
  separateInstruments,
  downloadFile,
  checkServerStatus,
  GAIN_PRESETS,
  STEMS
} from '../../../../services/task3BackendService';
import './Task3MusicEqualizer.css';

// Helper function to convert file paths to download URLs
const filePathToUrl = (filePath) => {
  if (!filePath) return null;
  const SERVER_URL = 'http://localhost:5001';
  return `${SERVER_URL}/api/download/${encodeURIComponent(filePath)}`;
};

export default function Task3MusicEqualizer() {
  // Mode state - 'equalizer' or 'separation'
  const [mode, setMode] = useState('equalizer');

  // Refs for audio players
  const inputAudioRef = useRef(null);
  const stemAudioRefs = useRef({});

  // Signal state
  const [inputSignal, setInputSignal] = useState([]);
  const [outputSignal, setOutputSignal] = useState([]);
  const [sampleRate, setSampleRate] = useState(44100);
  const [fileName, setFileName] = useState('');
  const [inputAudioUrl, setInputAudioUrl] = useState(null);
  const [processedAudioUrl, setProcessedAudioUrl] = useState(null);
  const [uploadedFilePath, setUploadedFilePath] = useState(null); // For separation mode

  // Configuration state (for equalizer mode)
  const [config, setConfig] = useState(null);
  const [instruments, setInstruments] = useState([]);

  // Instruments Separation state
  const [separationGains, setSeparationGains] = useState({
    drums: 1.0,
    bass: 1.0,
    vocals: 1.0,
    guitar: 1.0,
    piano: 1.0,
    other: 1.0
  });
  const [separationResults, setSeparationResults] = useState(null);
  const [separationProgress, setSeparationProgress] = useState(null);
  const [isSeparating, setIsSeparating] = useState(false);
  const [showSeparationSpectrograms, setShowSeparationSpectrograms] = useState(false);

  // Signals for client-side spectrogram generation
  const [originalSignalForSpec, setOriginalSignalForSpec] = useState([]);
  const [mixedSignalForSpec, setMixedSignalForSpec] = useState([]);

  // Signals for stem viewers (loaded from URLs)
  const [stemSignals, setStemSignals] = useState({});
  const [mixedSignal, setMixedSignal] = useState([]);

  // UI state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
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

  // Initialize with empty config (load presets automatically) - only run once on mount
  useEffect(() => {
    const newConfig = createGenericMode(sampleRate);
    INSTRUMENT_PRESETS.forEach(preset => {
      addSubdivision(newConfig, preset.minFreq, preset.maxFreq, preset.gain);
    });
    setConfig(newConfig);
    setInstruments(INSTRUMENT_PRESETS.map((p, i) => ({ ...p, index: i })));
    setIsLoaded(true);
  }, []); // Empty dependency array - only run once

  const handleAudioLoaded = (audioData) => {
    setInputSignal(audioData.signal);
    setSampleRate(audioData.sampleRate);
    setFileName(audioData.fileName);
    setOutputSignal([]);
    setProcessedAudioUrl(null);

    // Store file path or file object for separation mode
    // Priority: filePath (from Electron) > file object (for saving temporarily)
    if (audioData.filePath) {
      setUploadedFilePath(audioData.filePath);
    } else if (audioData.file) {
      setUploadedFilePath(audioData.file);
    }

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
      setConfig(updatedConfig);
    }

    // Reset separation results when new audio is loaded
    setSeparationResults(null);
    setSeparationProgress(null);
  };

  const handleGenerateSignal = () => {
    const frequencies = [55, 110, 220, 440, 880, 1760, 3520];
    const amplitudes = [1.0, 0.9, 0.8, 1.0, 0.7, 0.6, 0.5];
    const signal = generateSyntheticSignal(frequencies, amplitudes, sampleRate, 5.0);

    setInputSignal(signal);
    setFileName('Musical Test Signal');
    setOutputSignal([]);
    setProcessedAudioUrl(null);

    // Create audio URL for synthetic signal
    const inputAudioUrl = signalToAudioUrl(signal, sampleRate);
    setInputAudioUrl(inputAudioUrl);
  };

  const handleUpdateGain = (index, gain) => {
    if (!config) return;

    const newConfig = { ...config };
    const sub = newConfig.subdivisions[index];
    updateSubdivision(newConfig, index, sub.startFreq, sub.endFreq, parseFloat(gain));
    setConfig(newConfig);
  };

  const handleProcess = async () => {
    if (inputSignal.length === 0 || !config) {
      alert('Please load audio and instrument presets first!');
      return;
    }

    // Warn for large files
    const durationInSeconds = inputSignal.length / sampleRate;
    if (durationInSeconds > 60) {
      const proceed = window.confirm(
        `This audio file is ${durationInSeconds.toFixed(1)} seconds long. Processing may take a significant amount of time and could make the browser unresponsive. Do you want to continue?`
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
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const buffer = audioCtx.createBuffer(1, signal.length, sr);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < signal.length; i++) {
      channelData[i] = signal[i];
    }

    const wav = audioBufferToWav(buffer);
    const blob = new Blob([wav], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  };

  const audioBufferToWav = (buffer) => {
    const length = buffer.length * buffer.numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);

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
    a.download = 'music-equalized.wav';
    a.click();
  };

  // ============================================================================
  // INSTRUMENTS SEPARATION HANDLERS
  // ============================================================================

  const handleSeparationGainChange = (stem, value) => {
    const gainValue = parseFloat(value);
    setSeparationGains(prev => ({
      ...prev,
      [stem]: gainValue
    }));

    // Update the audio player volume for this stem
    const audioElement = stemAudioRefs.current[stem];
    if (audioElement) {
      // Clamp volume between 0 and 1 (gain can be 0-6, but HTML audio volume is 0-1)
      audioElement.volume = Math.min(1.0, Math.max(0, gainValue));
    }
  };

  const handlePresetSelect = (presetKey) => {
    const preset = GAIN_PRESETS[presetKey];
    if (preset) {
      setSeparationGains(preset.gains);
    }
  };

  const handleSeparate = async () => {
    // Check if we have either uploaded file or synthetic signal
    if (!uploadedFilePath && inputSignal.length === 0) {
      alert('Please upload an audio file or generate a synthetic signal first!');
      return;
    }

    setIsSeparating(true);
    setSeparationProgress({ stage: 'starting', progress: 0, message: 'Initializing...' });
    setSeparationResults(null);

    try {
      let fileToSeparate;

      // If we have synthetic signal but no uploaded file, create a WAV file from it
      if (!uploadedFilePath && inputSignal.length > 0) {
        console.log('🎵 Converting synthetic signal to WAV file for separation...');
        setSeparationProgress({ stage: 'converting', progress: 0.1, message: 'Converting synthetic signal...' });

        // Create WAV blob from signal
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const buffer = audioCtx.createBuffer(1, inputSignal.length, sampleRate);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < inputSignal.length; i++) {
          channelData[i] = inputSignal[i];
        }
        const wav = audioBufferToWav(buffer);
        const blob = new Blob([wav], { type: 'audio/wav' });
        fileToSeparate = new File([blob], 'synthetic_signal.wav', { type: 'audio/wav' });
      } else {
        fileToSeparate = uploadedFilePath;
      }

      // Warn for large files
      const durationInSeconds = inputSignal.length / sampleRate;
      if (durationInSeconds > 300) { // 5 minutes
        const proceed = window.confirm(
          `This audio is ${(durationInSeconds / 60).toFixed(1)} minutes long. Processing may take 5-10 minutes. Do you want to continue?`
        );
        if (!proceed) {
          setIsSeparating(false);
          setSeparationProgress(null);
          return;
        }
      }

      // Perform separation
      const result = await separateInstruments(
        fileToSeparate,
        separationGains,
        (progressData) => {
          setSeparationProgress(progressData);
        }
      );

      setSeparationResults(result);
      setSeparationProgress({ stage: 'complete', progress: 1.0, message: 'Complete!' });

      console.log('✅ Separation complete:', result);

      // Always load signals with adaptive downsampling based on duration
      const durationSeconds = result.duration_seconds || 0;

      // Load audio signals for client-side spectrogram generation
      loadAudioSignalsForSpectrograms(fileToSeparate, result.mixed_audio_url, durationSeconds);

      // Load only mixed signal for viewer (stems are sliders only now)
      if (result.mixed_audio_url) {
        loadMixedSignalOnly(result.mixed_audio_url, durationSeconds);
      }
    } catch (error) {
      console.error('❌ Separation error:', error);
      alert(`Error during separation: ${error.message}\n\nMake sure the backend server is running.`);
      setSeparationProgress(null);
    } finally {
      setIsSeparating(false);
    }
  };

  // Load audio signals for client-side spectrogram generation
  const loadAudioSignalsForSpectrograms = async (originalFile, mixedUrl, durationSeconds = 0) => {
    try {
      console.log('🎵 Loading audio signals for spectrograms (memory optimized)...');

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Adaptive downsampling based on duration to prevent memory issues
      let maxSamples;
      if (durationSeconds > 300) { // >5 minutes
        maxSamples = sampleRate * 15; // Only 15 seconds
        console.log(`⚠️ Very long audio (${durationSeconds.toFixed(1)}s). Using 15s for spectrogram.`);
      } else if (durationSeconds > 180) { // >3 minutes  
        maxSamples = sampleRate * 20; // 20 seconds
        console.log(`⚠️ Long audio (${durationSeconds.toFixed(1)}s). Using 20s for spectrogram.`);
      } else {
        maxSamples = sampleRate * 30; // Full 30 seconds
      }

      // Helper function for efficient downsampling
      const downsampleSignal = (signal, maxSamples) => {
        if (signal.length <= maxSamples) return Array.from(signal);
        const step = Math.floor(signal.length / maxSamples);
        const downsampled = [];
        for (let i = 0; i < signal.length; i += step) {
          if (downsampled.length >= maxSamples) break;
          downsampled.push(signal[i]);
        }
        return downsampled;
      };

      // Load original audio
      let originalArrayBuffer;
      if (originalFile instanceof File) {
        originalArrayBuffer = await originalFile.arrayBuffer();
      } else {
        const response = await fetch(originalFile);
        originalArrayBuffer = await response.arrayBuffer();
      }
      const originalAudioBuffer = await audioContext.decodeAudioData(originalArrayBuffer);
      const originalChannel = originalAudioBuffer.getChannelData(0);
      const originalSignal = downsampleSignal(originalChannel, maxSamples);

      console.log(`  ✅ Original: ${originalChannel.length} → ${originalSignal.length} samples`);
      setOriginalSignalForSpec(originalSignal);

      // Load mixed audio directly from URL
      const mixedResponse = await fetch(mixedUrl);
      const mixedArrayBuffer = await mixedResponse.arrayBuffer();
      const mixedAudioBuffer = await audioContext.decodeAudioData(mixedArrayBuffer);
      const mixedChannel = mixedAudioBuffer.getChannelData(0);
      const mixedSignal = downsampleSignal(mixedChannel, maxSamples);

      console.log(`  ✅ Mixed: ${mixedChannel.length} → ${mixedSignal.length} samples`);
      setMixedSignalForSpec(mixedSignal);

      console.log('✅ Audio signals loaded for spectrograms');
    } catch (error) {
      console.error('❌ Error loading audio for spectrograms:', error);
      console.warn('Spectrograms will not be available. This does not affect separation quality.');
      // Don't fail the whole process, just skip spectrograms - no alert to avoid annoying user
      setOriginalSignalForSpec([]);
      setMixedSignalForSpec([]);
    }
  };

  // Helper to downsample signal for memory efficiency
  const downsampleForViewer = (signal, maxSamples = 100000) => {
    if (signal.length <= maxSamples) return signal;
    const step = Math.floor(signal.length / maxSamples);
    const downsampled = [];
    for (let i = 0; i < signal.length; i += step) {
      if (downsampled.length >= maxSamples) break;
      downsampled.push(signal[i]);
    }
    return downsampled;
  };

  // Load only mixed signal for viewer (stems are sliders only)
  const loadMixedSignalOnly = async (mixedUrl, durationSeconds = 0) => {
    try {
      console.log('🎵 Loading mixed signal for viewer (memory optimized)...');
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Adaptive downsampling based on duration
      let MAX_SAMPLES;
      if (durationSeconds > 300) { // >5 minutes
        MAX_SAMPLES = 50000;
        console.log(`⚠️ Very long audio (${durationSeconds.toFixed(1)}s). Using 50k samples.`);
      } else if (durationSeconds > 180) { // >3 minutes
        MAX_SAMPLES = 75000;
        console.log(`⚠️ Long audio (${durationSeconds.toFixed(1)}s). Using 75k samples.`);
      } else {
        MAX_SAMPLES = 100000;
      }

      // Load mixed signal
      const response = await fetch(mixedUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);

      // Downsample
      const downsampled = downsampleForViewer(channelData, MAX_SAMPLES);
      setMixedSignal(downsampled);

      console.log(`  ✅ Mixed: ${channelData.length} → ${downsampled.length} samples`);
      console.log('✅ Mixed signal loaded for viewer');

      // Suggest garbage collection
      if (window.gc) window.gc();

    } catch (error) {
      console.error('❌ Error loading mixed signal:', error);
      setMixedSignal([]);
    }
  };

  const handleSeparationReset = () => {
    setSeparationResults(null);
    setSeparationProgress(null);
    setSeparationGains({
      drums: 1.0,
      bass: 1.0,
      vocals: 1.0,
      guitar: 1.0,
      piano: 1.0,
      other: 1.0
    });
    // Clear loaded signals
    setStemSignals({});
    setMixedSignal([]);
    setOriginalSignalForSpec([]);
    setMixedSignalForSpec([]);
  };

  const handleDownloadStem = async (stemPath, stemName) => {
    try {
      await downloadFile(stemPath, `${stemName}.wav`);
    } catch (error) {
      alert(`Error downloading ${stemName}: ${error.message}`);
    }
  };

  const handleDownloadAll = async () => {
    if (!separationResults || !separationResults.zip_archive) {
      alert('No zip archive available to download.');
      return;
    }

    try {
      await downloadFile(separationResults.zip_archive, 'all_stems.zip');
    } catch (error) {
      alert(`Error downloading zip: ${error.message}`);
    }
  };

  return (
    <div className="task3-music-equalizer">
      {/* Audio Upload */}
      <AudioUpload
        onAudioLoaded={handleAudioLoaded}
        fileName={fileName}
        onGenerateSignal={handleGenerateSignal}
        mode="musical"
      />

      {/* Mode Toggle */}
      <section className="mode-selector">
        <h2>Select Processing Mode</h2>
        <div className="mode-toggle-buttons">
          <button
            className={`mode-toggle-btn ${mode === 'equalizer' ? 'active' : ''}`}
            onClick={() => setMode('equalizer')}
          >
            <span className="mode-icon">🎚️</span>
            <div className="mode-info">
              <span className="mode-label">Frequency Equalizer</span>
              <span className="mode-desc">Manual frequency band control</span>
            </div>
          </button>
          <button
            className={`mode-toggle-btn ${mode === 'separation' ? 'active' : ''}`}
            onClick={() => setMode('separation')}
            disabled={!uploadedFilePath && inputSignal.length === 0}
          >
            <span className="mode-icon">🎸</span>
            <div className="mode-info">
              <span className="mode-label">Instruments Separation</span>
              <span className="mode-desc">AI-powered stem separation</span>
            </div>
          </button>
        </div>
        {!uploadedFilePath && inputSignal.length === 0 && mode === 'separation' && (
          <p className="mode-warning">⚠️ Please upload an audio file or generate a synthetic signal to use Instruments Separation</p>
        )}
        {!uploadedFilePath && inputSignal.length > 0 && mode === 'separation' && (
          <p className="mode-info">ℹ️ Synthetic signal ready for separation ({(inputSignal.length / sampleRate).toFixed(1)}s)</p>
        )}
      </section>

      {/* Conditional Mode Rendering */}
      {mode === 'equalizer' ? (
        // EXISTING EQUALIZER MODE
        <>
          {/* Control Panel */}
          <section className="control-panel">
            <h2>Musical Instruments Mode</h2>

            {/* Instruments Grid */}
            {isLoaded && (
              <div className="instruments-grid">
                {instruments.map((inst) => (
                  <div key={inst.index} className="item-card">
                    <div className="item-header">
                      <span className="item-icon">{inst.icon}</span>
                      <span className="item-name">{inst.name}</span>
                      <span className="item-confidence">
                        {inst.minFreq}-{inst.maxFreq} Hz
                      </span>
                    </div>
                    <div className="item-slider">
                      <div className="slider-group">
                        <label>
                          Gain: <span className="slider-value">
                            {config?.subdivisions[inst.index]?.scale.toFixed(2) || '1.00'}x
                          </span>
                        </label>
                        <div className="slider-container">
                          <span className="slider-label">0x</span>
                          <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.01"
                            value={config?.subdivisions[inst.index]?.scale ?? 1.0}
                            onChange={(e) => handleUpdateGain(inst.index, e.target.value)}
                            className="gain-slider"
                          />
                          <span className="slider-label">2x</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Processing Section */}
          {inputSignal.length > 0 && (
            <section className="processing-section-inline">
              <div className="process-controls">
                <button
                  className="process-btn"
                  onClick={handleProcess}
                  disabled={isProcessing}
                >
                  <span className="icon">⚡</span>
                  {isProcessing ? 'Processing...' : 'Apply Equalizer'}
                </button>
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

          {/* Dual Spectrum Viewer - Only show when there's input signal */}
          {inputSignal.length > 0 && (
            <DualSpectrumViewer
              originalSignal={inputSignal}
              processedSignal={outputSignal}
              sampleRate={sampleRate}
            />
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
        </>
      ) : (
        // INSTRUMENTS SEPARATION MODE
        <div className="instruments-separation-mode">
          {/* Presets Section */}
          <section className="presets-section">
            <h2>🎯 Quick Presets</h2>
            <div className="presets-grid">
              {Object.entries(GAIN_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  className="preset-btn"
                  onClick={() => handlePresetSelect(key)}
                  disabled={isSeparating}
                >
                  <span className="preset-name">{preset.name}</span>
                  <span className="preset-desc">{preset.description}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Gain Controls */}
          <section className="separation-controls">
            <h2>🎚️ Instrument Gain Controls</h2>
            <div className="stems-controls-grid">
              {STEMS.map((stem) => (
                <div key={stem.id} className="stem-control-card" style={{ borderLeft: `4px solid ${stem.color}` }}>
                  <div className="stem-control-header">
                    <span className="stem-icon">{stem.icon}</span>
                    <span className="stem-name">{stem.name}</span>
                    <span className="stem-gain-value">{separationGains[stem.id].toFixed(2)}x</span>
                  </div>
                  <div className="stem-slider-container">
                    <span className="slider-min">0.0x</span>
                    <input
                      type="range"
                      min="0"
                      max="6"
                      step="0.1"
                      value={separationGains[stem.id]}
                      onChange={(e) => handleSeparationGainChange(stem.id, e.target.value)}
                      className="stem-gain-slider"
                      disabled={isSeparating}
                      style={{
                        background: `linear-gradient(to right, ${stem.color} 0%, ${stem.color} ${(separationGains[stem.id] / 6) * 100}%, #ddd ${(separationGains[stem.id] / 6) * 100}%, #ddd 100%)`
                      }}
                    />
                    <span className="slider-max">6.0x</span>
                  </div>
                  <div className="stem-quick-actions">
                    <button
                      className="stem-action-btn"
                      onClick={() => handleSeparationGainChange(stem.id, '0')}
                      disabled={isSeparating}
                      title="Mute"
                    >
                      🔇
                    </button>
                    <button
                      className="stem-action-btn"
                      onClick={() => handleSeparationGainChange(stem.id, '1.0')}
                      disabled={isSeparating}
                      title="Reset to 1.0x"
                    >
                      ↺
                    </button>
                    <button
                      className="stem-action-btn"
                      onClick={() => handleSeparationGainChange(stem.id, '2.0')}
                      disabled={isSeparating}
                      title="Boost to 2.0x"
                    >
                      🔊
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Processing Controls */}
          <section className="separation-actions">
            <div className="action-buttons">
              <button
                className="separate-btn"
                onClick={handleSeparate}
                disabled={isSeparating || (!uploadedFilePath && inputSignal.length === 0)}
              >
                <span className="btn-icon">🎵</span>
                {isSeparating ? 'Separating...' : 'Separate & Mix Instruments'}
              </button>
              <button
                className="reset-btn"
                onClick={handleSeparationReset}
                disabled={isSeparating}
              >
                <span className="btn-icon">🔄</span>
                Reset All
              </button>
              {separationResults && (
                <button
                  className="download-all-btn"
                  onClick={handleDownloadAll}
                  disabled={isSeparating}
                >
                  <span className="btn-icon">📦</span>
                  Download All Stems (ZIP)
                </button>
              )}
            </div>
          </section>

          {/* Progress Indicator */}
          {separationProgress && (
            <section className="separation-progress">
              <h3>Processing Status</h3>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${(separationProgress.progress || 0) * 100}%` }}
                ></div>
              </div>
              <p className="progress-message">
                {separationProgress.message || 'Processing...'}
              </p>
              <div className="progress-stages">
                <span className={separationProgress.stage === 'separation' || separationProgress.stage === 'loading' || separationProgress.stage === 'mixing' || separationProgress.stage === 'complete' ? 'stage-complete' : 'stage-pending'}>
                  1. Separation
                </span>
                <span className={separationProgress.stage === 'loading' || separationProgress.stage === 'mixing' || separationProgress.stage === 'complete' ? 'stage-complete' : 'stage-pending'}>
                  2. Loading
                </span>
                <span className={separationProgress.stage === 'mixing' || separationProgress.stage === 'complete' ? 'stage-complete' : 'stage-pending'}>
                  3. Mixing
                </span>
                <span className={separationProgress.stage === 'complete' ? 'stage-complete' : 'stage-pending'}>
                  4. Complete
                </span>
              </div>
            </section>
          )}

          {/* Results Display */}
          {separationResults && (
            <section className="separation-results">
              <h2>🎧 Separation Results</h2>

              {/* Individual Stems with Gain Controls (Sliders Only) */}
              <div className="stems-with-viewers-section">
                <h3>🎵 Individual Separated Instruments</h3>
                <div className="stems-viewers-grid">
                  {STEMS.map((stem) => {
                    // Use pre-constructed URLs from backend
                    const stemUrl = separationResults.stem_urls_trimmed?.[stem.id];
                    const stemPath = separationResults.separated_stems_trimmed?.[stem.id];
                    if (!stemUrl || !stemPath) return null;

                    return (
                      <div key={stem.id} className="stem-viewer-card" style={{ borderLeft: `4px solid ${stem.color}` }}>
                        {/* Stem Header */}
                        <div className="stem-viewer-header">
                          <div className="stem-title">
                            <span className="stem-icon-large">{stem.icon}</span>
                            <span className="stem-name-large">{stem.name}</span>
                          </div>
                          <button
                            className="stem-download-btn-compact"
                            onClick={() => handleDownloadStem(stemUrl, stem.id)}
                            title={`Download ${stem.name}`}
                          >
                            💾
                          </button>
                        </div>

                        {/* Gain Control */}
                        <div className="stem-gain-control-inline">
                          <label>Gain: {separationGains[stem.id].toFixed(2)}x</label>
                          <input
                            type="range"
                            min="0"
                            max="6"
                            step="0.1"
                            value={separationGains[stem.id]}
                            onChange={(e) => handleSeparationGainChange(stem.id, e.target.value)}
                            className="stem-gain-slider-compact"
                            style={{
                              background: `linear-gradient(to right, ${stem.color} 0%, ${stem.color} ${(separationGains[stem.id] / 6) * 100}%, #ddd ${(separationGains[stem.id] / 6) * 100}%, #ddd 100%)`
                            }}
                          />
                          <div className="gain-quick-btns">
                            <button onClick={() => handleSeparationGainChange(stem.id, '0')} title="Mute">🔇</button>
                            <button onClick={() => handleSeparationGainChange(stem.id, '1.0')} title="Reset">↺</button>
                            <button onClick={() => handleSeparationGainChange(stem.id, '2.0')} title="Boost">🔊</button>
                          </div>
                        </div>

                        {/* Audio Player */}
                        <div className="stem-audio-player">
                          <audio
                            ref={(el) => { if (el) stemAudioRefs.current[stem.id] = el; }}
                            controls
                            style={{ width: '100%' }}
                            onLoadedMetadata={(e) => {
                              // Set initial volume based on gain
                              e.target.volume = Math.min(1.0, Math.max(0, separationGains[stem.id]));
                            }}
                          >
                            <source src={stemUrl} type="audio/wav" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mixed Output with Viewer */}
              <div className="mixed-output-with-viewer-section">
                <h3>🎵 Reconstructed Mixed Output</h3>
                <div className="mixed-output-card">
                  {/* Info */}
                  <div className="mixed-output-info">
                    <p>
                      <strong>Duration:</strong> {separationResults.duration_seconds?.toFixed(2)}s |
                      <strong> Sample Rate:</strong> {separationResults.sample_rate} Hz
                    </p>
                    <button
                      className="download-btn-large"
                      onClick={() => handleDownloadStem(separationResults.mixed_audio_url, 'mixed_output')}
                    >
                      💾 Download Mixed Output
                    </button>
                  </div>

                  {/* Signal Viewer (replaces audio player) */}
                  <div className="mixed-signal-viewer">
                    <CineSignalViewer
                      signal={mixedSignal}
                      sampleRate={separationResults.sample_rate || sampleRate}
                      title="Mixed Output Signal (Reconstructed after Separation)"
                      audioUrl={separationResults.mixed_audio_url}
                      height={200}
                    />
                  </div>
                </div>
              </div>

              {/* Spectrograms Comparison - CLIENT-SIDE GENERATION */}
              <div className="spectrograms-comparison-section">
                <h3>📊 Spectrograms Comparison (Real-Time)</h3>
                <button
                  className="toggle-btn"
                  onClick={() => setShowSeparationSpectrograms(!showSeparationSpectrograms)}
                  disabled={originalSignalForSpec.length === 0}
                >
                  {showSeparationSpectrograms ? '👁️ Hide' : '👁️ Show'} Spectrograms
                  {originalSignalForSpec.length === 0 && ' (Loading...)'}
                </button>
                {showSeparationSpectrograms && originalSignalForSpec.length > 0 && (
                  <div className="spectrograms-grid">
                    <div className="spectrogram-item">
                      <SpectrogramViewer
                        signal={originalSignalForSpec}
                        sampleRate={sampleRate}
                        title="Original Audio"
                      />
                    </div>
                    <div className="spectrogram-item">
                      <SpectrogramViewer
                        signal={mixedSignalForSpec}
                        sampleRate={sampleRate}
                        title="AI Mixed Output"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Download All */}
              {separationResults.zip_archive && (
                <div className="download-all-section">
                  <button
                    className="download-all-btn-large"
                    onClick={handleDownloadAll}
                  >
                    <span className="btn-icon">📦</span>
                    Download All Stems (ZIP)
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
