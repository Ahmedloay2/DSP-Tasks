import React, { useState, useRef, useEffect } from 'react';
import './AudioPlayer.css';

/**
 * AudioPlayer Component
 * Handles audio playback with controls, waveform visualization, and download
 */
export default function AudioPlayer({ 
    audioUrl, 
    title, 
    showWaveform = false, 
    onDownload = null,
    downloadFilename = 'audio.wav'
}) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const audioRef = useRef(null);
    const canvasRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationRef = useRef(null);

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
            if (!audio.paused && audio.currentTime !== undefined && !isNaN(audio.currentTime)) {
                setCurrentTime(audio.currentTime);
            }
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            audio.currentTime = 0;
        };

        const handleCanPlay = () => {
            if (audio.duration && !isNaN(audio.duration)) {
                setDuration(audio.duration);
            }
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);

        audio.volume = volume;
        audio.load();

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [audioUrl, volume]);

    // Initialize audio context for waveform
    useEffect(() => {
        if (!showWaveform || !audioRef.current) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext();
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 2048;

                const source = audioContextRef.current.createMediaElementSource(audioRef.current);
                source.connect(analyserRef.current);
                analyserRef.current.connect(audioContextRef.current.destination);
            }
        } catch (error) {
            console.error('Error initializing audio context:', error);
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [showWaveform]);

    // Draw waveform
    useEffect(() => {
        if (!showWaveform || !isPlaying || !canvasRef.current || !analyserRef.current) {
            return;
        }

        const canvas = canvasRef.current;
        const canvasContext = canvas.getContext('2d');
        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);

            analyser.getByteTimeDomainData(dataArray);

            canvasContext.fillStyle = 'rgb(240, 249, 255)';
            canvasContext.fillRect(0, 0, canvas.width, canvas.height);

            canvasContext.lineWidth = 2;
            canvasContext.strokeStyle = 'rgb(59, 130, 246)';
            canvasContext.beginPath();

            const sliceWidth = canvas.width / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = (v * canvas.height) / 2;

                if (i === 0) {
                    canvasContext.moveTo(x, y);
                } else {
                    canvasContext.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasContext.lineTo(canvas.width, canvas.height / 2);
            canvasContext.stroke();
        };

        draw();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isPlaying, showWaveform]);

    const togglePlayPause = async () => {
        const audio = audioRef.current;
        if (!audio || !audioUrl) return;

        try {
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                // Resume audio context if suspended (required by some browsers)
                if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                    await audioContextRef.current.resume();
                }
                await audio.play();
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = e.target.value / 100;
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    };

    const formatTime = (time) => {
        if (!time || isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    const handleDownloadClick = () => {
        if (onDownload) {
            onDownload();
        } else if (audioUrl) {
            // Fallback download method
            const a = document.createElement('a');
            a.href = audioUrl;
            a.download = downloadFilename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    const getVolumeIcon = () => {
        if (volume === 0) return '🔇';
        if (volume < 0.3) return '🔈';
        if (volume < 0.7) return '🔉';
        return '🔊';
    };

    return (
        <div className="task2-speech-audio-player">
            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            {showWaveform && (
                <div className="task2-waveform-container">
                    <canvas
                        ref={canvasRef}
                        width="800"
                        height="120"
                        className="task2-waveform-canvas"
                    />
                </div>
            )}

            <div className="task2-player-main">
                <div className="task2-player-header">
                    <div className="task2-player-info">
                        <span className="task2-player-icon">🎵</span>
                        <h4 className="task2-player-title">{title}</h4>
                    </div>
                    <button
                        onClick={handleDownloadClick}
                        className="task2-download-btn"
                        disabled={!audioUrl}
                        title="Download audio"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                        </svg>
                        <span>Download</span>
                    </button>
                </div>

                <div className="task2-player-controls">
                    <button
                        onClick={togglePlayPause}
                        className="task2-play-pause-btn"
                        disabled={!audioUrl}
                        title={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                            </svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        )}
                    </button>

                    <div className="task2-time-display">{formatTime(currentTime)}</div>

                    <div className="task2-progress-container">
                        <input
                            type="range"
                            min="0"
                            max={duration || 100}
                            value={currentTime}
                            onChange={(e) => {
                                const seekTime = parseFloat(e.target.value);
                                if (audioRef.current && !isNaN(seekTime)) {
                                    audioRef.current.currentTime = seekTime;
                                    setCurrentTime(seekTime);
                                }
                            }}
                            className="task2-progress-slider"
                            disabled={!audioUrl || !duration}
                            style={{
                                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%)`
                            }}
                        />
                    </div>

                    <div className="task2-time-display">{formatTime(duration)}</div>

                    <div className="task2-volume-control">
                        <button 
                            className="task2-volume-btn"
                            onClick={() => setShowVolumeSlider(prev => !prev)}
                            title={`Volume: ${Math.round(volume * 100)}%`}
                        >
                            {getVolumeIcon()}
                        </button>
                        <div className={`task2-volume-slider-container ${showVolumeSlider ? 'show' : ''}`}>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={volume * 100}
                                onChange={handleVolumeChange}
                                className="task2-volume-slider"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}