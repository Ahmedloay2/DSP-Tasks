import React from 'react';
import AudioPlayer from './AudioPlayer';
import './AntiAliasedAudioSection.css';

/**
 * AntiAliasedAudioSection Component
 * Handles anti-aliasing processing (independent operation)
 */
export default function AntiAliasedAudioSection({
    antiAliasedAudio,
    antiAliasingLoading,
    antiAliasedGender,
    antiAliasedGenderLoading,
    onAntiAliasing,
    onAntiAliasedGenderRecognition,
    onDownload
}) {
    return (
        <div className="task2-antialiased-audio-section">
            <div className="task2-section-header">
                <h3 className="task2-section-title">
                    <span className="task2-section-icon">✨</span>
                    Step 3: Anti-Aliasing Filter
                </h3>
                <p className="task2-section-description">
                    Apply anti-aliasing filter to reduce artifacts and restore audio quality.
                    Works on resampled audio if available, or directly on the original audio.
                </p>
            </div>

            {!antiAliasedAudio && (
                <>
                    {/* Info Box */}
                    <div className="task2-info-box">
                        <div className="task2-info-icon">📚</div>
                        <div className="task2-info-content">
                            <h4>What is Anti-Aliasing?</h4>
                            <p>
                                Anti-aliasing is a technique used to reduce or eliminate aliasing artifacts 
                                that occur when a signal is sampled at a rate lower than the Nyquist rate. 
                                It typically involves:
                            </p>
                            <ul>
                                <li><strong>Low-pass filtering:</strong> Removing high-frequency components before sampling</li>
                                <li><strong>Interpolation:</strong> Reconstructing the original signal from samples</li>
                                <li><strong>Smoothing:</strong> Reducing jagged edges and distortion</li>
                            </ul>
                        </div>
                    </div>

                    {/* Anti-Aliasing Button */}
                    <div className="task2-antialiasing-btn-container">
                        <button
                            onClick={onAntiAliasing}
                            disabled={antiAliasingLoading}
                            className="task2-antialiasing-btn"
                        >
                            {antiAliasingLoading ? (
                                <>
                                    <span className="task2-spinner"></span>
                                    Applying Anti-Aliasing...
                                </>
                            ) : (
                                <>
                                    <span className="task2-btn-icon">🎯</span>
                                    Apply Anti-Aliasing Filter
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}

            {/* Anti-Aliased Audio Player */}
            {antiAliasedAudio && (
                <div className="task2-antialiased-result">
                    <div className="task2-result-header">
                        <h4 className="task2-result-title">
                            <span className="task2-result-icon">🎉</span>
                            Anti-Aliased Audio
                        </h4>
                        <div className="task2-result-badge">
                            Filtered & Restored
                        </div>
                    </div>
                    <AudioPlayer
                        audioUrl={antiAliasedAudio.url}
                        title="Anti-Aliased Audio"
                        showWaveform={true}
                        onDownload={onDownload}
                        downloadFilename={`antialiased_${antiAliasedAudio.frequency}Hz.wav`}
                    />

                    {/* Gender Recognition Section - Same as Original */}
                    <div className="task2-recognition-container">
                        <button
                            onClick={onAntiAliasedGenderRecognition}
                            disabled={antiAliasedGenderLoading || antiAliasedGender !== null}
                            className="task2-recognition-btn"
                        >
                            {antiAliasedGenderLoading ? (
                                <>
                                    <span className="task2-spinner"></span>
                                    Analyzing Gender...
                                </>
                            ) : antiAliasedGender ? (
                                <>
                                    <span className="task2-check-icon">✓</span>
                                    Recognition Complete
                                </>
                            ) : (
                                <>
                                    <span className="task2-btn-icon">🔍</span>
                                    Recognize Gender
                                </>
                            )}
                        </button>
                    </div>

                    {/* Gender Result Display - Same as Original */}
                    {antiAliasedGender && (
                        <div className="task2-gender-result">
                            <div className="task2-result-header">
                                <h4 className="task2-result-title">
                                    <span className="task2-result-icon">✨</span>
                                    Recognition Results
                                </h4>
                            </div>
                            <div className="task2-result-content">
                                <div className="task2-result-card task2-primary-result">
                                    <div className="task2-result-label">Detected Gender</div>
                                    <div className={`task2-result-value task2-gender-${antiAliasedGender.gender || (antiAliasedGender.toLowerCase && antiAliasedGender.toLowerCase())}`}>
                                        {(antiAliasedGender.gender || antiAliasedGender) === 'male' ? '👨 Male' : '👩 Female'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="task2-success-box">
                        <div className="task2-success-icon">✅</div>
                        <div className="task2-success-content">
                            <strong>Anti-Aliasing Applied Successfully!</strong>
                            <p>
                                The audio has been processed through an anti-aliasing filter. 
                                Listen to the improved audio quality and compare it with the 
                                resampled version above. Notice how the filter reduces distortion 
                                and restores clarity to the audio signal.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
