import React from 'react';
import './SpeechHeader.css';

/**
 * SpeechHeader Component
 * Displays title and description for Speech Recognition task
 */
export default function SpeechHeader() {
    return (
        <div className="task2-speech-header">
            <div className="task2-speech-header-content">
                <h1 className="task2-speech-title">
                    <span className="task2-speech-icon">🎙️</span>
                    Speech Recognition & Analysis
                </h1>
                <p className="task2-speech-subtitle">
                    Upload audio, recognize gender, analyze resampling effects, and apply anti-aliasing
                </p>
            </div>
            <div className="task2-speech-features">
                <div className="task2-feature-badge">
                    <span className="task2-badge-icon">🎵</span>
                    <span className="task2-badge-text">Audio Upload</span>
                </div>
                <div className="task2-feature-badge">
                    <span className="task2-badge-icon">👤</span>
                    <span className="task2-badge-text">Gender Recognition</span>
                </div>
                <div className="task2-feature-badge">
                    <span className="task2-badge-icon">🔄</span>
                    <span className="task2-badge-text">Resampling</span>
                </div>
                <div className="task2-feature-badge">
                    <span className="task2-badge-icon">✨</span>
                    <span className="task2-badge-text">Anti-Aliasing</span>
                </div>
            </div>
        </div>
    );
}
