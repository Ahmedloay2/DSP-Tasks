/**
 * Audio Upload Component
 * Handles audio file upload and synthetic signal generation
 */
import React, { useRef } from 'react';
import './AudioUpload.css';

export default function AudioUpload({ onAudioLoaded, fileName, onGenerateSignal, mode }) {
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Extract mono signal
      const channelData = audioBuffer.getChannelData(0);
      const signal = Array.from(channelData);

      onAudioLoaded({
        signal,
        sampleRate: audioBuffer.sampleRate,
        duration: audioBuffer.duration,
        fileName: file.name
      });
    } catch (error) {
      console.error('Error loading audio:', error);
      alert('Error loading audio file: ' + error.message);
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
        />
        <button 
          className="upload-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          📁 Upload Audio File
        </button>
        <span className="file-name">
          {fileName || 'No file selected'}
        </span>
      </div>

      <div className="synthetic-controls">
        <h3>Or Generate Synthetic Signal</h3>
        <button className="secondary-btn" onClick={onGenerateSignal}>
          {getGenerateButtonText()}
        </button>
      </div>
    </section>
  );
}
