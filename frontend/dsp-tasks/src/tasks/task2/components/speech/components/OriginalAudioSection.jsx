import React from 'react';
import AudioPlayer from './AudioPlayer';
import './OriginalAudioSection.css';

/**
 * OriginalAudioSection Component
 * Handles audio file upload and optional gender recognition
 */
export default function OriginalAudioSection({
    audioFile,
    audioUrl,
    genderResult,
    genderLoading,
    uploadStatus,
    onFileChange,
    onGenderRecognition,
    onDownload
}) {
    return (
        <div className="task2-original-audio-section">
            <div className="task2-section-header">
                <h3 className="task2-section-title">
                    <span className="task2-section-icon">📁</span>
                    Step 1: Upload Audio & Gender Recognition
                </h3>
                <p className="task2-section-description">
                    Upload an audio file (WAV, MP3, OGG, or WebM). Optionally analyze the speaker&apos;s gender.
                    Gender recognition is independent and not required for other operations.
                </p>
            </div>

            <div className="task2-upload-container">
                <label className="task2-upload-label" htmlFor="audio-upload">
                    <div className="task2-upload-content">
                        <span className="task2-upload-icon">🎵</span>
                        <span className="task2-upload-text">
                            {audioFile ? audioFile.name : 'Choose Audio File'}
                        </span>
                        <span className="task2-upload-hint">
                            Supported formats: WAV, MP3, OGG, WebM
                        </span>
                    </div>
                </label>
                <input
                    id="audio-upload"
                    type="file"
                    accept="audio/*"
                    onChange={onFileChange}
                    className="task2-upload-input"
                />
            </div>

            {uploadStatus === 'success' && audioUrl && (
                <>
                    {/* Audio Player */}
                    <div className="task2-audio-player-container">
                        <AudioPlayer
                            audioUrl={audioUrl}
                            title="Original Audio"
                            showWaveform={true}
                            onDownload={onDownload}
                            downloadFilename={audioFile?.name || 'original_audio.wav'}
                        />
                    </div>

                    {/* Gender Recognition Button */}
                    <div className="task2-recognition-container">
                        <button
                            onClick={onGenderRecognition}
                            disabled={genderLoading || genderResult !== null}
                            className="task2-recognition-btn"
                        >
                            {genderLoading ? (
                                <>
                                    <span className="task2-spinner"></span>
                                    Analyzing Gender...
                                </>
                            ) : genderResult ? (
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

                    {/* Gender Result Display */}
                    {genderResult && (
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
                                    <div className={`task2-result-value task2-gender-${genderResult.gender}`}>
                                        {genderResult.gender === 'male' ? '👨 Male' : '👩 Female'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
