import React, { useState } from 'react';
import AudioPlayer from './AudioPlayer';
import './ResampledAudioSection.css';

/**
 * ResampledAudioSection Component
 * Handles audio resampling with frequency control (independent operation)
 */
export default function ResampledAudioSection({
    resampledAudio,
    resamplingLoading,
    resamplingFreq,
    resampledGender,
    resampledGenderLoading,
    onResampling,
    onResampledGenderRecognition,
    onDownload
}) {
    const [localFreq, setLocalFreq] = useState(resamplingFreq);

    const handleFrequencyChange = (e) => {
        setLocalFreq(Number(e.target.value));
    };

    const handleResample = () => {
        onResampling(localFreq);
    };

    const frequencyPresets = [
        { value: 2000, label: '2 kHz' },
        { value: 4000, label: '4 kHz' },
        { value: 6000, label: '6 kHz' },
        { value: 8000, label: '8 kHz' },
        { value: 10000, label: '10 kHz' },
        { value: 12000, label: '12 kHz' },
        { value: 16000, label: '16 kHz' },
        { value: 22000, label: '22 kHz' },
    ];

    return (
        <div className="task2-resampled-audio-section">
            <div className="task2-section-header">
                <h3 className="task2-section-title">
                    <span className="task2-section-icon">🔄</span>
                    Step 2: Audio Resampling (Independent)
                </h3>
                <p className="task2-section-description">
                    Adjust the sampling frequency to observe aliasing effects on audio quality.
                    This operation is independent and can be performed without gender recognition.
                </p>
            </div>

            {/* Frequency Control */}
            <div className="task2-frequency-control">
                <div className="task2-frequency-header">
                    <label className="task2-frequency-label">
                        Sampling Frequency:
                    </label>
                    <span className="task2-frequency-value">{localFreq.toLocaleString()} Hz</span>
                </div>

                <div className="task2-frequency-slider-container">
                    <span className="task2-slider-limit">1 kHz</span>
                    <input
                        type="range"
                        min="1000"
                        max="22000"
                        step="1000"
                        value={localFreq}
                        onChange={handleFrequencyChange}
                        className="task2-frequency-slider"
                        disabled={resamplingLoading}
                    />
                    <span className="task2-slider-limit">22 kHz</span>
                </div>

                {/* Frequency Presets */}
                <div className="task2-frequency-presets">
                    {frequencyPresets.map((preset) => (
                        <button
                            key={preset.value}
                            onClick={() => setLocalFreq(preset.value)}
                            className={`task2-preset-btn ${localFreq === preset.value ? 'active' : ''}`}
                            disabled={resamplingLoading}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>

                {/* Resample Button */}
                <div className="task2-resample-btn-container">
                    <button
                        onClick={handleResample}
                        disabled={resamplingLoading}
                        className="task2-resample-btn"
                    >
                        {resamplingLoading ? (
                            <>
                                <span className="task2-spinner"></span>
                                Resampling Audio...
                            </>
                        ) : (
                            <>
                                <span className="task2-btn-icon">⚡</span>
                                Apply Resampling
                            </>
                        )}
                    </button>
                </div>

                {/* Info Box */}
                <div className="task2-info-box">
                    <div className="task2-info-icon">💡</div>
                    <div className="task2-info-content">
                        <strong>Nyquist Theorem:</strong> The sampling frequency must be at least twice 
                        the highest frequency component in the signal to avoid aliasing. Lower sampling 
                        rates may introduce distortion and loss of audio quality.
                    </div>
                </div>
            </div>

            {/* Resampled Audio Player */}
            {resampledAudio && (
                <div className="task2-resampled-result">
                    <div className="task2-result-header">
                        <h4 className="task2-result-title">
                            <span className="task2-result-icon">✅</span>
                            Resampled Audio
                        </h4>
                        <div className="task2-result-badge">
                            Sampled at {resampledAudio.frequency.toLocaleString()} Hz
                        </div>
                    </div>
                    <AudioPlayer
                        audioUrl={resampledAudio.url}
                        title="Resampled Audio"
                        showWaveform={true}
                        onDownload={onDownload}
                        downloadFilename={`resampled_${resampledAudio.frequency}Hz.wav`}
                    />

                    {/* Gender Recognition Section - Same as Original */}
                    <div className="task2-recognition-container">
                        <button
                            onClick={onResampledGenderRecognition}
                            disabled={resampledGenderLoading || resampledGender !== null}
                            className="task2-recognition-btn"
                        >
                            {resampledGenderLoading ? (
                                <>
                                    <span className="task2-spinner"></span>
                                    Analyzing Gender...
                                </>
                            ) : resampledGender ? (
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
                    {resampledGender && (
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
                                    <div className={`task2-result-value task2-gender-${resampledGender.gender || (resampledGender.toLowerCase && resampledGender.toLowerCase())}`}>
                                        {(resampledGender.gender || resampledGender) === 'male' ? '👨 Male' : '👩 Female'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {resampledAudio.frequency < 16000 && (
                        <div className="task2-warning-box">
                            <div className="task2-warning-icon">⚠️</div>
                            <div className="task2-warning-content">
                                <strong>Low Sampling Rate Detected:</strong> This sampling frequency 
                                is below the recommended rate for speech (16 kHz). You may notice 
                                aliasing artifacts and reduced audio quality. Consider applying 
                                anti-aliasing in the next step.
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
