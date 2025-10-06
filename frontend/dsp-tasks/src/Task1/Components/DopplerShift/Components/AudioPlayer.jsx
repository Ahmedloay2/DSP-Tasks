import React, { useState, useRef, useEffect } from 'react';
import './AudioPlayer.css';

const AudioPlayer = ({ audioUrl, metadata, onDownload, isGeneratedAudio = false }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const audioRef = useRef(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !audioUrl) return;

        // Reset states when audio changes
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);

        const handleLoadedMetadata = () => {
            setDuration(audio.duration || 0);
        };

        const handleTimeUpdate = () => {
            // Only update time if audio is actually playing and not paused
            if (!audio.paused && audio.currentTime !== undefined && !isNaN(audio.currentTime)) {
                setCurrentTime(audio.currentTime);
            }
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            audio.currentTime = 0;
        };

        const handleLoadStart = () => {
            setCurrentTime(0);
            setDuration(0);
        };

        const handleCanPlay = () => {
            if (audio.duration && !isNaN(audio.duration)) {
                setDuration(audio.duration);
            }
        };

        const handleError = (e) => {
            console.error('AudioPlayer: Audio error:', e);
        };

        // Add multiple event listeners for better compatibility
        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        // Set initial volume
        audio.volume = volume;

        // Force load the audio
        audio.load();

        return () => {
            audio.removeEventListener('loadstart', handleLoadStart);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
        };
    }, [audioUrl, volume]);

    const togglePlayPause = async () => {
        const audio = audioRef.current;
        if (!audio || !audioUrl) return;

        try {
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                // Ensure audio is ready to play
                if (audio.readyState >= 2) { // HAVE_CURRENT_DATA
                    await audio.play();
                    setIsPlaying(true);
                } else {
                    // Wait for audio to be ready
                    const handleCanPlay = () => {
                        audio.play().then(() => {
                            setIsPlaying(true);
                        }).catch(console.error);
                        audio.removeEventListener('canplay', handleCanPlay);
                    };
                    audio.addEventListener('canplay', handleCanPlay);
                }
            }
        } catch (error) {
            console.error('Error playing audio:', error);
            setIsPlaying(false);
        }
    };

    const handleSeek = (e) => {
        const audio = audioRef.current;
        if (!audio || !duration || isNaN(duration)) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const newTime = percentage * duration;
        
        // Ensure the new time is within valid bounds
        if (newTime >= 0 && newTime <= duration) {
            audio.currentTime = newTime;
            // Update state immediately for seek, then let timeupdate handle it during playback
            if (audio.paused) {
                setCurrentTime(newTime);
            }
        }
    }; 

    const handleVolumeChange = (e) => {
        const newVolume = Math.max(0, Math.min(1, parseFloat(e.target.value) || 0));
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    };

    const formatTime = (time) => {
        if (isNaN(time) || time < 0) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Improved progress calculation with safety checks
    const progressPercentage = (duration > 0 && currentTime >= 0 && !isNaN(currentTime) && !isNaN(duration)) 
        ? Math.max(0, Math.min(100, (currentTime / duration) * 100)) 
        : 0;

    return (
        <div className="audio-player">
            <audio 
                ref={audioRef} 
                src={audioUrl} 
                preload="metadata"
                controls={false}
                style={{ display: 'none' }}
            />
            
            <div className="player-header">
                <h4>🔊 Audio Player</h4>
                {isGeneratedAudio && (
                    <div className="audio-type-badge">Generated</div>
                )}
            </div>

            <div className="player-controls">
                {/* Top row: Play button and volume */}
                <div className="controls-top-row">
                    <button
                        className="play-pause-btn"
                        onClick={togglePlayPause}
                        disabled={!audioUrl}
                    >
                        {isPlaying ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14,19H18V5H14M6,19H10V5H6V19Z"/>
                            </svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
                            </svg>
                        )}
                    </button>

                    {/* Volume Control */}
                    <div className="volume-section">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3,9V15H7L12,20V4L7,9H3M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12Z"/>
                        </svg>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="volume-slider"
                        />
                    </div>
                </div>

                {/* Progress Bar - Full width */}
                <div className="progress-section">
                    <span className="time-display">{formatTime(currentTime)}</span>
                    <div className="progress-bar" onClick={handleSeek}>
                        <div 
                            className="progress-fill"
                            style={{ width: `${progressPercentage}%` }}
                        />
                        <div 
                            className="progress-handle"
                            style={{ left: `${progressPercentage}%` }}
                        />
                    </div>
                    <span className="time-display">{formatTime(duration)}</span>
                </div>

                {/* Download Button - Separate row */}
                {onDownload && (
                    <div className="download-section">
                        <button
                            className="download-btn"
                            onClick={onDownload}
                            title="Download Audio"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
                            </svg>
                            Download Audio
                        </button>
                    </div>
                )}
            </div>

            {/* Metadata Display */}
            {metadata && (
                <div className="audio-metadata">
                    <h5>📋 Audio Information</h5>
                    <div className="metadata-grid">
                        {isGeneratedAudio ? (
                            <>
                                <div className="metadata-item">
                                    <span className="metadata-label">Source Frequency:</span>
                                    <span className="metadata-value">{metadata.sourceFrequency} Hz</span>
                                </div>
                                <div className="metadata-item">
                                    <span className="metadata-label">Source Velocity:</span>
                                    <span className="metadata-value">{metadata.sourceVelocity} m/s</span>
                                </div>
                                <div className="metadata-item">
                                    <span className="metadata-label">Doppler Frequency:</span>
                                    <span className="metadata-value">{metadata.dopplerFrequency} Hz</span>
                                </div>
                                <div className="metadata-item">
                                    <span className="metadata-label">Duration:</span>
                                    <span className="metadata-value">{metadata.duration}s</span>
                                </div>
                            </>
                        ) : (
                            <div className="metadata-item">
                                <span className="metadata-label">Duration:</span>
                                <span className="metadata-value">{formatTime(duration)}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Physics Explanation */}
            {metadata && isGeneratedAudio && (
                <div className="physics-explanation">
                    <h5>🎓 Physics Explanation</h5>
                    <div className="explanation-content">
                        {metadata.sourceVelocity > 0 ? (
                            <div className="explanation approaching">
                                <div className="explanation-icon">➡️</div>
                                <p>
                                    <strong>Approaching Source:</strong> The source is moving towards the observer at {metadata.sourceVelocity} m/s, 
                                    compressing the sound waves and increasing the frequency from {metadata.sourceFrequency} Hz to {metadata.dopplerFrequency} Hz.
                                </p>
                            </div>
                        ) : metadata.sourceVelocity < 0 ? (
                            <div className="explanation receding">
                                <div className="explanation-icon">⬅️</div>
                                <p>
                                    <strong>Receding Source:</strong> The source is moving away from the observer at {Math.abs(metadata.sourceVelocity)} m/s, 
                                    stretching the sound waves and decreasing the frequency from {metadata.sourceFrequency} Hz to {metadata.dopplerFrequency} Hz.
                                </p>
                            </div>
                        ) : (
                            <div className="explanation stationary">
                                <div className="explanation-icon">⭕</div>
                                <p>
                                    <strong>Stationary Source:</strong> With zero velocity, there is no Doppler shift. 
                                    The observed frequency remains at {metadata.sourceFrequency} Hz.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AudioPlayer;