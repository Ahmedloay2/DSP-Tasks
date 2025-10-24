import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Header from './components/SpeechHeader';
import OriginalAudioSection from './components/OriginalAudioSection';
import ResampledAudioSection from './components/ResampledAudioSection';
import AntiAliasedAudioSection from './components/AntiAliasedAudioSection';
import getSpeechService from './services';
import './Task2Speech.css';

/**
 * Task2Speech Component
 * Entry point for Speech task with audio upload and analysis
 * Flow: Upload Audio → (Optional) Gender Recognition → Resampling → (Optional) Anti-Aliasing
 * Each step is independent and can be performed separately
 * Supports Real API and Mock API modes for testing
 */
export default function Task2Speech() {
    // API Mode: 'real' or 'mock'
    const [apiMode, setApiMode] = useState('real');

    // File upload state
    const [audioFile, setAudioFile] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);

    // Gender recognition state (independent, optional)
    const [genderResult, setGenderResult] = useState(null);
    const [genderLoading, setGenderLoading] = useState(false);

    // Resampling state (independent from gender recognition)
    const [resamplingFreq, setResamplingFreq] = useState(8000);
    const [resampledAudio, setResampledAudio] = useState(null);
    const [resamplingLoading, setResamplingLoading] = useState(false);
    const [resampledGender, setResampledGender] = useState(null);
    const [resampledGenderLoading, setResampledGenderLoading] = useState(false);

    // Anti-aliasing state (independent from other operations)
    const [antiAliasedAudio, setAntiAliasedAudio] = useState(null);
    const [antiAliasingLoading, setAntiAliasingLoading] = useState(false);
    const [antiAliasedGender, setAntiAliasedGender] = useState(null);
    const [antiAliasedGenderLoading, setAntiAliasedGenderLoading] = useState(false);

    // UI state
    const [ui, setUI] = useState({
        error: null,
        uploadStatus: 'idle' // 'idle', 'success'
    });

    // File upload handler
    const handleFileChange = useCallback((event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate audio file
        const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/webm'];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(wav|mp3|ogg|webm)$/i)) {
            setUI(prev => ({
                ...prev,
                error: 'Invalid file type. Please upload an audio file (WAV, MP3, OGG, or WebM).'
            }));
            // Reset file input
            event.target.value = '';
            return;
        }

        // Revoke previous URL if exists to prevent memory leak
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }

        // Create URL for audio playback
        const url = URL.createObjectURL(file);

        setAudioFile(file);
        setAudioUrl(url);
        setUI({
            error: null,
            uploadStatus: 'success'
        });

        // Reset downstream states
        setGenderResult(null);
        setResampledAudio(null);
        setResampledGender(null);
        setAntiAliasedAudio(null);
        setAntiAliasedGender(null);
    }, [audioUrl]);

    // Gender recognition handler (independent operation)
    const handleGenderRecognition = useCallback(async () => {
        if (!audioFile) return;

        setGenderLoading(true);
        setUI(prev => ({ ...prev, error: null }));

        try {
            const service = getSpeechService(apiMode);
            const result = await service.recognizeGender(audioFile);
            setGenderResult(result);
        } catch (err) {
            setUI(prev => ({
                ...prev,
                error: `Gender recognition failed: ${err.message}`
            }));
        } finally {
            setGenderLoading(false);
        }
    }, [audioFile, apiMode]);

    // Resampling handler (independent operation, doesn't require gender recognition)
    const handleResampling = useCallback(async (frequency) => {
        if (!audioFile) return;

        setResamplingLoading(true);
        setUI(prev => ({ ...prev, error: null }));
        setResamplingFreq(frequency);

        try {
            const service = getSpeechService(apiMode);
            const result = await service.resampleAudio(audioFile, frequency);
            setResampledAudio(result);
            
            // Reset downstream states when resampling changes
            setAntiAliasedAudio(null);
            setResampledGender(null);
        } catch (err) {
            setUI(prev => ({
                ...prev,
                error: `Resampling failed: ${err.message}`
            }));
        } finally {
            setResamplingLoading(false);
        }
    }, [audioFile, apiMode]);

    // Gender recognition for resampled audio
    const handleResampledGenderRecognition = useCallback(async () => {
        if (!resampledAudio?.url) return;

        setResampledGenderLoading(true);
        setUI(prev => ({ ...prev, error: null }));

        try {
            const service = getSpeechService(apiMode);
            // Convert blob URL back to file for API
            const response = await fetch(resampledAudio.url);
            const blob = await response.blob();
            const file = new File([blob], `resampled_${resamplingFreq}Hz.wav`, { type: 'audio/wav' });
            
            const result = await service.recognizeGender(file);
            setResampledGender(result);
        } catch (err) {
            setUI(prev => ({
                ...prev,
                error: `Gender recognition (resampled) failed: ${err.message}`
            }));
        } finally {
            setResampledGenderLoading(false);
        }
    }, [resampledAudio, resamplingFreq, apiMode]);

    // Anti-aliasing handler (works on resampled audio if available, otherwise original audio)
    const handleAntiAliasing = useCallback(async () => {
        setAntiAliasingLoading(true);
        setUI(prev => ({ ...prev, error: null }));

        try {
            const service = getSpeechService(apiMode);
            let fileToProcess = audioFile;
            let frequencyToUse = resamplingFreq;

            // If resampled audio exists, use it
            if (resampledAudio?.url) {
                const response = await fetch(resampledAudio.url);
                const blob = await response.blob();
                fileToProcess = new File([blob], `resampled_${resamplingFreq}Hz.wav`, { type: 'audio/wav' });
                frequencyToUse = resampledAudio.frequency || resamplingFreq;
            }

            const result = await service.applyAntiAliasing(fileToProcess, frequencyToUse);
            setAntiAliasedAudio(result);
            
            // Reset anti-aliased gender when filter changes
            setAntiAliasedGender(null);
        } catch (err) {
            setUI(prev => ({
                ...prev,
                error: `Anti-aliasing failed: ${err.message}`
            }));
        } finally {
            setAntiAliasingLoading(false);
        }
    }, [resampledAudio, audioFile, resamplingFreq, apiMode]);

    // Gender recognition for anti-aliased audio
    const handleAntiAliasedGenderRecognition = useCallback(async () => {
        if (!antiAliasedAudio?.url) return;

        setAntiAliasedGenderLoading(true);
        setUI(prev => ({ ...prev, error: null }));

        try {
            const service = getSpeechService(apiMode);
            // Convert blob URL back to file for API
            const response = await fetch(antiAliasedAudio.url);
            const blob = await response.blob();
            const file = new File([blob], `antialiased_${resamplingFreq}Hz.wav`, { type: 'audio/wav' });
            
            const result = await service.recognizeGender(file);
            setAntiAliasedGender(result);
        } catch (err) {
            setUI(prev => ({
                ...prev,
                error: `Gender recognition failed: ${err.message}`
            }));
        } finally {
            setAntiAliasedGenderLoading(false);
        }
    }, [antiAliasedAudio, resamplingFreq, apiMode]);

    // Download handler for audio files
    const handleDownload = useCallback((audioData, filename) => {
        if (!audioData?.url) return;

        const a = document.createElement('a');
        a.href = audioData.url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }, []);

    // Reset handler
    const handleReset = useCallback(() => {
        // Revoke object URLs to prevent memory leaks
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        if (resampledAudio?.url && !resampledAudio.isMock) URL.revokeObjectURL(resampledAudio.url);
        if (antiAliasedAudio?.url && !antiAliasedAudio.isMock) URL.revokeObjectURL(antiAliasedAudio.url);

        // Reset all state
        setAudioFile(null);
        setAudioUrl(null);
        setGenderResult(null);
        setGenderLoading(false);
        setResampledAudio(null);
        setResamplingLoading(false);
        setResampledGender(null);
        setResampledGenderLoading(false);
        setAntiAliasedAudio(null);
        setAntiAliasingLoading(false);
        setAntiAliasedGender(null);
        setAntiAliasedGenderLoading(false);
        setUI({
            error: null,
            uploadStatus: 'idle'
        });

        // Reset file input element
        const fileInput = document.getElementById('audio-upload');
        if (fileInput) {
            fileInput.value = '';
        }
    }, [audioUrl, resampledAudio, antiAliasedAudio]);

    // Toggle API mode
    const toggleApiMode = useCallback(() => {
        setApiMode(prev => prev === 'real' ? 'mock' : 'real');
    }, []);

    return (
        <div className="task2-speech-container">
            <Link to="/task2" className="task2-back-link">
                ← Back to Task 2 Home
            </Link>

            <Header />

            {/* API Mode Toggle */}
            <div className="task2-api-mode-toggle-container">
                <div className="task2-api-mode-info">
                    <span className="task2-api-mode-label">API Mode:</span>
                    <span className={`task2-api-mode-badge ${apiMode}`}>
                        {apiMode === 'real' ? '🌐 Real API' : '🔧 Mock API'}
                    </span>
                    <p className="task2-api-mode-description">
                        {apiMode === 'real'
                            ? 'Using real backend API endpoints for processing'
                            : 'Using simulated data for testing and demonstration'}
                    </p>
                </div>
                <button onClick={toggleApiMode} className="task2-api-toggle-btn">
                    Switch to {apiMode === 'real' ? 'Mock' : 'Real'} API
                </button>
            </div>

            {/* Error Display */}
            {ui.error && (
                <div className="task2-error-message">
                    <span className="task2-error-icon">⚠️</span>
                    {ui.error}
                </div>
            )}

            {/* Original Audio Section */}
            <OriginalAudioSection
                audioFile={audioFile}
                audioUrl={audioUrl}
                genderResult={genderResult}
                genderLoading={genderLoading}
                uploadStatus={ui.uploadStatus}
                onFileChange={handleFileChange}
                onGenderRecognition={handleGenderRecognition}
                onDownload={() => handleDownload({ url: audioUrl }, audioFile?.name || 'original_audio.wav')}
            />

            {/* Resampled Audio Section - Independent from gender recognition */}
            {audioFile && (
                <ResampledAudioSection
                    resampledAudio={resampledAudio}
                    resamplingLoading={resamplingLoading}
                    resamplingFreq={resamplingFreq}
                    resampledGender={resampledGender}
                    resampledGenderLoading={resampledGenderLoading}
                    onResampling={handleResampling}
                    onResampledGenderRecognition={handleResampledGenderRecognition}
                    onDownload={() => handleDownload(resampledAudio, `resampled_${resamplingFreq}Hz.wav`)}
                />
            )}

            {/* Anti-Aliased Audio Section - Can work on resampled or original audio */}
            {(resampledAudio || audioFile) && (
                <AntiAliasedAudioSection
                    antiAliasedAudio={antiAliasedAudio}
                    antiAliasingLoading={antiAliasingLoading}
                    antiAliasedGender={antiAliasedGender}
                    antiAliasedGenderLoading={antiAliasedGenderLoading}
                    onAntiAliasing={handleAntiAliasing}
                    onAntiAliasedGenderRecognition={handleAntiAliasedGenderRecognition}
                    onDownload={() => handleDownload(antiAliasedAudio, `antialiased_${resamplingFreq}Hz.wav`)}
                />
            )}

            {/* Reset Button */}
            {audioFile && (
                <div className="task2-reset-container">
                    <button onClick={handleReset} className="task2-reset-btn">
                        🔄 Reset All
                    </button>
                </div>
            )}
        </div>
    );
}
