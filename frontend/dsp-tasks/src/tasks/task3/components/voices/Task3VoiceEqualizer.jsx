
import React, { useState, useEffect, useRef, useCallback } from 'react';
import AudioUpload from '../shared/AudioUpload';
import ProcessingSection from '../shared/ProcessingSection';
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
import { signalToAudioUrl } from '../../services/audioService';
import '../music/Task3MusicEqualizer.css';

export default function Task3VoiceEqualizer() {
  // Refs for audio players
  const inputAudioRef = useRef(null);
  const processedAudioRef = useRef(null);
  
  // Signal state
  const [inputSignal, setInputSignal] = useState([]);
  const [outputSignal, setOutputSignal] = useState([]);
  const [sampleRate] = useState(44100);
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

  const handleAudioLoaded = async (audioData) => {
    setInputSignal(audioData.signal);
    setFileName(audioData.fileName);
    setOutputSignal([]);
    setProcessedAudioUrl(null);
    
    if (config) {
      config.sampleRate = sampleRate;
    }

    // Generate audio URL for original audio player
    try {
      const audioUrl = await signalToAudioUrl(audioData.signal, sampleRate);
      setInputAudioUrl(audioUrl);
    } catch (error) {
      console.error('Error creating audio URL:', error);
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
      alert('Please load audio and instrument presets first!');
      return;
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

  const handleReset = () => {
    setOutputSignal([]);
    setProcessedAudioUrl(null);
    setProgress(0);
    
    // Stop and reset audio players
    if (inputAudioRef.current) {
      inputAudioRef.current.pause();
      inputAudioRef.current.currentTime = 0;
    }
    if (processedAudioRef.current) {
      processedAudioRef.current.pause();
      processedAudioRef.current.currentTime = 0;
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

      {/* Original Audio Player */}
      {inputAudioUrl && (
        <section className="audio-player-section">
          <h3>Original Audio</h3>
          <audio ref={inputAudioRef} controls src={inputAudioUrl} className="audio-player">
            Your browser does not support the audio element.
          </audio>
        </section>
      )}

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
        <ProcessingSection
          onProcess={handleProcess}
          onReset={handleReset}
          onDownload={handleDownload}
          processedAudio={processedAudioUrl}
          isProcessing={isProcessing}
          progress={progress}
          audioRef={processedAudioRef}
        />
      )}

      {/* Dual Spectrum Viewer */}
      {inputSignal.length > 0 && (
        <DualSpectrumViewer
          originalSignal={inputSignal}
          processedSignal={outputSignal}
          sampleRate={sampleRate}
        />
      )}

      {/* Linked Cine Signal Viewers */}
      {inputSignal.length > 0 && (
        <section className="linked-viewers-section">
          <h3>Linked Signal Cine Viewers (Synchronized)</h3>
          <div className="viewers-container">
            <div className="viewer-wrapper">
              <h4>Input Signal</h4>
              <CineSignalViewer
                signal={inputSignal}
                sampleRate={sampleRate}
                title="Input Signal"
                audioUrl={inputAudioUrl}
                linkedViewerState={linkedViewerState}
                onViewStateChange={handleViewStateChange}
              />
            </div>
            <div className="viewer-wrapper">
              <h4>Output Signal (Processed)</h4>
              <CineSignalViewer
                signal={outputSignal.length > 0 ? outputSignal : inputSignal}
                sampleRate={sampleRate}
                title="Output Signal"
                audioUrl={processedAudioUrl}
                linkedViewerState={linkedViewerState}
                onViewStateChange={handleViewStateChange}
              />
            </div>
          </div>
        </section>
      )}

      {/* Spectrograms Section */}
      {inputSignal.length > 0 && (
        <section className="spectrograms-section">
          <div className="section-header">
            <h3>Spectrograms (Time-Frequency Analysis)</h3>
            <button
              className="toggle-btn"
              onClick={() => setShowSpectrograms(!showSpectrograms)}
            >
              {showSpectrograms ? 'Hide' : 'Show'} Spectrograms
            </button>
          </div>
          {showSpectrograms && (
            <div className="spectrograms-container">
              <div className="spectrogram-wrapper">
                <h4>Input Signal Spectrogram</h4>
                <SpectrogramViewer
                  signal={inputSignal}
                  sampleRate={sampleRate}
                  title="Input Spectrogram"
                />
              </div>
              <div className="spectrogram-wrapper">
                <h4>Output Signal Spectrogram</h4>
                <SpectrogramViewer
                  signal={outputSignal.length > 0 ? outputSignal : inputSignal}
                  sampleRate={sampleRate}
                  title="Output Spectrogram"
                />
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
