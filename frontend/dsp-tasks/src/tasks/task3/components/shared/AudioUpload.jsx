/**
 * Audio Upload Component
 * Handles audio file upload and synthetic signal generation
 */
import React, { useRef, useState } from 'react';
import './AudioUpload.css';

export default function AudioUpload({ onAudioLoaded, fileName, onGenerateSignal, mode }) {
  const fileInputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Read file (0-30%)
      setUploadProgress(10);
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      setUploadProgress(20);
      const arrayBuffer = await file.arrayBuffer();
      
      setUploadProgress(30);
      
      // Step 2: Decode audio (30-70%)
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      setUploadProgress(70);

      const duration = audioBuffer.duration;
      const MAX_DURATION = 60; // 1 minute limit for performance
      
      // Warn user about long files
      if (duration > MAX_DURATION) {
        setIsUploading(false);
        setUploadProgress(0);
        
        const shouldContinue = confirm(
          `⚠️ Warning: This audio is ${duration.toFixed(1)} seconds (${(duration/60).toFixed(1)} minutes).\n\n` +
          `For best performance, we recommend files under ${MAX_DURATION} seconds.\n\n` +
          `Long files may cause the application to slow down or freeze.\n\n` +
          `Continue loading this file?`
        );
        
        if (!shouldContinue) {
          e.target.value = ''; // Reset file input
          return;
        }
        
        setIsUploading(true);
        setUploadProgress(70);
      }

      // Step 3: Extract signal (70-90%)
      setUploadProgress(80);
      const channelData = audioBuffer.getChannelData(0);
      const signal = Array.from(channelData);
      
      setUploadProgress(90);

      // Step 4: Complete (90-100%)
      onAudioLoaded({
        signal,
        sampleRate: audioBuffer.sampleRate,
        duration: audioBuffer.duration,
        fileName: file.name
      });
      
      setUploadProgress(100);
      
      // Hide progress bar after a short delay
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error('Error loading audio:', error);
      alert('Error loading audio file: ' + error.message);
      setIsUploading(false);
      setUploadProgress(0);
      e.target.value = ''; // Reset file input
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
          disabled={isUploading}
        />
        <button 
          className="upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? '⏳ Loading...' : '📁 Upload Audio File'}
        </button>
        <span className="file-name">
          {fileName || 'No file selected'}
        </span>
      </div>

      {isUploading && (
        <div className="upload-progress-container">
          <div className="upload-progress-bar">
            <div 
              className="upload-progress-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className="upload-progress-text">
            {uploadProgress < 30 ? 'Reading file...' : 
             uploadProgress < 70 ? 'Decoding audio...' :
             uploadProgress < 90 ? 'Extracting signal...' :
             'Finalizing...'}
            {' '}({uploadProgress}%)
          </span>
        </div>
      )}

      <div className="synthetic-controls">
        <h3>Or Generate Synthetic Signal</h3>
        <button 
          className="secondary-btn" 
          onClick={onGenerateSignal}
          disabled={isUploading}
        >
          {getGenerateButtonText()}
        </button>
      </div>
    </section>
  );
}
