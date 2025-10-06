import React, { useState, useEffect, useCallback, useRef } from 'react';
import RealECGDataService from './services/RealECGDataService';
import { VIEW_MODES, CHANNEL_NAMES, DEFAULT_SETTINGS, POLAR_MODES } from './constants/MultiChannelConfig';
import ChannelSelector from './Components/Controls/ChannelSelector';
import TimeControlPanel from './Components/Controls/TimeControlPanel';
import ContinuousViewer from './Components/Viewers/ContinuousViewer';
import XORViewer from './Components/Viewers/XORViewer';
import PolarViewer from './Components/Viewers/PolarViewer';
import RecurrenceViewer from './Components/Viewers/RecurrenceViewer';
import DetectionResults from './Components/Detection/DetectionResults';
import './MultiChannelECGViewer.css';

/**
 * MultiChannelECGViewer Component
 * Main container for 12-channel ECG visualization with multiple viewing modes
 */
const MultiChannelECGViewer = ({ recordName }) => {
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
      const data = await RealECGDataService.fetchECGData(recordName || 'example');
      setEcgData(data);
    } catch (err) {
      setError(`Failed to load ECG data: ${err.message}`);
      console.error('❌ Error loading ECG data:', err);
    } finally {
      setLoading(false);
    }
  }, [recordName]);

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
      <div className="multi-channel-viewer loading">
        <div className="loading-spinner" />
        <p className="loading-text">Loading ECG data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="multi-channel-viewer error">
        <div className="error-icon">⚠️</div>
        <h2 className="error-title">Error Loading Data</h2>
        <p className="error-message">{error}</p>
        <button className="retry-btn" onClick={loadECGData}>
          Retry
        </button>
      </div>
    );
  }

  // No data state
  if (!ecgData) {
    return (
      <div className="multi-channel-viewer no-data">
        <p className="no-data-text">No ECG data loaded</p>
        <button className="load-btn" onClick={loadECGData}>
          Load Data
        </button>
      </div>
    );
  }

  return (
    <div className="multi-channel-viewer">
      {/* Header */}
      <div className="viewer-main-header">
        <h1 className="viewer-main-title">12-Channel ECG Viewer</h1>
        <div className="data-info">
          <span className="info-badge">
            {ecgData.metadata.sampleCount.toLocaleString()} samples
          </span>
          <span className="info-badge">
            {ecgData.metadata.duration.toFixed(1)}s duration
          </span>
          <span className="info-badge">
            {ecgData.metadata.samplingRate}Hz
          </span>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="view-mode-selector">
        {Object.entries(VIEW_MODES).map(([, mode]) => (
          <button
            key={mode}
            className={`view-mode-btn ${viewMode === mode ? 'active' : ''}`}
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
      <div className="viewer-content">
        {/* Left Panel - Controls */}
        <div className="viewer-sidebar">
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
        </div>

        {/* Right Panel - Viewer */}
        <div className="viewer-main">
          {renderViewer()}
        </div>
      </div>

      {/* Detection Section - Below Viewer */}
      <div className="detection-section">
        <DetectionResults
          recordName={recordName || 'unknown'}
        />
      </div>
    </div>
  );
};

export default MultiChannelECGViewer;
