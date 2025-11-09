
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
import '../music/Task3MusicEqualizer.css';

export default function Task3VoiceEqualizer() {
  // Refs for audio players
  const inputAudioRef = useRef(null);

  // Signal state
  const [inputSignal, setInputSignal] = useState([]);
  const [outputSignal, setOutputSignal] = useState([]);
  const [sampleRate, setSampleRate] = useState(44100);
  const [fileName, setFileName] = useState('');
  const [processedAudioUrl, setProcessedAudioUrl] = useState(null);
  const [inputAudioUrl, setInputAudioUrl] = useState(null);

  // Configuration state
  const [config, setConfig] = useState(null);
  const [voices, setVoices] = useState([]);

  // UI state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSpectrograms, setShowSpectrograms] = useState(false);
  const [linkedViewerState, setLinkedViewerState] = useState({
    zoom: 1,
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

  // Auto-load voice presets on mount
  useEffect(() => {
    handleLoadPresets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAudioLoaded = (audioData) => {
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

    // Update config with new sample rate
    if (config) {
      const updatedConfig = { ...config, sampleRate: audioData.sampleRate };
      setConfig(updatedConfig);
    }
  };

  const handleLoadPresets = () => {
    const newConfig = createGenericMode(sampleRate);

    // Add all voice frequency bands
    VOICE_PRESETS.forEach(preset => {
      addSubdivision(newConfig, preset.minFreq, preset.maxFreq, preset.gain);
    });

    setConfig(newConfig);
    setVoices(VOICE_PRESETS.map((p, i) => ({ ...p, index: i })));
    setIsLoaded(true);
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
      alert('Please load audio and voice presets first!');
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
    a.download = 'voice-equalized.wav';
    a.click();
  };

  return (
    <div className="task3-voice-equalizer">
      {/* Audio Upload */}
      <AudioUpload
        onAudioLoaded={handleAudioLoaded}
        fileName={fileName}
        mode="voice"
      />

      {/* Control Panel */}
      <section className="control-panel">
        <h2>Human Voices Mode</h2>

        {/* Voices Grid */}
        {isLoaded && (
          <div className="voices-grid">
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
    </div>
  );
}
