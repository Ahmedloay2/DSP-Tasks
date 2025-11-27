import React, { useState, useEffect, useRef, useCallback } from 'react';
import AudioUpload from '../shared/AudioUpload';
import DualSpectrumViewer from '../shared/DualSpectrumViewer';
import CineSignalViewer from '../shared/CineSignalViewer';
import SpectrogramViewer from '../shared/SpectrogramViewer';
import { VOICE_PRESETS } from '../../data/modePresets';
import {
  createGenericMode,
  addSubdivision,
  updateSubdivision,
  processSignalInChunks,
} from '../../services/equalizerService';
import {
  separateVoices,
  adjustVoiceGains,
  downloadFile,
  checkServerStatus
} from '../../../../services/task3BackendService';
import '../music/Task3MusicEqualizer.css';

// Helper function to convert file paths to download URLs
const filePathToUrl = (filePath) => {
  if (!filePath) return null;
  const SERVER_URL = 'http://localhost:5001';
  return `${SERVER_URL}/api/download/${encodeURIComponent(filePath)}`;
};

export default function Task3VoiceEqualizer() {
  // Mode state - 'equalizer' or 'separation'
  const [mode, setMode] = useState('equalizer');

  // Refs for audio players
  const inputAudioRef = useRef(null);
  const voiceAudioRefs = useRef({});

  // Signal state
  const [inputSignal, setInputSignal] = useState([]);
  const [outputSignal, setOutputSignal] = useState([]);
  const [sampleRate, setSampleRate] = useState(44100);
  const [fileName, setFileName] = useState('');
  const [inputAudioUrl, setInputAudioUrl] = useState(null);
  const [processedAudioUrl, setProcessedAudioUrl] = useState(null);
  const [uploadedFilePath, setUploadedFilePath] = useState(null);

  // Configuration state (for equalizer mode)
  const [config, setConfig] = useState(null);
  const [voices, setVoices] = useState([]);

  // Voice Separation state
  const [separationGains, setSeparationGains] = useState({});
  const [separationResults, setSeparationResults] = useState(null);
  const [separationProgress, setSeparationProgress] = useState(null);
  const [isSeparating, setIsSeparating] = useState(false);
  const [showSeparationSpectrograms, setShowSeparationSpectrograms] = useState(false);

  // Signals for client-side spectrogram generation
  const [originalSignalForSpec, setOriginalSignalForSpec] = useState([]);
  const [mixedSignalForSpec, setMixedSignalForSpec] = useState([]);

  // Signals for voice viewers
  const [mixedSignal, setMixedSignal] = useState([]);

  // UI state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSpectrograms, setShowSpectrograms] = useState(false);

  // Linked viewer state
  const [linkedViewerState, setLinkedViewerState] = useState({
    zoom: 1.0,
    panX: 0,
    panY: 0,
    currentTime: 0,
    playbackSpeed: 1.0,
    isPlaying: false,
  });

  // Handle view state change
  const handleViewStateChange = useCallback((newState) => {
    setLinkedViewerState(prev => {
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

  // Check server status on mount
  useEffect(() => {
    const checkServer = async () => {
      const isRunning = await checkServerStatus();
      console.log(`🔍 Server status: ${isRunning ? 'running' : 'offline'}`);
    };
    checkServer();
  }, []);

  // Initialize with empty config
  useEffect(() => {
    const newConfig = createGenericMode(sampleRate);
    VOICE_PRESETS.forEach(preset => {
      addSubdivision(newConfig, preset.minFreq, preset.maxFreq, preset.gain);
    });
    setConfig(newConfig);
    setVoices(VOICE_PRESETS.map((p, i) => ({ ...p, index: i })));
    setIsLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAudioLoaded = (audioData) => {
    setInputSignal(audioData.signal);
    setSampleRate(audioData.sampleRate);
    setFileName(audioData.fileName);
    setOutputSignal([]);
    setProcessedAudioUrl(null);

    // Store file for separation mode
    if (audioData.filePath) {
      setUploadedFilePath(audioData.filePath);
    } else if (audioData.file) {
      setUploadedFilePath(audioData.file);
    }

    // Create audio URL
    if (audioData.audioUrl) {
      setInputAudioUrl(audioData.audioUrl);
    } else {
      const inputAudioUrl = signalToAudioUrl(audioData.signal, audioData.sampleRate);
      setInputAudioUrl(inputAudioUrl);
    }

    // Update config with new sample rate
    if (config) {
      const updatedConfig = { ...config, sampleRate: audioData.sampleRate };
      setConfig(updatedConfig);
    }

    // Reset separation results when new audio loaded
    setSeparationResults(null);
    setSeparationGains({});
    setMixedSignal([]);
  };

  const handleGenerateSignal = async () => {
    try {
      console.log('🎵 Generating synthetic signal from real voice audio samples...');
      const voicesWithAudio = VOICE_PRESETS.filter(preset => preset.audioFile);

      if (voicesWithAudio.length === 0) {
        alert('No voice audio files found in presets');
        return;
      }

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const loadPromises = voicesWithAudio.map(async (preset) => {
        const audioPath = `/audio_samples/voices/${preset.audioFile}`;
        const response = await fetch(audioPath);
        if (!response.ok) throw new Error(`Failed to load ${preset.name}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        return { buffer: audioBuffer, preset };
      });

      const loadedAudios = await Promise.all(loadPromises);
      const targetDuration = 5.0;
      const targetSamples = Math.floor(targetDuration * sampleRate);
      const mixed = new Float32Array(targetSamples);

      loadedAudios.forEach(({ buffer, preset }) => {
        const channelData = buffer.getChannelData(0);
        const samplesToUse = Math.min(channelData.length, targetSamples);
        for (let i = 0; i < targetSamples; i++) {
          mixed[i] += channelData[i % samplesToUse] * preset.gain;
        }
      });

      let maxAmplitude = 0;
      for (let i = 0; i < mixed.length; i++) {
        const abs = Math.abs(mixed[i]);
        if (abs > maxAmplitude) maxAmplitude = abs;
      }

      if (maxAmplitude > 0) {
        const normalizeGain = 0.9 / maxAmplitude;
        for (let i = 0; i < mixed.length; i++) {
          mixed[i] *= normalizeGain;
        }
      }

      const signal = Array.from(mixed);
      setInputSignal(signal);
      setFileName('Voice Mix (Real Audio)');
      setOutputSignal([]);
      setProcessedAudioUrl(null);

      const inputAudioUrl = signalToAudioUrl(signal, sampleRate);
      setInputAudioUrl(inputAudioUrl);

    } catch (error) {
      console.error('❌ Error generating voice mix:', error);
      alert(`Failed to generate voice mix: ${error.message}`);
    }
  };

  const handleUpdateGain = async (index, gain) => {
    if (!config || inputSignal.length === 0) return;
    const newConfig = { ...config };
    const sub = newConfig.subdivisions[index];
    updateSubdivision(newConfig, index, sub.startFreq, sub.endFreq, parseFloat(gain));
    setConfig(newConfig);

    // Automatically process with updated gain
    setIsProcessing(true);
    setProgress(0);

    try {
      const processed = await processSignalInChunks(inputSignal, newConfig, (p) => setProgress(p));
      setOutputSignal(processed);
      const audioUrl = signalToAudioUrl(processed, sampleRate);
      setProcessedAudioUrl(audioUrl);
    } catch (error) {
      console.error('Error processing audio:', error);
      alert('Error processing audio: ' + error.message);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleProcess = async () => {
    if (inputSignal.length === 0 || !config) {
      alert('Please load audio and voice presets first!');
      return;
    }

    const durationInSeconds = inputSignal.length / sampleRate;
    if (durationInSeconds > 60) {
      const proceed = window.confirm(
        `This audio file is ${durationInSeconds.toFixed(1)} seconds long. Processing may take time. Continue?`
      );
      if (!proceed) return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const processed = await processSignalInChunks(inputSignal, config, (p) => setProgress(p));
      setOutputSignal(processed);
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
    if (inputAudioRef.current) {
      inputAudioRef.current.pause();
      inputAudioRef.current.currentTime = 0;
    }
  };

  const handleDownload = () => {
    if (!processedAudioUrl) return;
    const a = document.createElement('a');
    a.href = processedAudioUrl;
    a.download = 'voice-equalized.wav';
    a.click();
  };

  // ============================================================================
  // VOICE SEPARATION HANDLERS
  // ============================================================================

  const handleSeparationGainChange = (voiceIndex, value) => {
    const gainValue = parseFloat(value);
    setSeparationGains(prev => ({
      ...prev,
      [voiceIndex]: gainValue
    }));

    // Apply gain to audio player in real-time
    if (voiceAudioRefs.current[voiceIndex]) {
      voiceAudioRefs.current[voiceIndex].volume = Math.min(1.0, Math.max(0, gainValue));
    }
  };

  const handleRemixVoices = async () => {
    if (!separationResults || !separationResults.session_dir) {
      alert('No separation session available for remixing!');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('🎨 Remixing voices with new gains:', separationGains);

      const result = await adjustVoiceGains(separationResults.session_dir, separationGains);

      console.log('✅ Remix complete:', result);

      if (result.mixed_audio_url) {
        setSeparationResults(prev => ({
          ...prev,
          mixed_audio_url: result.mixed_audio_url,
          mixed_file: result.mixed_file
        }));

        await loadMixedSignalOnly(result.mixed_audio_url);
      }

      alert('Voices remixed successfully!');
    } catch (error) {
      console.error('❌ Remix error:', error);
      alert(`Remix failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSeparate = async () => {
    if (!uploadedFilePath && inputSignal.length === 0) {
      alert('Please upload an audio file or generate a synthetic signal first!');
      return;
    }

    setIsSeparating(true);
    setSeparationProgress({ stage: 'starting', progress: 0, message: 'Initializing...' });
    setSeparationResults(null);

    try {
      let fileToSeparate;

      if (!uploadedFilePath && inputSignal.length > 0) {
        console.log('🎵 Converting synthetic signal to WAV file for separation...');
        setSeparationProgress({ stage: 'converting', progress: 0.1, message: 'Converting synthetic signal...' });

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

      const durationInSeconds = inputSignal.length / sampleRate;
      if (durationInSeconds > 300) {
        const proceed = window.confirm(
          `This audio is ${(durationInSeconds / 60).toFixed(1)} minutes long. Processing may take 5-10 minutes. Continue?`
        );
        if (!proceed) {
          setIsSeparating(false);
          setSeparationProgress(null);
          return;
        }
      }

      const result = await separateVoices(
        fileToSeparate,
        separationGains,
        (progressData) => {
          setSeparationProgress(progressData);
        }
      );

      setSeparationResults(result);
      setSeparationProgress({ stage: 'complete', progress: 1.0, message: 'Complete!' });

      console.log('✅ Voice separation complete:', result);

      // Initialize gains for all detected voices
      if (result.sources) {
        const initialGains = {};
        result.sources.forEach((source, idx) => {
          initialGains[idx] = separationGains[idx] || 1.0;
        });
        setSeparationGains(initialGains);
      }

      const durationSeconds = result.duration || 0;
      loadAudioSignalsForSpectrograms(fileToSeparate, result.mixed_audio_url, durationSeconds);

      if (result.mixed_audio_url) {
        loadMixedSignalOnly(result.mixed_audio_url);
      }
    } catch (error) {
      console.error('❌ Separation error:', error);
      alert(`Error during separation: ${error.message}\n\nMake sure the backend server is running.`);
      setSeparationProgress(null);
    } finally {
      setIsSeparating(false);
    }
  };

  const loadAudioSignalsForSpectrograms = async (originalFile, mixedUrl, durationSeconds = 0) => {
    try {
      console.log('🎵 Loading audio signals for spectrograms...');
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      let maxSamples;
      if (durationSeconds > 300) {
        maxSamples = sampleRate * 15;
      } else if (durationSeconds > 180) {
        maxSamples = sampleRate * 20;
      } else {
        maxSamples = sampleRate * 30;
      }

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

      let originalArrayBuffer;
      if (originalFile instanceof File) {
        originalArrayBuffer = await originalFile.arrayBuffer();
      } else {
        const response = await fetch(originalFile);
        originalArrayBuffer = await response.arrayBuffer();
      }
      const originalAudioBuffer = await audioContext.decodeAudioData(originalArrayBuffer);
      const originalChannel = originalAudioBuffer.getChannelData(0);
      const downsampledOriginal = downsampleSignal(originalChannel, maxSamples);

      const mixedResponse = await fetch(mixedUrl);
      const mixedArrayBuffer = await mixedResponse.arrayBuffer();
      const mixedAudioBuffer = await audioContext.decodeAudioData(mixedArrayBuffer);
      const mixedChannel = mixedAudioBuffer.getChannelData(0);
      const downsampledMixed = downsampleSignal(mixedChannel, maxSamples);

      setOriginalSignalForSpec(downsampledOriginal);
      setMixedSignalForSpec(downsampledMixed);

      console.log(`✅ Loaded signals for spectrograms (${downsampledOriginal.length} samples)`);
    } catch (error) {
      console.error('❌ Error loading signals for spectrograms:', error);
    }
  };

  const downsampleForViewer = (signal, maxSamples = 100000) => {
    if (signal.length <= maxSamples) return signal;
    const step = Math.ceil(signal.length / maxSamples);
    const downsampled = [];
    for (let i = 0; i < signal.length; i += step) {
      downsampled.push(signal[i]);
    }
    return downsampled;
  };

  const loadMixedSignalOnly = async (mixedUrl) => {
    try {
      console.log('📂 Loading mixed signal for viewer...');
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const response = await fetch(mixedUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);
      const downsampledMixed = downsampleForViewer(Array.from(channelData));
      setMixedSignal(downsampledMixed);
      console.log(`✅ Mixed signal loaded: ${downsampledMixed.length} samples`);
    } catch (error) {
      console.error('❌ Error loading mixed signal:', error);
    }
  };

  const handleSeparationReset = () => {
    setSeparationResults(null);
    setSeparationGains({});
    setMixedSignal([]);
    setSeparationProgress(null);
    setIsSeparating(false);
    setShowSeparationSpectrograms(false);
    console.log('🔄 Voice separation reset');
  };

  const handleDownloadVoice = async (voicePath, voiceName) => {
    const url = filePathToUrl(voicePath);
    await downloadFile(url, voiceName);
  };

  const handleDownloadAll = async () => {
    if (!separationResults) return;
    try {
      if (separationResults.sources) {
        for (const source of separationResults.sources) {
          await handleDownloadVoice(source.file, source.name);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      if (separationResults.mixed_file) {
        await handleDownloadVoice(separationResults.mixed_file, 'mixed_voices.wav');
      }
      alert('All files downloaded successfully!');
    } catch (error) {
      console.error('❌ Download error:', error);
      alert('Failed to download some files: ' + error.message);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="task3-music-equalizer">
      {/* Audio Upload */}
      <AudioUpload
        onAudioLoaded={handleAudioLoaded}
        fileName={fileName}
        mode="voice"
        onGenerateSignal={handleGenerateSignal}
      />

      {/* Mode Selector */}
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
            <span className="mode-icon">🎤</span>
            <div className="mode-info">
              <span className="mode-label">Voice Separation</span>
              <span className="mode-desc">AI-powered voice separation</span>
            </div>
          </button>
        </div>
        {!uploadedFilePath && inputSignal.length === 0 && mode === 'separation' && (
          <p className="mode-warning">⚠️ Please upload an audio file or generate a synthetic signal to use Voice Separation</p>
        )}
        {!uploadedFilePath && inputSignal.length > 0 && mode === 'separation' && (
          <p className="mode-info">ℹ️ Synthetic signal ready for separation ({(inputSignal.length / sampleRate).toFixed(1)}s)</p>
        )}
      </section>

      {/* EQUALIZER MODE */}
      {mode === 'equalizer' && (
        <>
          <section className="control-panel">
            <h2>Frequency-Based Voice Equalization</h2>
            <p className="mode-description">
              Adjust individual frequency bands to enhance or reduce different voice characteristics.
            </p>

            {isLoaded && (
              <div className="instruments-grid">
                {voices.map((voice) => (
                  <div key={voice.index} className="item-card">
                    <div className="item-header">
                      <span className="item-icon">{voice.icon}</span>
                      <span className="item-name">{voice.name}</span>
                      <span className="item-confidence">
                        {voice.minFreq}-{voice.maxFreq} Hz
                      </span>
                    </div>
                    {voice.description && (
                      <div className="item-info">{voice.description}</div>
                    )}
                    <div className="item-slider">
                      <div className="slider-group">
                        <label>
                          Gain: <span className="slider-value">
                            {config?.subdivisions[voice.index]?.scale.toFixed(2) || '1.00'}x
                          </span>
                        </label>
                        <div className="slider-container">
                          <span className="slider-label">0x</span>
                          <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.01"
                            value={config?.subdivisions[voice.index]?.scale ?? 1.0}
                            onChange={(e) => handleUpdateGain(voice.index, e.target.value)}
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

          {inputSignal.length > 0 && (
            <div className="linked-viewers-section">
              <h2>Time-Domain Signal Analysis</h2>
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

          {/* Spectrum Viewers - Split into Linear and Audiogram sections */}
          {inputSignal.length > 0 && (
            <>
              {/* Linear Scale - Side by Side */}
              <div className="spectrum-section">
                <h2>Frequency Spectrum (Linear Scale)</h2>
                <div className="side-by-side">
                  <DualSpectrumViewer
                    originalSignal={inputSignal}
                    processedSignal={outputSignal}
                    sampleRate={sampleRate}
                    inline={true}
                    showInput={true}
                    showOutput={false}
                    title="Input Signal"
                  />
                  <DualSpectrumViewer
                    originalSignal={inputSignal}
                    processedSignal={outputSignal}
                    sampleRate={sampleRate}
                    inline={true}
                    showInput={false}
                    showOutput={true}
                    title="Output Signal"
                  />
                </div>
              </div>

              {/* Audiogram Scale - Side by Side */}
              <div className="spectrum-section">
                <h2>Frequency Spectrum (Audiogram Scale)</h2>
                <div className="side-by-side">
                  <DualSpectrumViewer
                    originalSignal={inputSignal}
                    processedSignal={outputSignal}
                    sampleRate={sampleRate}
                    inline={true}
                    audiogramOnly={true}
                    showInput={true}
                    showOutput={false}
                    title="Input Signal"
                  />
                  <DualSpectrumViewer
                    originalSignal={inputSignal}
                    processedSignal={outputSignal}
                    sampleRate={sampleRate}
                    inline={true}
                    audiogramOnly={true}
                    showInput={false}
                    showOutput={true}
                    title="Output Signal"
                  />
                </div>
              </div>
            </>
          )}

          {inputSignal.length > 0 && (
            <div className="spectrograms-section">
              <div className="section-header">
                <h2>Spectrograms</h2>
                <button className="toggle-btn" onClick={() => setShowSpectrograms(!showSpectrograms)}>
                  {showSpectrograms ? '👁️ Hide' : '👁️ Show'} Spectrograms
                </button>
              </div>

              {showSpectrograms && (
                <div className="spectrograms-grid">
                  <SpectrogramViewer signal={inputSignal} sampleRate={sampleRate} title="Input" />
                  <SpectrogramViewer
                    signal={outputSignal.length > 0 ? outputSignal : inputSignal}
                    sampleRate={sampleRate}
                    title="Output"
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* SEPARATION MODE */}
      {mode === 'separation' && (
        <div className="instruments-separation-mode">
          {/* Voice Controls - Gain Sliders */}
          <section className="separation-controls">
            <h2>🎚️ Voice Gain Controls</h2>
            <p className="section-description">
              Adjust gain for each detected voice (0.0x = muted, 1.0x = original, 2.0x = doubled)
            </p>

            {separationResults && separationResults.sources && separationResults.sources.length > 0 && (
              <div className="stems-controls-grid">
                {separationResults.sources.map((source, idx) => (
                  <div key={idx} className="stem-control-card" style={{ borderLeft: `4px solid #6366f1` }}>
                    <div className="stem-control-header">
                      <span className="stem-icon">🎤</span>
                      <span className="stem-name">{source.name}</span>
                      <span className="stem-gain-value">{(separationGains[idx] || 1.0).toFixed(2)}x</span>
                    </div>
                    <div className="stem-slider-container">
                      <span className="slider-min">0.0x</span>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.01"
                        value={separationGains[idx] || 1.0}
                        onChange={(e) => handleSeparationGainChange(idx, e.target.value)}
                        className="stem-gain-slider"
                        disabled={isSeparating}
                        style={{
                          background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((separationGains[idx] || 1.0) / 2) * 100}%, #ddd ${((separationGains[idx] || 1.0) / 2) * 100}%, #ddd 100%)`
                        }}
                      />
                      <span className="slider-max">2.0x</span>
                    </div>
                    <div className="stem-quick-actions">
                      <button
                        className="stem-action-btn"
                        onClick={() => handleSeparationGainChange(idx, '0')}
                        disabled={isSeparating}
                        title="Mute"
                      >
                        🔇
                      </button>
                      <button
                        className="stem-action-btn"
                        onClick={() => handleSeparationGainChange(idx, '1.0')}
                        disabled={isSeparating}
                        title="Reset to 1.0x"
                      >
                        ↺
                      </button>
                      <button
                        className="stem-action-btn"
                        onClick={() => handleSeparationGainChange(idx, '2.0')}
                        disabled={isSeparating}
                        title="Boost to 2.0x"
                      >
                        🔊
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Processing Controls */}
          <section className="separation-actions">
            <div className="action-buttons">
              <button
                className="separate-btn"
                onClick={handleSeparate}
                disabled={isSeparating || (!uploadedFilePath && inputSignal.length === 0)}
              >
                <span className="btn-icon">🎤</span>
                {isSeparating ? 'Separating...' : 'Separate & Mix Voices'}
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
                  Download All Voices
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
            </section>
          )}

          {/* Results Display */}
          {separationResults && (
            <section className="separation-results">
              <h2>🎧 Separation Results</h2>

              {/* Individual Separated Voices */}
              <div className="stems-with-viewers-section">
                <h3>🎵 Individual Separated Voices</h3>
                <div className="stems-viewers-grid">
                  {separationResults.sources && separationResults.sources.map((source, idx) => {
                    const sourceUrl = separationResults.source_urls?.[idx]?.url || `http://localhost:5001/api/download/${encodeURIComponent(source.file)}`;
                    return (
                      <div key={idx} className="stem-viewer-card" style={{ borderLeft: `4px solid #6366f1` }}>
                        <div className="stem-viewer-header">
                          <div className="stem-title">
                            <span className="stem-icon-large">🎤</span>
                            <span className="stem-name-large">{source.name}</span>
                          </div>
                          <button
                            className="stem-download-btn-compact"
                            onClick={() => downloadFile(sourceUrl, `${source.name}.wav`)}
                            title={`Download ${source.name}`}
                          >
                            💾
                          </button>
                        </div>

                        <div className="stem-gain-control-inline">
                          <label>Gain: {(separationGains[idx] ?? 1.0).toFixed(2)}x</label>
                          <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.01"
                            value={separationGains[idx] ?? 1.0}
                            onChange={(e) => handleSeparationGainChange(idx, e.target.value)}
                            className="stem-gain-slider-compact"
                            style={{
                              background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((separationGains[idx] ?? 1.0) / 2) * 100}%, #ddd ${((separationGains[idx] ?? 1.0) / 2) * 100}%, #ddd 100%)`
                            }}
                          />
                          <div className="gain-quick-btns">
                            <button onClick={() => handleSeparationGainChange(idx, '0')} title="Mute">🔇</button>
                            <button onClick={() => handleSeparationGainChange(idx, '1.0')} title="Reset">↺</button>
                            <button onClick={() => handleSeparationGainChange(idx, '2.0')} title="Boost">🔊</button>
                          </div>
                        </div>

                        <div className="stem-audio-player">
                          <audio
                            ref={(el) => { if (el) voiceAudioRefs.current[idx] = el; }}
                            controls
                            style={{ width: '100%' }}
                            onLoadedMetadata={(e) => {
                              // Set initial volume based on gain
                              e.target.volume = Math.min(1.0, Math.max(0, separationGains[idx] ?? 1.0));
                            }}
                          >
                            <source src={sourceUrl} type="audio/wav" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Remix Controls */}
              <div className="remix-controls-section">
                <button
                  className="remix-btn"
                  onClick={handleRemixVoices}
                  disabled={isProcessing}
                >
                  {isProcessing ? '🔄 Remixing...' : '🎨 Apply Gains & Remix Voices'}
                </button>
                <button
                  className="reset-gains-btn"
                  onClick={() => {
                    const resetGains = {};
                    separationResults.sources.forEach((_, idx) => {
                      resetGains[idx] = 1.0;
                    });
                    setSeparationGains(resetGains);
                  }}
                  disabled={isProcessing}
                >
                  ↺ Reset All Gains to 1.0x
                </button>
              </div>

              {/* Mixed Output with Viewer */}
              {separationResults.mixed_audio_url && mixedSignal.length > 0 && (
                <div className="mixed-output-with-viewer-section">
                  <h3>🎵 Reconstructed Mixed Output</h3>
                  <div className="mixed-output-card">
                    <div className="mixed-output-info">
                      <p>
                        <strong>Duration:</strong> {(separationResults.duration || 0).toFixed(2)}s |
                        <strong> Sample Rate:</strong> {separationResults.sample_rate} Hz
                      </p>
                    </div>

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
              )}

              {/* Spectrograms Comparison */}
              {originalSignalForSpec.length > 0 && mixedSignalForSpec.length > 0 && (
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
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
