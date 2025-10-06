import React, { useRef, useEffect, useState, useCallback } from 'react';
import './DopplerSignalViewer.css';

const DopplerSignalViewer = ({ 
    audioUrl, 
    metadata, 
    onDownload, 
    isGeneratedAudio = false,
    signalData = null,
    showPlaybackControls = true
}) => {
    const canvasRef = useRef(null);
    const audioRef = useRef(null);
    const audioContextRef = useRef(null);
    const animationFrameRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [signalScale, setSignalScale] = useState({ min: -1, max: 1, range: 2, center: 0, median: 0 });
    const [audioData, setAudioData] = useState(null);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);

    // Extract audio data using Web Audio API
    const extractAudioData = useCallback(async (url) => {
        if (!url) return null;
        
        try {
            setIsLoadingAudio(true);
            
            // Create audio context
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = audioContext;
            
            // Fetch and decode audio
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            // Extract channel data (use first channel)
            const channelData = audioBuffer.getChannelData(0);
            
            // Downsample to 250Hz for ECG-like display
            const originalSampleRate = audioBuffer.sampleRate;
            const targetSampleRate = 250;
            const decimationFactor = Math.floor(originalSampleRate / targetSampleRate);
            
            const decimatedLength = Math.floor(channelData.length / decimationFactor);
            const decimatedData = new Float32Array(decimatedLength);
            
            for (let i = 0; i < decimatedLength; i++) {
                decimatedData[i] = channelData[i * decimationFactor];
            }
            
            setAudioData(decimatedData);
            return decimatedData;
        } catch (error) {
            console.error('Error extracting audio data:', error);
            return null;
        } finally {
            setIsLoadingAudio(false);
        }
    }, []);

    // Audio setup and event handlers
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !audioUrl) return;

        // Reset states when audio changes
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        
        // Extract audio data for visualization
        extractAudioData(audioUrl);

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
            console.error('DopplerSignalViewer: Audio error:', e);
        };

        // Add event listeners
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', handleError);

        // Set volume
        audio.volume = volume;
        audio.preload = 'metadata';

        // Cleanup
        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('loadstart', handleLoadStart);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('error', handleError);
        };
    }, [audioUrl, volume, extractAudioData]);

    // Get signal data (from extracted audio, provided signal data, or generated)
    const getSignalData = useCallback(() => {
        // Priority: extracted audio data > provided signal data > generated data
        if (audioData && audioData.length > 0) {
            return audioData;
        }
        
        if (signalData) {
            return signalData;
        }
        
        // Fallback: generate synthetic signal from metadata
        if (!metadata) return null;

        const {
            sourceFrequency = 440,
            sourceVelocity = 0,
            duration = 3
        } = metadata;

        const sampleRate = 250; // Match ECG sample rate for consistency
        const samples = Math.floor(sampleRate * duration);
        const data = new Float32Array(samples);

        // Calculate Doppler frequency
        const soundSpeed = 343;
        const dopplerFrequency = sourceFrequency * soundSpeed / (soundSpeed + sourceVelocity);

        // Generate sine wave with Doppler effect
        for (let i = 0; i < samples; i++) {
            const time = i / sampleRate;
            // Apply gradual frequency change to simulate moving source
            const currentFreq = sourceFrequency + 
                (dopplerFrequency - sourceFrequency) * (time / duration);
            
            // Add envelope and normalize amplitude similar to ECG
            const envelope = Math.exp(-time * 0.3);
            data[i] = Math.sin(2 * Math.PI * currentFreq * time) * envelope * 0.8;
        }

        return data;
    }, [audioData, signalData, metadata]);

    // Calculate auto-scaling like ECG
    const calculateScale = useCallback((data) => {
        if (!data || data.length === 0) return { min: -1.5, max: 1.5, range: 3, center: 0 };
        
        // Use percentile-based scaling like ECG
        const sortedData = new Float32Array(data).sort();
        const len = sortedData.length;
        const p5 = sortedData[Math.floor(len * 0.05)] || 0;
        const p95 = sortedData[Math.floor(len * 0.95)] || 0;
        const median = sortedData[Math.floor(len * 0.5)] || 0;
        
        const dataMin = p5;
        const dataMax = p95;
        const actualRange = dataMax - dataMin;
        
        // Add padding for better visualization
        const minRange = 0.8;
        const effectiveRange = Math.max(actualRange, minRange);
        const topPadding = effectiveRange * 0.15;
        const bottomPadding = effectiveRange * 0.05;
        
        const scaledMin = dataMin - bottomPadding;
        const scaledMax = dataMax + topPadding;
        const scaledRange = scaledMax - scaledMin;
        
        return {
            min: scaledMin,
            max: scaledMax,
            range: scaledRange,
            center: (scaledMin + scaledMax) / 2,
            median: median
        };
    }, []);

    // Update scaling when data changes
    useEffect(() => {
        const data = getSignalData();
        if (data && data.length > 0) {
            const newScale = calculateScale(data);
            setSignalScale(newScale);
        }
    }, [getSignalData, calculateScale]);

    // Draw grid like ECG with theme colors
    const drawGrid = useCallback((ctx, width, height) => {
        // Get theme from document
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        // Minor grid (1mm equivalent) - theme-aware colors
        ctx.strokeStyle = isDark ? '#334155' : '#F0F0F0';
        ctx.lineWidth = 0.5;
        
        for (let x = 0; x <= width; x += 5) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        for (let y = 0; y <= height; y += 5) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Major grid (5mm equivalent) - theme-aware colors
        ctx.strokeStyle = isDark ? '#475569' : '#E0E0E0';
        ctx.lineWidth = 1;
        
        for (let x = 0; x <= width; x += 25) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        for (let y = 0; y <= height; y += 25) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }, []);

    // Draw axes like ECG with theme colors
    const drawAxes = useCallback((ctx, width, height) => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        ctx.strokeStyle = isDark ? '#e2e8f0' : '#333333';
        ctx.lineWidth = 2;
        
        // Y-axis (left side at x=40 to leave space for labels)
        const yAxisX = 40;
        ctx.beginPath();
        ctx.moveTo(yAxisX, 0);
        ctx.lineTo(yAxisX, height - 30);
        ctx.stroke();
        
        // X-axis (bottom)
        ctx.beginPath();
        ctx.moveTo(yAxisX, height - 30);
        ctx.lineTo(width, height - 30);
        ctx.stroke();
        
        // Y-axis labels with adaptive precision and theme colors
        ctx.fillStyle = isDark ? '#d1d5db' : '#555555';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        
        const ySteps = Math.min(8, Math.max(4, Math.floor((height - 30) / 25)));
        const precision = signalScale.range > 5 ? 1 : signalScale.range > 1 ? 2 : 3;
        
        for (let i = 0; i <= ySteps; i++) {
            const y = (height - 30) * (1 - i / ySteps);
            const voltage = signalScale.min + (signalScale.range * i / ySteps);
            
            if (y > 15 && y < height - 45) {
                ctx.fillText(voltage.toFixed(precision), yAxisX - 6, y + 3);
            }
        }
        
        // X-axis labels (time) - dynamic based on current second
        ctx.textAlign = 'center';
        const currentSecond = Math.floor(currentTime);
        const xSteps = 10; // 0.1-second intervals for 1-second window
        
        for (let i = 0; i <= xSteps; i++) {
            const x = yAxisX + ((width - yAxisX) * i / xSteps);
            const timeInSecond = currentSecond + (i * 0.1);
            ctx.fillText(`${timeInSecond.toFixed(1)}s`, x, height - 10);
        }
    }, [signalScale, currentTime]);

    // Draw signal with 1-second moving window (slower movement)
    const drawSignal = useCallback((ctx, width, height) => {
        const data = getSignalData();
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        if (!data || data.length === 0) {
            // Draw empty state with theme colors
            const yAxisX = 40;
            const plotWidth = width - yAxisX;
            const plotHeight = height - 30;
            
            ctx.strokeStyle = isDark ? '#475569' : '#E0E0E0';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(yAxisX, plotHeight / 2);
            ctx.lineTo(yAxisX + plotWidth, plotHeight / 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Add loading or ready text with theme colors
            ctx.fillStyle = isDark ? '#94a3b8' : '#999999';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            const message = isLoadingAudio ? 'Loading audio data...' : 'Ready - Press Play';
            ctx.fillText(message, yAxisX + plotWidth / 2, plotHeight / 2 - 10);
            return;
        }

        const sampleRate = 250; // samples per second
        const timeWindow = 1; // 1 second visible window
        const samplesPerWindow = sampleRate * timeWindow;
        
        const yAxisX = 40; // Match Y-axis position
        const plotWidth = width - yAxisX;
        const plotHeight = height - 30;
        
        // Slower 1-second moving window: use fractional seconds for smoother movement
        // Calculate which 1-second window to show (based on integer seconds)
        const currentSecond = Math.floor(currentTime);
        const windowStartSecond = currentSecond;
        const windowStartSample = windowStartSecond * sampleRate;
        
        // How much of the current 1-second window has been "recorded" (use fractional time)
        const fractionIntoSecond = currentTime - currentSecond; // 0.0 to 0.99...
        const recordedSamples = Math.max(0, fractionIntoSecond * sampleRate);
        const recordedPixels = (recordedSamples / samplesPerWindow) * plotWidth;
        
        // ECG-style signal rendering with theme colors
        ctx.strokeStyle = isDark ? '#60a5fa' : '#3B82F6'; // Lighter blue for dark mode
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Use path2D for better performance
        const signalPath = new Path2D();
        let hasData = false;
        let prevY = null;
        
        // Only draw the portion that has been "recorded"
        const pixelsPerSample = plotWidth / samplesPerWindow;
        const drawStep = Math.max(1, Math.floor(samplesPerWindow / (plotWidth * 2)));
        
        // Draw only up to the current playback position within the 1-second window
        const samplesToShow = Math.min(recordedSamples, samplesPerWindow);
        
        for (let i = 0; i < samplesToShow; i += drawStep) {
            const dataIndex = windowStartSample + i;
            
            if (dataIndex >= 0 && dataIndex < data.length) {
                const x = yAxisX + (i * pixelsPerSample);
                const value = data[Math.floor(dataIndex)];
                
                // Enhanced value normalization with smooth clamping
                const normalizedValue = Math.max(0, Math.min(1, (value - signalScale.min) / signalScale.range));
                const y = plotHeight * (1 - normalizedValue);
                
                if (x <= yAxisX + recordedPixels && x >= yAxisX) {
                    if (!hasData) {
                        signalPath.moveTo(x, y);
                        hasData = true;
                    } else {
                        // Anti-aliasing for steep transitions
                        if (prevY !== null && Math.abs(y - prevY) > plotHeight * 0.1) {
                            const steps = Math.ceil(Math.abs(y - prevY) / 2);
                            for (let step = 1; step <= steps; step++) {
                                const interpY = prevY + (y - prevY) * (step / steps);
                                const interpX = x - pixelsPerSample * drawStep * (1 - step / steps);
                                if (interpX <= yAxisX + recordedPixels) {
                                    signalPath.lineTo(interpX, interpY);
                                }
                            }
                        } else {
                            signalPath.lineTo(x, y);
                        }
                    }
                    prevY = y;
                }
            }
        }
        
        if (hasData) {
            ctx.stroke(signalPath);
            
            // Enhanced baseline reference with median line (theme colors)
            if (signalScale.median !== undefined && recordedPixels > 0) {
                const medianY = plotHeight * (1 - (signalScale.median - signalScale.min) / signalScale.range);
                if (medianY >= 0 && medianY <= plotHeight) {
                    ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(100, 100, 100, 0.25)';
                    ctx.lineWidth = 0.8;
                    ctx.setLineDash([3, 3]);
                    ctx.beginPath();
                    ctx.moveTo(yAxisX, medianY);
                    ctx.lineTo(yAxisX + recordedPixels, medianY);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            }
        }
        
        // Current recording position indicator (moving sweep line) - slower movement
        if (isPlaying && recordedPixels >= 0 && recordedPixels <= plotWidth) {
            const currentX = yAxisX + recordedPixels;
            
            // Draw sweep line
            ctx.strokeStyle = isDark ? '#f87171' : '#FF4444'; // Lighter red for dark mode
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(currentX, 0);
            ctx.lineTo(currentX, plotHeight);
            ctx.stroke();
            
            // Add slight glow effect for the recording line
            ctx.strokeStyle = isDark ? 'rgba(248, 113, 113, 0.3)' : 'rgba(255, 68, 68, 0.3)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(currentX, 0);
            ctx.lineTo(currentX, plotHeight);
            ctx.stroke();
        }
        
        // Display current time window info at top of canvas
        if (isPlaying) {
            ctx.fillStyle = isDark ? '#94a3b8' : '#6b7280';
            ctx.font = '12px monospace';
            ctx.textAlign = 'left';
            const windowStart = windowStartSecond.toFixed(0);
            const windowEnd = (windowStartSecond + 1).toFixed(0);
            ctx.fillText(`Window: ${windowStart}s - ${windowEnd}s | Progress: ${(fractionIntoSecond * 100).toFixed(1)}%`, yAxisX + 10, 20);
        }
    }, [getSignalData, isPlaying, currentTime, signalScale, isLoadingAudio]);

    // Main canvas drawing function
    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw components
        drawGrid(ctx, width, height);
        drawAxes(ctx, width, height);
        drawSignal(ctx, width, height);
    }, [drawGrid, drawAxes, drawSignal]);

    // Animation loop for real-time updates during playback
    useEffect(() => {
        if (isPlaying) {
            const animate = () => {
                drawCanvas();
                animationFrameRef.current = requestAnimationFrame(animate);
            };
            animationFrameRef.current = requestAnimationFrame(animate);
        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }
        
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPlaying, drawCanvas]);

    // Canvas resize and redraw
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            const container = canvas.parentElement;
            if (container) {
                canvas.width = container.clientWidth;
                canvas.height = 300; // Fixed height
                drawCanvas();
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [drawCanvas]);

    // Redraw when relevant state changes
    useEffect(() => {
        if (!isPlaying) {
            drawCanvas();
        }
    }, [drawCanvas, currentTime, signalScale, isPlaying]);

    // Control handlers
    const handlePlay = useCallback(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.play().then(() => {
                setIsPlaying(true);
            }).catch(error => {
                console.error('Play failed:', error);
            });
        }
    }, []);

    const handlePause = useCallback(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            setIsPlaying(false);
        }
    }, []);

    const handleStop = useCallback(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            setIsPlaying(false);
            setCurrentTime(0);
        }
    }, []);

    const handleSeek = useCallback((newTime) => {
        const audio = audioRef.current;
        if (audio && !isNaN(newTime)) {
            audio.currentTime = Math.max(0, Math.min(duration, newTime));
            setCurrentTime(audio.currentTime);
        }
    }, [duration]);

    // Timeline click handler
    const handleTimelineClick = useCallback((event) => {
        const timeline = event.currentTarget;
        const rect = timeline.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * duration;
        handleSeek(newTime);
    }, [duration, handleSeek]);

    // Format time display
    const formatTime = useCallback((seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="doppler-signal-viewer">
            {/* Audio element */}
            <audio 
                ref={audioRef} 
                src={audioUrl} 
                preload="metadata"
                style={{ display: 'none' }}
            />

            {/* Signal Canvas */}
            <div className="signal-canvas-container">
                <canvas ref={canvasRef} className="signal-canvas" />
            </div>

            {/* Playback Controls */}
            {showPlaybackControls && audioUrl && (
                <div className="doppler-playback-controls">
                    <div className="playback-main-controls">
                        <button 
                            className="control-button stop-button"
                            onClick={handleStop}
                            title="Stop"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="6" y="6" width="12" height="12" />
                            </svg>
                        </button>

                        <button 
                            className="control-button play-pause-button"
                            onClick={isPlaying ? handlePause : handlePlay}
                            title={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isPlaying ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="6" y="4" width="4" height="16" />
                                    <rect x="14" y="4" width="4" height="16" />
                                </svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5,3 19,12 5,21" />
                                </svg>
                            )}
                        </button>

                        <div className="time-display">
                            <span>{formatTime(currentTime)}</span>
                            <span>/</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div 
                        className="timeline-container"
                        onClick={handleTimelineClick}
                    >
                        <div className="timeline">
                            <div 
                                className="timeline-progress"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>

                    {/* Volume and Download */}
                    <div className="secondary-controls">
                        <div className="volume-control">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                            </svg>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="volume-slider"
                            />
                        </div>

                        {onDownload && isGeneratedAudio && (
                            <button 
                                className="download-button"
                                onClick={onDownload}
                                title="Download Audio"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7,10 12,15 17,10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Download
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Metadata Display */}
            {metadata && (
                <div className="signal-metadata">
                    <div className="metadata-item">
                        <span className="metadata-label">Source Frequency:</span>
                        <span className="metadata-value">{metadata.sourceFrequency} Hz</span>
                    </div>
                    <div className="metadata-item">
                        <span className="metadata-label">Source Velocity:</span>
                        <span className="metadata-value">{metadata.sourceVelocity} m/s</span>
                    </div>
                    {metadata.dopplerFrequency && (
                        <div className="metadata-item">
                            <span className="metadata-label">Doppler Frequency:</span>
                            <span className="metadata-value">{metadata.dopplerFrequency} Hz</span>
                        </div>
                    )}
                    <div className="metadata-item">
                        <span className="metadata-label">Duration:</span>
                        <span className="metadata-value">{metadata.duration} s</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DopplerSignalViewer;