import React, { useState } from 'react';
import './DopplerGenerator.css';

const DopplerGenerator = ({ onAudioGenerated, isLoading, setIsLoading, setError }) => {
    const [parameters, setParameters] = useState({
        sourceFrequency: 440,
        sourceVelocity: 0,
        duration: 3
    });

    const handleParameterChange = (key, value) => {
        setParameters(prev => ({
            ...prev,
            [key]: parseFloat(value) || 0
        }));
    };

    const handleGenerate = async () => {
        setError(null);
        setIsLoading(true);

        try {
            const { MockDopplerApiService } = await import('../services/MockDopplerApiService');
            const result = await MockDopplerApiService.generateDopplerAudio(parameters);
            onAudioGenerated(result);
        } catch (err) {
            setError(`Generation failed: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const presets = [
        { name: 'Ambulance Approaching', freq: 800, velocity: 30, duration: 4 },
        { name: 'Car Horn Passing', freq: 440, velocity: 20, duration: 5 },
        { name: 'Train Whistle', freq: 660, velocity: 50, duration: 6 },
        { name: 'Police Siren', freq: 1000, velocity: 25, duration: 3 },
        { name: 'Motorcycle Racing', freq: 500, velocity: 40, duration: 3 },
        { name: 'Fire Truck', freq: 900, velocity: 35, duration: 5 }
    ];

    const applyPreset = (preset) => {
        setParameters({
            sourceFrequency: preset.freq,
            sourceVelocity: preset.velocity,
            duration: preset.duration
        });
    };

    return (
        <div className="doppler-generator">
            <div className="generator-header">
                <h3>🎵 Generate Doppler Shifted Sound</h3>
                <p>Create audio demonstrating the Doppler effect with custom parameters</p>
            </div>

            <div className="generator-content">
                {/* Presets Section */}
                <div className="presets-section">
                    <h4>Quick Presets</h4>
                    <div className="presets-grid">
                        {presets.map((preset, index) => (
                            <button
                                key={index}
                                className="preset-btn"
                                onClick={() => applyPreset(preset)}
                                disabled={isLoading}
                            >
                                <div className="preset-name">{preset.name}</div>
                                <div className="preset-details">
                                    {preset.freq}Hz • {preset.velocity}m/s • {preset.duration}s
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Parameters Section */}
                <div className="parameters-section">
                    <h4>Audio Parameters</h4>
                    <div className="parameters-grid">
                        <div className="parameter-group">
                            <label htmlFor="sourceFreq">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3,9V15H7L12,20V4L7,9H3M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12Z"/>
                                </svg>
                                Source Frequency (Hz)
                            </label>
                            <input
                                id="sourceFreq"
                                type="number"
                                min="100"
                                max="2000"
                                step="10"
                                value={parameters.sourceFrequency}
                                onChange={(e) => handleParameterChange('sourceFrequency', e.target.value)}
                                disabled={isLoading}
                            />
                            <span className="parameter-hint">Range: 100-2000 Hz (musical notes to sirens)</span>
                        </div>

                        <div className="parameter-group">
                            <label htmlFor="sourceVel">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M13,9V3.5L22.5,12L13,20.5V15H11L9,13H2V11H9L11,9H13M13,11V13H11V11H13Z"/>
                                </svg>
                                Source Velocity (m/s)
                            </label>
                            <input
                                id="sourceVel"
                                type="number"
                                min="-60"
                                max="60"
                                step="1"
                                value={parameters.sourceVelocity}
                                onChange={(e) => handleParameterChange('sourceVelocity', e.target.value)}
                                disabled={isLoading}
                            />
                            <span className="parameter-hint">Positive: approaching, Negative: receding</span>
                        </div>

                        <div className="parameter-group">
                            <label htmlFor="duration">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/>
                                </svg>
                                Duration (seconds)
                            </label>
                            <input
                                id="duration"
                                type="number"
                                min="1"
                                max="10"
                                step="0.5"
                                value={parameters.duration}
                                onChange={(e) => handleParameterChange('duration', e.target.value)}
                                disabled={isLoading}
                            />
                            <span className="parameter-hint">Recording length: 1-10 seconds</span>
                        </div>

                        <div className="parameter-group generate-section">
                            <button
                                className="generate-btn"
                                onClick={handleGenerate}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="loading-spinner"></div>
                                        Generating Audio...
                                    </>
                                ) : (
                                    <>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
                                        </svg>
                                        Generate Doppler Audio
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Physics Info */}
                <div className="physics-info">
                    <h4>📚 Doppler Effect Formula</h4>
                    <div className="formula-section">
                        <div className="formula">
                            f' = f × (v) / (v + vₛ)
                        </div>
                        <div className="formula-legend">
                            <div><strong>f'</strong> = Observed frequency</div>
                            <div><strong>f</strong> = Source frequency</div>
                            <div><strong>v</strong> = Speed of sound (343 m/s)</div>
                            <div><strong>vₛ</strong> = Source velocity</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DopplerGenerator;