
import React, { useState, useEffect, useRef, useCallback } from 'react';
import AudioUpload from '../shared/AudioUpload';
import ProcessingSection from '../shared/ProcessingSection';
import DualSpectrumViewer from '../shared/DualSpectrumViewer';
import CineSignalViewer from '../shared/CineSignalViewer';
import SpectrogramViewer from '../shared/SpectrogramViewer';
import { ANIMAL_PRESETS } from '../../data/modePresets';
import {
  createGenericMode,
  addSubdivision,
  updateSubdivision,
  processSignalInChunks,
  generateSyntheticSignal
} from '../../services/equalizerService';
import '../music/Task3MusicEqualizer.css';

export default function Task3AnimalEqualizer() {
  // Refs for audio players
  const inputAudioRef = useRef(null);
  const processedAudioRef = useRef(null);
  
  // Signal state
  const [inputSignal, setInputSignal] = useState([]);
  const [outputSignal, setOutputSignal] = useState([]);
  const [sampleRate] = useState(44100);
  const [fileName, setFileName] = useState('');
  const [inputAudioUrl, setInputAudioUrl] = useState(null);
  const [processedAudioUrl, setProcessedAudioUrl] = useState(null);

  // Configuration state
  const [config, setConfig] = useState(null);
  const [animals, setAnimals] = useState([]);
  
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

  // Initialize with empty config (load presets automatically)
  useEffect(() => {
    const newConfig = createGenericMode(sampleRate);
    ANIMAL_PRESETS.forEach(preset => {
      addSubdivision(newConfig, preset.minFreq, preset.maxFreq, preset.gain);
    });
    setConfig(newConfig);
    setAnimals(ANIMAL_PRESETS.map((p, i) => ({ ...p, index: i })));
    setIsLoaded(true);
  }, [sampleRate]);

  const handleAudioLoaded = (audioData) => {
    setInputSignal(audioData.signal);
    setFileName(audioData.fileName);
    setOutputSignal([]);
    setProcessedAudioUrl(null);
    
    const inputUrl = signalToAudioUrl(audioData.signal, audioData.sampleRate);
    setInputAudioUrl(inputUrl);
    
    if (config) {
      config.sampleRate = audioData.sampleRate;
    }
  };

  const handleGenerateSignal = () => {
    const frequencies = [150, 300, 600, 1200, 2400, 4800];
    const amplitudes = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5];
    const signal = generateSyntheticSignal(frequencies, amplitudes, sampleRate, 5.0);
    
    setInputSignal(signal);
    setFileName('Animal Sound Test Signal');
    setOutputSignal([]);
    setProcessedAudioUrl(null);
    
    const inputUrl = signalToAudioUrl(signal, sampleRate);
    setInputAudioUrl(inputUrl);
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
    a.download = 'animal-equalized.wav';
    a.click();
  };

  return (
    <div className="task3-animal-equalizer">
      {/* Audio Upload */}
      <AudioUpload
        onAudioLoaded={handleAudioLoaded}
        fileName={fileName}
        onGenerateSignal={handleGenerateSignal}
        mode="animal"
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
        <h2>Animal Sounds Mode</h2>

        {/* Animals Grid */}
        {isLoaded && (
          <div className="animals-grid">
            {animals.map((animal) => (
              <div key={animal.index} className="item-card">
                <div className="item-header">
                  <span className="item-icon">{animal.icon}</span>
                  <span className="item-name">{animal.name}</span>
                  <span className="item-confidence">
                    {animal.minFreq}-{animal.maxFreq} Hz
                  </span>
                </div>
                <div className="item-slider">
                  <div className="slider-group">
                    <label>
                      Gain: <span className="slider-value">
                        {config?.subdivisions[animal.index]?.scale.toFixed(2) || '1.00'}x
                      </span>
                    </label>
                    <div className="slider-container">
                      <span className="slider-label">0x</span>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.01"
                        value={config?.subdivisions[animal.index]?.scale ?? 1.0}
                        onChange={(e) => handleUpdateGain(animal.index, e.target.value)}
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
