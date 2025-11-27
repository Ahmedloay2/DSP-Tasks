
import React, { useState, useEffect, useRef, useCallback } from 'react';
import AudioUpload from '../shared/AudioUpload';
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

  // Signal state
  const [inputSignal, setInputSignal] = useState([]);
  const [outputSignal, setOutputSignal] = useState([]);
  const [sampleRate, setSampleRate] = useState(44100);
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

  // Initialize with empty config (load presets automatically) - only run once on mount
  useEffect(() => {
    const newConfig = createGenericMode(sampleRate);
    ANIMAL_PRESETS.forEach(preset => {
      addSubdivision(newConfig, preset.minFreq, preset.maxFreq, preset.gain);
    });
    setConfig(newConfig);
    setAnimals(ANIMAL_PRESETS.map((p, i) => ({ ...p, index: i })));
    setIsLoaded(true);
  }, []); // Empty dependency array - only run once

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

    // Update config with new sample rate WITHOUT losing subdivisions
    if (config) {
      const updatedConfig = {
        ...config,
        sampleRate: audioData.sampleRate
      };
      setConfig(updatedConfig);
    }
  };

  const handleGenerateSignal = async () => {
    try {
      console.log('🎵 Generating synthetic signal from real animal audio samples...');

      // Get all animal presets with audio files
      const animalsWithAudio = ANIMAL_PRESETS.filter(preset => preset.audioFile);

      if (animalsWithAudio.length === 0) {
        console.warn('No audio files found in animal presets, using fallback');
        // Fallback to sine waves
        const frequencies = [150, 300, 600, 1200, 2400, 4800];
        const amplitudes = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5];
        const signal = generateSyntheticSignal(frequencies, amplitudes, sampleRate, 5.0);
        setInputSignal(signal);
        setFileName('Animal Sound Test Signal (Synthetic)');
        setOutputSignal([]);
        setProcessedAudioUrl(null);
        const inputAudioUrl = signalToAudioUrl(signal, sampleRate);
        setInputAudioUrl(inputAudioUrl);
        return;
      }

      console.log(`📂 Loading ${animalsWithAudio.length} animal audio samples...`);

      // Create AudioContext
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Load all audio files
      const loadPromises = animalsWithAudio.map(async (preset) => {
        const audioPath = `/audio_samples/animals/${preset.audioFile}`;
        console.log(`📥 Loading ${preset.name}: ${audioPath}`);

        const response = await fetch(audioPath);
        if (!response.ok) {
          throw new Error(`Failed to load ${preset.name}: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        console.log(`✅ Loaded ${preset.name}: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.sampleRate}Hz`);

        return {
          name: preset.name,
          buffer: audioBuffer,
          preset: preset
        };
      });

      const loadedAudios = await Promise.all(loadPromises);
      console.log('✅ All audio files loaded successfully');

      // Create a 5-second mix
      const targetDuration = 5.0; // seconds
      const targetSamples = Math.floor(targetDuration * sampleRate);
      const mixed = new Float32Array(targetSamples);

      // Mix all animal sounds
      loadedAudios.forEach(({ name, buffer, preset }) => {
        // Get audio data (use first channel if stereo)
        const channelData = buffer.getChannelData(0);

        // Simple approach: don't resample, just use at native rate and trim/loop as needed
        const samplesToUse = Math.min(channelData.length, targetSamples);

        // Mix into the output (loop if source is shorter than 5 seconds)
        for (let i = 0; i < targetSamples; i++) {
          const srcIndex = i % samplesToUse;
          mixed[i] += channelData[srcIndex] * preset.gain;
        }
      });

      // Normalize to prevent clipping (leave headroom)
      let maxAmplitude = 0;
      for (let i = 0; i < mixed.length; i++) {
        const abs = Math.abs(mixed[i]);
        if (abs > maxAmplitude) maxAmplitude = abs;
      }

      if (maxAmplitude > 0) {
        const normalizeGain = 0.9 / maxAmplitude; // 0.9 for 10% headroom
        for (let i = 0; i < mixed.length; i++) {
          mixed[i] *= normalizeGain;
        }
        console.log(`📊 Normalized: max amplitude ${maxAmplitude.toFixed(3)} → 0.9`);
      }

      // Convert Float32Array to regular array
      const signal = Array.from(mixed);

      console.log(`✅ Generated ${targetDuration}s mixed signal with ${animalsWithAudio.length} animals`);

      setInputSignal(signal);
      setFileName('Animal Sound Mix (Real Audio)');
      setOutputSignal([]);
      setProcessedAudioUrl(null);

      // Create audio URL for synthetic signal
      const inputAudioUrl = signalToAudioUrl(signal, sampleRate);
      setInputAudioUrl(inputAudioUrl);

    } catch (error) {
      console.error('❌ Error generating animal sound mix:', error);
      alert(`Failed to generate animal sound mix: ${error.message}`);
    }
  };

  const handleUpdateGain = async (index, gain) => {
    if (!config) return;

    const newConfig = { ...config };
    const sub = newConfig.subdivisions[index];
    updateSubdivision(newConfig, index, sub.startFreq, sub.endFreq, parseFloat(gain));
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

  const handleProcess = async () => {
    if (inputSignal.length === 0 || !config) {
      alert('Please load audio and animal presets first!');
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
