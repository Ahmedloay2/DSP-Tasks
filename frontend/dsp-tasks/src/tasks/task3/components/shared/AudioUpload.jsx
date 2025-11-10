/**
 * Audio Upload Component
 * Handles audio file upload and synthetic signal generation
 */
import React, { useRef, useEffect, useState } from 'react';
import './AudioUpload.css';

export default function AudioUpload({ onAudioLoaded, fileName, onGenerateSignal, mode }) {
  const fileInputRef = useRef(null);
  const currentFileRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('audio/')) {
      alert('Please select a valid audio file.');
      return;
    }

    setIsLoading(true);
    setLoadingProgress(0);

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Show progress for file reading
      setLoadingProgress(10);
      const arrayBuffer = await file.arrayBuffer();

      setLoadingProgress(30);

      // Decode audio data
      let audioBuffer;
      try {
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        setLoadingProgress(60);
      } catch (decodeError) {
        console.error('Decode error:', decodeError);
        alert('Error decoding audio file. Please ensure the file is a valid audio format (MP3, WAV, etc.).');
        setIsLoading(false);
        return;
      }

      // Extract mono signal in chunks to avoid freezing
      const channelData = audioBuffer.getChannelData(0);
      const totalSamples = channelData.length;

      // For very large files, downsample to prevent memory issues
      const maxSamples = 10 * 1024 * 1024; // 10 million samples max (~3.8 minutes at 44.1kHz)
      let signal;
      let effectiveSampleRate = audioBuffer.sampleRate;

      if (totalSamples > maxSamples) {
        // Downsample
        const downsampleRatio = Math.ceil(totalSamples / maxSamples);
        signal = new Array(Math.ceil(totalSamples / downsampleRatio));

        for (let i = 0; i < signal.length; i++) {
          signal[i] = channelData[i * downsampleRatio];

          // Update progress periodically
          if (i % 100000 === 0) {
            setLoadingProgress(60 + (i / signal.length) * 30);
            // Allow UI to update
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }

        // Adjust sample rate for downsampled signal
        effectiveSampleRate = audioBuffer.sampleRate / downsampleRatio;
        console.warn(`Audio downsampled from ${totalSamples} to ${signal.length} samples (ratio: ${downsampleRatio})`);
        console.warn(`Sample rate adjusted from ${audioBuffer.sampleRate} to ${effectiveSampleRate} Hz`);
      } else {
        // Convert to regular array in chunks
        const chunkSize = 500000; // Process 500k samples at a time
        signal = new Array(totalSamples);

        for (let start = 0; start < totalSamples; start += chunkSize) {
          const end = Math.min(start + chunkSize, totalSamples);
          for (let i = start; i < end; i++) {
            signal[i] = channelData[i];
          }

          setLoadingProgress(60 + ((start + chunkSize) / totalSamples) * 30);
          // Allow UI to update
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      setLoadingProgress(95);

      // Create audio URL from the original file
      const audioUrl = URL.createObjectURL(file);
      currentFileRef.current = audioUrl;

      // Get file path (for Electron environment)
      let filePath = null;
      if (file.path) {
        filePath = file.path; // Electron provides the full path
      }

      onAudioLoaded({
        signal,
        sampleRate: effectiveSampleRate,
        duration: audioBuffer.duration,
        fileName: file.name,
        audioUrl: audioUrl,  // Pass the original file URL
        filePath: filePath,  // Pass the file path for Python processing
        file: file           // Pass the original file object
      });

      setLoadingProgress(100);

      // Reset file input for re-uploading the same file
      e.target.value = '';

    } catch (error) {
      console.error('Error loading audio:', error);
      alert('Error loading audio file: ' + error.message + '\n\nPlease ensure the file is a valid audio format.');
      e.target.value = '';
    } finally {
      setIsLoading(false);
      setLoadingProgress(0);
    }
  };

  const getGenerateButtonText = () => {
    switch (mode) {
      case 'musical':
        return '🎵 Generate Instruments Mix';
      case 'animal':
        return '🐾 Generate Animal Sounds';
      case 'voice':
        return '🎤 Generate Voice Mix';
      default:
        return '🔊 Generate Test Signal';
    }
  };

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (currentFileRef.current) {
        URL.revokeObjectURL(currentFileRef.current);
      }
    };
  }, []);

  return (
    <section className="audio-upload-section">
      <h2>Audio Input</h2>

      <div className="upload-area">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={isLoading}
        />
        <button
          className="upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          {isLoading ? '⏳ Loading...' : '📁 Upload Audio File'}
        </button>
        <span className="file-name">
          {fileName || 'No file selected'}
        </span>
      </div>

      {isLoading && (
        <div className="loading-progress">
          <div className="progress-bar-upload">
            <div className="progress-fill-upload" style={{ width: `${loadingProgress}%` }}></div>
          </div>
          <span className="progress-text-upload">Loading audio... {Math.round(loadingProgress)}%</span>
        </div>
      )}

      <div className="synthetic-controls">
        <h3>Or Generate Synthetic Signal</h3>
        <button className="secondary-btn" onClick={onGenerateSignal} disabled={isLoading}>
          {getGenerateButtonText()}
        </button>
      </div>
    </section>
  );
}
