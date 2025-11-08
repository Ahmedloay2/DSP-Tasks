
import React, { useState } from 'react';
import Task3GenericEqualizer from './generic/Task3GenericEqualizer';
import Task3MusicEqualizer from './music/Task3MusicEqualizerNew';
import Task3AnimalEqualizer from './animals/Task3AnimalEqualizer';
import Task3VoiceEqualizer from './voices/Task3VoiceEqualizer';
import './Task3.css';

/**
 * Task 3 Component
 * 
 * Signal Equalizer with internal navigation between specialized modes
 * 
 * @component
 */
export default function Task3() {
  const [activeMode, setActiveMode] = useState('generic');

  const modes = [
    { id: 'generic', label: 'Generic Mode', icon: '⚙️', description: 'Custom Frequency Bands' },
    { id: 'music', label: 'Musical Instruments', icon: '🎸', description: 'Instrument Control' },
    { id: 'animals', label: 'Animal Sounds', icon: '🐾', description: 'Animal Sound Mixing' },
    { id: 'voices', label: 'Human Voices', icon: '🎤', description: 'Voice Processing' }
  ];

  const renderMode = () => {
    switch (activeMode) {
      case 'generic':
        return <Task3GenericEqualizer />;
      case 'music':
        return <Task3MusicEqualizer />;
      case 'animals':
        return <Task3AnimalEqualizer />;
      case 'voices':
        return <Task3VoiceEqualizer />;
      default:
        return <Task3GenericEqualizer />;
    }
  };

  return (
    <div className="task3-equalizer-container">
      {/* Header */}
      <header className="task3-equalizer-header">
        <h1>🎵 Audio Equalizer System</h1>
        <p className="task3-equalizer-subtitle">FFT-based Equalizer with Generic & Specialized Modes</p>
      </header>

      {/* Mode Selection */}
      <section className="task3-mode-selection">
        <h2>Select Equalizer Mode</h2>
        <div className="task3-equalizer-mode-buttons">
          {modes.map((mode) => (
            <button
              key={mode.id}
              className={`task3-equalizer-nav-btn ${activeMode === mode.id ? 'active' : ''}`}
              onClick={() => setActiveMode(mode.id)}
            >
              <span className="task3-equalizer-nav-icon">{mode.icon}</span>
              <div className="task3-equalizer-nav-text">
                <span className="task3-equalizer-nav-label">{mode.label}</span>
                <span className="task3-equalizer-nav-desc">{mode.description}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <main className="task3-equalizer-main-content">
        {renderMode()}
      </main>

      {/* Info Section */}
      <section className="task3-info-section">
        <div className="task3-info-grid">
          <div className="task3-info-card">
            <h3>🎵 Generic Mode</h3>
            <p>Create custom frequency subdivisions with arbitrary control. Scale from 0.0x to 2.0x per band.</p>
          </div>
          <div className="task3-info-card">
            <h3>🎸 Musical Instruments</h3>
            <p>Automatic detection of 6+ instruments including bass, guitar, piano, drums, and more.</p>
          </div>
          <div className="task3-info-card">
            <h3>🐾 Animal Sounds</h3>
            <p>Detect and control 8+ animal vocalizations from dogs to whales.</p>
          </div>
          <div className="task3-info-card">
            <h3>🎤 Human Voices</h3>
            <p>Analyze voice types with formant detection and language characteristics.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
