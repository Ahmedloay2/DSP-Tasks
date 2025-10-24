import React, { useState, useEffect, useCallback, useRef } from 'react';
import RealECGService from './services/RealECGService';
import MockECGService from './services/MockECGService';
import { VIEW_MODES, CHANNEL_NAMES, DEFAULT_SETTINGS, POLAR_MODES } from './constants/MultiChannelConfig';
import ChannelSelector from './Components/Controls/ChannelSelector';
import TimeControlPanel from './Components/Controls/TimeControlPanel';
import SamplingFrequencyControl from './Components/Controls/SamplingFrequencyControl';
import ContinuousViewer from './Components/Viewers/ContinuousViewer';
import XORViewer from './Components/Viewers/XORViewer';
import PolarViewer from './Components/Viewers/PolarViewer';
import RecurrenceViewer from './Components/Viewers/RecurrenceViewer';
import DetectionResults from './Components/Detection/DetectionResults';
import './MultiChannelECGViewer.css';

/**
 * MultiChannelECGViewer Component
 * Main container for 12-channel ECG visualization with multiple viewing modes
 * Supports both Real API and Mock API modes
 */
const MultiChannelECGViewer = ({ recordName, apiMode = 'mock' }) => {
  // ECG Data state
  const [ecgData, setEcgData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Channel selection state
  const [selectedChannels, setSelectedChannels] = useState(() => {
    const initial = {};
    CHANNEL_NAMES.forEach(ch => {
      initial[ch] = true; // All channels selected by default
    });
    return initial;
  });

  // View mode state
  const [viewMode, setViewMode] = useState(VIEW_MODES.CONTINUOUS);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(DEFAULT_SETTINGS.playbackSpeed);
  const [zoomLevel, setZoomLevel] = useState(1);

  // XOR state
  const [xorChunkSize, setXorChunkSize] = useState(DEFAULT_SETTINGS.xorChunkSize);
  const [xorSelectedChannels, setXorSelectedChannels] = useState(() => {
    // Initialize with first channel selected for XOR
    const initial = {};
    CHANNEL_NAMES.forEach(ch => {
      initial[ch] = ch === 'ch1'; // Only ch1 selected by default
    });
    return initial;
  });

  // Polar state
  const [polarMode, setPolarMode] = useState(DEFAULT_SETTINGS.polarMode);

  // Sampling frequency state (Task 2: Aliasing/Anti-aliasing)
  const [samplingFrequency, setSamplingFrequency] = useState(500); // Initial: 500Hz
  const [isResampling, setIsResampling] = useState(false);
  const [classificationTrigger, setClassificationTrigger] = useState(0); // Trigger for classification refetch

  // Recurrence state
  const [recurrenceSelectedChannels, setRecurrenceSelectedChannels] = useState(() => {
    // Initialize with two channels selected for Recurrence
    const initial = {};
    CHANNEL_NAMES.forEach(ch => {
      initial[ch] = ch === 'ch1' || ch === 'ch2'; // Channels ch1 and ch2 selected by default
    });
    return initial;
  });
  const [recurrenceSelectionOrder, setRecurrenceSelectionOrder] = useState(['ch1', 'ch2']);

  // Refs
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(Date.now());

  const loadECGData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let data;
      
      if (apiMode === 'real') {
        // Real API mode - fetch from backend
        data = await RealECGService.fetchECGData(recordName || 'example');
      } else {
        // Mock API mode - generate synthetic data
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        
        const mockSignalData = MockECGService.generateSampledSignal(250, 30); // 250Hz, 30 seconds
        
        // Transform to match expected format
        const channels = mockSignalData.channels;
        const channelStats = {};
        
        // Calculate stats for each channel
        Object.keys(channels).forEach(chId => {
          const channelData = channels[chId];
          const min = Math.min(...channelData);
          const max = Math.max(...channelData);
          const mean = channelData.reduce((a, b) => a + b, 0) / channelData.length;
          
          channelStats[chId] = { min, max, mean, samples: channelData.length };
        });
        
        data = {
          channels,
          metadata: {
            sampleCount: mockSignalData.metadata.sampleCount,
            samplingRate: mockSignalData.metadata.samplingRate,
            duration: mockSignalData.metadata.duration,
            channelCount: 12
          },
          stats: channelStats
        };
      }
      
      setEcgData(data);
    } catch (err) {
      setError(`Failed to load ECG data: ${err.message}`);
      console.error('❌ Error loading ECG data:', err);
    } finally {
      setLoading(false);
    }
  }, [recordName, apiMode]);

  // Load ECG data on mount or when recordName changes
  useEffect(() => {
    if (recordName) {
      loadECGData();
    }
  }, [recordName, loadECGData]);

  // Playback animation
  useEffect(() => {
    if (!isPlaying || !ecgData) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000; // Convert to seconds
      lastTimeRef.current = now;

      setCurrentTime(prevTime => {
        const newTime = prevTime + (deltaTime * playbackSpeed);
        
        // Stop at end and stay there (no auto-reset)
        if (newTime >= ecgData.metadata.duration) {
          setIsPlaying(false); // Stop playback
          return ecgData.metadata.duration; // Stay at end
        }
        
        return newTime;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = Date.now();
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, ecgData]);

  // Reset playback when view mode changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [viewMode]);

  // Control handlers
  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => {
      // If starting to play and at the end, reset to 0
      if (!prev && ecgData && currentTime >= ecgData.metadata.duration) {
        setCurrentTime(0);
      }
      return !prev;
    });
  }, [currentTime, ecgData]);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const handleSpeedChange = useCallback((speed) => {
    setPlaybackSpeed(speed);
  }, []);

  const handleSeek = useCallback((time) => {
    setCurrentTime(time);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.5, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
  }, []);

  const handlePanLeft = useCallback(() => {
    if (!ecgData) return;
    setCurrentTime(prev => Math.max(0, prev - 2));
  }, [ecgData]);

  const handlePanRight = useCallback(() => {
    if (!ecgData) return;
    setCurrentTime(prev => Math.min(ecgData.metadata.duration, prev + 2));
  }, [ecgData]);

  const handleChannelToggle = useCallback((channelId) => {
    setSelectedChannels(prev => ({
      ...prev,
      [channelId]: !prev[channelId]
    }));
  }, []);

  const handleToggleAll = useCallback((selectAll) => {
    const newSelection = {};
    CHANNEL_NAMES.forEach(ch => {
      newSelection[ch] = selectAll;
    });
    setSelectedChannels(newSelection);
  }, []);

  // Sampling frequency handlers
  const handleFrequencyChange = useCallback((newFrequency) => {
    setSamplingFrequency(newFrequency);
  }, []);

  const handleResample = useCallback(async () => {
    if (!ecgData || isResampling) return;
    
    setIsResampling(true);
    console.log(`🎛️ Resampling ECG data to ${samplingFrequency}Hz...`);
    
    try {
      if (apiMode === 'real') {
        // Use real API endpoint for resampling
        const result = await RealECGService.resampleECGData(recordName, samplingFrequency);
        
        if (result.success && result.data) {
          // Update ECG data with resampled data from API
          setEcgData(result.data);
          console.log(`✅ Resampling complete via API! New rate: ${samplingFrequency}Hz`);
          
          // Trigger classification refetch with new sampling frequency
          setClassificationTrigger(prev => prev + 1);
        } else {
          throw new Error(result.message || 'Failed to resample via API');
        }
      } else {
        // Mock API mode - use client-side resampling
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const resampledChannels = {};
        Object.keys(ecgData.channels).forEach(channelName => {
          const originalData = ecgData.channels[channelName];
          const originalRate = ecgData.metadata.samplingRate;
          
          if (samplingFrequency < originalRate) {
            // Downsample
            resampledChannels[channelName] = MockECGService.downsampleSignal(
              originalData, 
              originalRate, 
              samplingFrequency
            );
          } else if (samplingFrequency > originalRate) {
            // Upsample
            const factor = Math.round(samplingFrequency / originalRate);
            resampledChannels[channelName] = MockECGService.upsampleSignal(
              originalData, 
              factor
            );
          } else {
            // No change
            resampledChannels[channelName] = originalData;
          }
        });
        
        // Update ECG data with resampled channels
        const newSampleCount = resampledChannels.ch1.length;
        const newDuration = newSampleCount / samplingFrequency;
        
        setEcgData(prev => ({
          ...prev,
          channels: resampledChannels,
          metadata: {
            ...prev.metadata,
            samplingRate: samplingFrequency,
            sampleCount: newSampleCount,
            duration: newDuration
          }
        }));
        
        console.log(`✅ Resampling complete (mock)! New rate: ${samplingFrequency}Hz`);
        
        // Trigger classification refetch with new sampling frequency
        setClassificationTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('❌ Resampling failed:', error);
      setError(`Resampling failed: ${error.message}`);
    } finally {
      setIsResampling(false);
    }
  }, [ecgData, samplingFrequency, isResampling, apiMode, recordName]);

  // XOR channel toggle (single selection only)
  const handleXORChannelToggle = useCallback((channelId) => {
    setXorSelectedChannels(prev => {
      const isCurrentlySelected = prev[channelId];
      
      // If deselecting, just deselect
      if (isCurrentlySelected) {
        return {
          ...prev,
          [channelId]: false
        };
      }
      
      // If selecting, deselect all others and select this one (single selection)
      const newSelection = {};
      CHANNEL_NAMES.forEach(ch => {
        newSelection[ch] = ch === channelId;
      });
      return newSelection;
    });
  }, []);

  // Recurrence channel toggle (dual selection with order tracking)
  const handleRecurrenceChannelToggle = useCallback((channelId) => {
    setRecurrenceSelectedChannels(prev => {
      const isCurrentlySelected = prev[channelId];
      const currentlySelectedCount = Object.values(prev).filter(Boolean).length;
      
      // If deselecting, remove from selection and update order
      if (isCurrentlySelected) {
        setRecurrenceSelectionOrder(prevOrder => prevOrder.filter(ch => ch !== channelId));
        return {
          ...prev,
          [channelId]: false
        };
      }
      
      // If selecting and already have 2 selected, don't allow more
      if (currentlySelectedCount >= 2) {
        return prev;
      }
      
      // If selecting, add to selection and update order
      setRecurrenceSelectionOrder(prevOrder => [...prevOrder, channelId]);
      return {
        ...prev,
        [channelId]: true
      };
    });
  }, []);

  // Get appropriate channel selection state based on current view mode
  const getCurrentChannelState = () => {
    switch (viewMode) {
      case VIEW_MODES.XOR:
        return {
          selectedChannels: xorSelectedChannels,
          onChannelToggle: handleXORChannelToggle,
          maxSelection: 1,
          selectionOrder: []
        };
      case VIEW_MODES.RECURRENCE:
        return {
          selectedChannels: recurrenceSelectedChannels,
          onChannelToggle: handleRecurrenceChannelToggle,
          maxSelection: 2,
          selectionOrder: recurrenceSelectionOrder
        };
      case VIEW_MODES.CONTINUOUS:
      case VIEW_MODES.POLAR:
      default:
        return {
          selectedChannels: selectedChannels,
          onChannelToggle: handleChannelToggle,
          maxSelection: null,
          selectionOrder: []
        };
    }
  };

  // Render viewer based on mode
  const renderViewer = () => {
    if (!ecgData) return null;

    const commonProps = {
      channels: ecgData.channels,
      selectedChannels,
      currentTime,
      samplingRate: ecgData.metadata.samplingRate
    };

    switch (viewMode) {
      case VIEW_MODES.CONTINUOUS:
        return (
          <ContinuousViewer
            {...commonProps}
            duration={ecgData.metadata.duration}
            zoomLevel={zoomLevel}
            isPlaying={isPlaying}
          />
        );

      case VIEW_MODES.XOR:
        return (
          <XORViewer
            channels={ecgData.channels}
            selectedChannels={xorSelectedChannels}
            onChannelToggle={handleXORChannelToggle}
            currentTime={currentTime}
            samplingRate={ecgData.metadata.samplingRate}
            chunkSize={xorChunkSize}
            onChunkSizeChange={setXorChunkSize}
            isPlaying={isPlaying}
          />
        );

      case VIEW_MODES.POLAR:
        return (
          <PolarViewer
            {...commonProps}
            polarMode={polarMode}
            onPolarModeChange={setPolarMode}
          />
        );

      case VIEW_MODES.RECURRENCE:
        return (
          <RecurrenceViewer
            channels={ecgData.channels}
            selectedChannels={recurrenceSelectedChannels}
            selectionOrder={recurrenceSelectionOrder}
            onChannelToggle={handleRecurrenceChannelToggle}
            currentTime={currentTime}
            samplingRate={ecgData.metadata.samplingRate}
            isPlaying={isPlaying}
            duration={ecgData.metadata.duration}
          />
        );

      default:
        return null;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="task2-multi-channel-viewer task2-loading">
        <div className="task2-loading-spinner" />
        <p className="task2-loading-text">Loading ECG data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="task2-multi-channel-viewer task2-error">
        <div className="task2-error-icon">⚠️</div>
        <h2 className="task2-error-title">Error Loading Data</h2>
        <p className="task2-error-message">{error}</p>
        <button className="task2-retry-btn" onClick={loadECGData}>
          Retry
        </button>
      </div>
    );
  }

  // No data state
  if (!ecgData) {
    return (
      <div className="task2-multi-channel-viewer task2-no-data">
        <p className="task2-no-data-text">No ECG data loaded</p>
        <button className="task2-load-btn" onClick={loadECGData}>
          Load Data
        </button>
      </div>
    );
  }

  return (
    <div className="task2-multi-channel-viewer">
      {/* Header */}
      <div className="task2-viewer-main-header">
        <h1 className="task2-viewer-main-title">12-Channel ECG Viewer</h1>
        <div className="task2-data-info">
          <span className="task2-info-badge">
            {ecgData.metadata.sampleCount.toLocaleString()} samples
          </span>
          <span className="task2-info-badge">
            {ecgData.metadata.duration.toFixed(1)}s duration
          </span>
          <span className="task2-info-badge">
            {ecgData.metadata.samplingRate}Hz
          </span>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="task2-view-mode-selector">
        {Object.entries(VIEW_MODES).map(([, mode]) => (
          <button
            key={mode}
            className={`task2-view-mode-btn ${viewMode === mode ? 'active' : ''}`}
            onClick={() => setViewMode(mode)}
          >
            {mode === VIEW_MODES.CONTINUOUS && '📊 Continuous'}
            {mode === VIEW_MODES.XOR && '🔀 XOR Graph'}
            {mode === VIEW_MODES.POLAR && '🎯 Polar'}
            {mode === VIEW_MODES.RECURRENCE && '📈 Recurrence'}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="task2-viewer-content">
        {/* Left Panel - Controls */}
        <div className="task2-viewer-sidebar">
          <ChannelSelector
            {...getCurrentChannelState()}
            onToggleAll={handleToggleAll}
          />

          <TimeControlPanel
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={ecgData.metadata.duration}
            playbackSpeed={playbackSpeed}
            zoomLevel={zoomLevel}
            onPlayPause={handlePlayPause}
            onStop={handleStop}
            onSpeedChange={handleSpeedChange}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onSeek={handleSeek}
            onPanLeft={handlePanLeft}
            onPanRight={handlePanRight}
            showZoom={viewMode === VIEW_MODES.CONTINUOUS}
          />

          <SamplingFrequencyControl
            currentFrequency={samplingFrequency}
            onFrequencyChange={handleFrequencyChange}
            onResample={handleResample}
            isResampling={isResampling}
            minFrequency={50}
            maxFrequency={1000}
            step={10}
          />
        </div>

        {/* Right Panel - Viewer */}
        <div className="task2-viewer-main">
          {renderViewer()}
        </div>
      </div>

      {/* Detection Section - Below Viewer */}
      <div className="task2-detection-section">
        <DetectionResults
          recordName={recordName || 'unknown'}
          samplingFrequency={samplingFrequency}
          triggerRefetch={classificationTrigger}
        />
      </div>
    </div>
  );
};

export default MultiChannelECGViewer;

