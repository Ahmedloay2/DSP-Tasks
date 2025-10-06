import React, { useState } from 'react';
import './DopplerGenerator.css';

const DopplerGenerator = ({ onAudioGenerated, isLoading, setIsLoading, setError }) => {
    const [parameters, setParameters] = useState({
        source_freq: 150,
        source_velocity: 50,
        normal_distance: 10,
        half_simulation_duration: 3
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
            const { DopplerApiService } = await import('../services/DopplerApiService');
            const result = await DopplerApiService.generateDopplerSound(parameters);
            onAudioGenerated(result);
        } catch (err) {
            setError(`Generation failed: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="doppler-generator">
            <div className="generator-header">
                <h3>🎵 Generate Doppler Shifted Sound</h3>
                <p>Create audio demonstrating the Doppler effect with custom parameters</p>
            </div>

            <div className="generator-content">
            

                {/* Parameters Section */}
                <div className="parameters-section">
                    <h4>Audio Parameters</h4>
                    <div className="parameters-grid">
                        {/* Source Frequency */}
                        <div className="parameter-group">
                            <label htmlFor="sourceFreq">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3,9V15H7L12,20V4L7,9H3M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12Z"/>
                                </svg>
                                Source Frequency (f): <span className="param-value">{parameters.source_freq} Hz</span>
                            </label>
                            <input
                                id="sourceFreq"
                                type="range"
                                min="100"
                                max="2000"
                                step="10"
                                value={parameters.source_freq}
                                onChange={(e) => handleParameterChange('source_freq', e.target.value)}
                                disabled={isLoading}
                                className="slider-input"
                            />
                            <input
                                type="number"
                                min="100"
                                max="2000"
                                step="10"
                                value={parameters.source_freq}
                                onChange={(e) => handleParameterChange('source_freq', e.target.value)}
                                disabled={isLoading}
                                className="numeric-input"
                            />
                            <span className="parameter-hint">Range: 100-2000 Hz (musical notes to sirens)</span>
                        </div>

                        {/* Source Velocity */}
                        <div className="parameter-group">
                            <label htmlFor="sourceVel">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M13,9V3.5L22.5,12L13,20.5V15H11L9,13H2V11H9L11,9H13M13,11V13H11V11H13Z"/>
                                </svg>
                                Source Velocity (v): <span className="param-value">{parameters.source_velocity} m/s</span>
                            </label>
                            <input
                                id="sourceVel"
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={parameters.source_velocity}
                                onChange={(e) => handleParameterChange('source_velocity', e.target.value)}
                                disabled={isLoading}
                                className="slider-input"
                            />
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                value={parameters.source_velocity}
                                onChange={(e) => handleParameterChange('source_velocity', e.target.value)}
                                disabled={isLoading}
                                className="numeric-input"
                            />
                            <span className="parameter-hint">Speed of sound source (0-100 m/s)</span>
                        </div>

                        {/* Normal Distance */}
                        <div className="parameter-group">
                            <label htmlFor="normalDist">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z"/>
                                </svg>
                                Normal Distance: <span className="param-value">{parameters.normal_distance} m</span>
                            </label>
                            <input
                                id="normalDist"
                                type="number"
                                min="0.1"
                                max="10"
                                step="0.1"
                                value={parameters.normal_distance}
                                onChange={(e) => handleParameterChange('normal_distance', e.target.value)}
                                disabled={isLoading}
                                className="numeric-input"
                            />
                            <span className="parameter-hint">Closest distance to observer (default: 10 meter)</span>
                        </div>

                        {/* Simulation Duration */}
                        <div className="parameter-group">
                            <label htmlFor="duration">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/>
                                </svg>
                                Simulation Duration: <span className="param-value">{parameters.half_simulation_duration} s</span>
                            </label>
                            <input
                                id="duration"
                                type="number"
                                min="0.5"
                                max="10"
                                step="0.5"
                                value={parameters.half_simulation_duration}
                                onChange={(e) => handleParameterChange('half_simulation_duration', e.target.value)}
                                disabled={isLoading}
                                className="numeric-input"
                            />
                            <span className="parameter-hint">Half duration (total = 2× this value, default: 3 seconds)</span>
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
                                        Generate Doppler Sound
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Physics Info */}
                <div className="physics-info">
                    <h4>📚 Doppler Effect Principle</h4>
                    <div className="formula-section">
                        <div className="formula">
                            f' = f × (c) / (c ± v)
                        </div>
                        <div className="formula-legend">
                            <div><strong>f'</strong> = Observed frequency</div>
                            <div><strong>f</strong> = Source frequency</div>
                            <div><strong>c</strong> = Speed of sound (343 m/s)</div>
                            <div><strong>v</strong> = Source velocity (+ approaching, - receding)</div>
                        </div>
                        <p className="physics-desc">
                            As the sound source approaches, waves are compressed (higher frequency). 
                            As it recedes, waves are stretched (lower frequency).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DopplerGenerator;