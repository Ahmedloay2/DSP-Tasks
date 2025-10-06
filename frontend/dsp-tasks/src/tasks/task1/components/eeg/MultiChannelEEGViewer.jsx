import React, { useState, useEffect, useCallback, useRef } from 'react';
import RealEEGDataService from './services/RealEEGDataService';
import { VIEW_MODES, CHANNEL_NAMES, DEFAULT_SETTINGS, POLAR_MODES } from './constants/MultiChannelConfig';
import ChannelSelector from './Components/Controls/ChannelSelector';
import TimeControlPanel from './Components/Controls/TimeControlPanel';
import ContinuousViewer from './Components/Viewers/ContinuousViewer';
import XORViewer from './Components/Viewers/XORViewer';
import PolarViewer from './Components/Viewers/PolarViewer';
import RecurrenceViewer from './Components/Viewers/RecurrenceViewer';
import DetectionResults from './Components/Detection/DetectionResults';
import './MultiChannelEEGViewer.css';

/**
 * MultiChannelEEGViewer Component
 * Main container for multi-channel EEG visualization with multiple viewing modes
 * Supports variable number of channels based on uploaded file
 * Now uses pre-loaded channel data for instant visualization
 */
const MultiChannelEEGViewer = ({ recordName, channelMetadata, preloadedData }) => {
  // Dynamic channel names based on metadata or fallback to default
  const [channelNames, setChannelNames] = useState(CHANNEL_NAMES);
  
  // EEG Data state - now uses preloaded data
  const [eegData, setEegData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load preloaded data immediately when available
  useEffect(() => {
    if (preloadedData && preloadedData.channels) {
      console.log('✅ Using pre-loaded channel data:', preloadedData);
      
      // Calculate statistics for each channel
      const channelStats = {};
      Object.keys(preloadedData.channels).forEach(channelName => {
        const data = preloadedData.channels[channelName];
        channelStats[channelName] = RealEEGDataService.calculateChannelStats(data);
      });
      
      // Set the data directly - no API call needed!
      setEegData({
        channels: preloadedData.channels,
        metadata: preloadedData.metadata,
        stats: channelStats,
        rawData: null // Not needed anymore
      });
      
      setLoading(false);
      setError(null);
      console.log('🎉 EEG data ready for visualization!');
    }
  }, [preloadedData]);

  // Update channel names when metadata changes
  useEffect(() => {
    if (channelMetadata && channelMetadata.channelCount) {
      // Generate channel keys dynamically: ch1, ch2, ..., chN
      const dynamicChannels = Array.from(
        { length: channelMetadata.channelCount },
        (_, i) => `ch${i + 1}`
      );
      setChannelNames(dynamicChannels);
    } else {
      setChannelNames(CHANNEL_NAMES);
    }
  }, [channelMetadata]);

  // Channel selection state - dynamically updated when channelNames change
  const [selectedChannels, setSelectedChannels] = useState({});

  // Initialize selected channels when channelNames change
  useEffect(() => {
    const initial = {};
    channelNames.forEach(ch => {
      initial[ch] = true; // All channels selected by default
    });
    setSelectedChannels(initial);
  }, [channelNames]);

  // View mode state
  const [viewMode, setViewMode] = useState(VIEW_MODES.CONTINUOUS);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(DEFAULT_SETTINGS.playbackSpeed);
  const [zoomLevel, setZoomLevel] = useState(1);

  // XOR state - dynamically updated when channelNames change
  const [xorChunkSize, setXorChunkSize] = useState(DEFAULT_SETTINGS.xorChunkSize);
  const [xorSelectedChannels, setXorSelectedChannels] = useState({});

  // Initialize XOR channels when channelNames change
  useEffect(() => {
    const initial = {};
    channelNames.forEach(ch => {
      initial[ch] = ch === channelNames[0]; // Only first channel selected by default
    });
    setXorSelectedChannels(initial);
  }, [channelNames]);

  // Polar state
  const [polarMode, setPolarMode] = useState(DEFAULT_SETTINGS.polarMode);

  // Recurrence state - dynamically updated when channelNames change
  const [recurrenceSelectedChannels, setRecurrenceSelectedChannels] = useState({});
  const [recurrenceSelectionOrder, setRecurrenceSelectionOrder] = useState([]);

  // Initialize recurrence channels when channelNames change
  useEffect(() => {
    const initial = {};
    const firstTwo = channelNames.slice(0, 2);
    channelNames.forEach(ch => {
      initial[ch] = firstTwo.includes(ch); // First two channels selected by default
    });
    setRecurrenceSelectedChannels(initial);
    setRecurrenceSelectionOrder(firstTwo);
  }, [channelNames]);

  // Refs
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(Date.now());

  // DEPRECATED: loadEEGData - data is now pre-loaded during upload
  // Kept for backward compatibility but not used anymore
  const loadEEGData = useCallback(async () => {
    console.warn('⚠️ loadEEGData called but data is pre-loaded. This should not happen.');
    setLoading(true);
    setError(null);

    try {
      // Data should already be loaded from preloadedData
      // This is a fallback that should never execute
      const expectedChannelCount = channelMetadata?.channelCount || null;
      const data = await RealEEGDataService.fetchEEGData(
        recordName || 'example',
        expectedChannelCount
      );
      setEegData(data);
    } catch (err) {
      setError(`Failed to load EEG data: ${err.message}`);
      console.error('❌ Error loading EEG data:', err);
    } finally {
      setLoading(false);
    }
  }, [recordName, channelMetadata]);

  // Remove automatic data loading - data comes from preloadedData now
  // This useEffect is disabled since we use preloadedData
  /*
  useEffect(() => {
    if (recordName) {
      loadEEGData();
    }
  }, [recordName, loadEEGData]);
  */

  // Playback animation
  useEffect(() => {
    if (!isPlaying || !eegData) {
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
        if (newTime >= eegData.metadata.duration) {
          setIsPlaying(false); // Stop playback
          return eegData.metadata.duration; // Stay at end
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
  }, [isPlaying, playbackSpeed, eegData]);

  // Reset playback when view mode changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [viewMode]);

  // Control handlers
  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => {
      // If starting to play and at the end, reset to 0
      if (!prev && eegData && currentTime >= eegData.metadata.duration) {
        setCurrentTime(0);
      }
      return !prev;
    });
  }, [currentTime, eegData]);

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
    if (!eegData) return;
    setCurrentTime(prev => Math.max(0, prev - 2));
  }, [eegData]);

  const handlePanRight = useCallback(() => {
    if (!eegData) return;
    setCurrentTime(prev => Math.min(eegData.metadata.duration, prev + 2));
  }, [eegData]);

  const handleChannelToggle = useCallback((channelId) => {
    setSelectedChannels(prev => ({
      ...prev,
      [channelId]: !prev[channelId]
    }));
  }, []);

  const handleToggleAll = useCallback((selectAll) => {
    const newSelection = {};
    channelNames.forEach(ch => {
      newSelection[ch] = selectAll;
    });
    setSelectedChannels(newSelection);
  }, [channelNames]);

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
      channelNames.forEach(ch => {
        newSelection[ch] = ch === channelId;
      });
      return newSelection;
    });
  }, [channelNames]);

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
    if (!eegData) return null;

    const commonProps = {
      channels: eegData.channels,
      selectedChannels,
      currentTime,
      samplingRate: eegData.metadata.samplingRate
    };

    switch (viewMode) {
      case VIEW_MODES.CONTINUOUS:
        return (
          <ContinuousViewer
            {...commonProps}
            duration={eegData.metadata.duration}
            zoomLevel={zoomLevel}
            isPlaying={isPlaying}
            channelMetadata={channelMetadata}
            channelNames={channelNames}
          />
        );

      case VIEW_MODES.XOR:
        return (
          <XORViewer
            channels={eegData.channels}
            selectedChannels={xorSelectedChannels}
            onChannelToggle={handleXORChannelToggle}
            currentTime={currentTime}
            samplingRate={eegData.metadata.samplingRate}
            chunkSize={xorChunkSize}
            onChunkSizeChange={setXorChunkSize}
            channelMetadata={channelMetadata}
            channelNames={channelNames}
          />
        );

      case VIEW_MODES.POLAR:
        return (
          <PolarViewer
            {...commonProps}
            polarMode={polarMode}
            onPolarModeChange={setPolarMode}
            channelMetadata={channelMetadata}
            channelNames={channelNames}
          />
        );

      case VIEW_MODES.RECURRENCE:
        return (
          <RecurrenceViewer
            channels={eegData.channels}
            selectedChannels={recurrenceSelectedChannels}
            selectionOrder={recurrenceSelectionOrder}
            onChannelToggle={handleRecurrenceChannelToggle}
            currentTime={currentTime}
            samplingRate={eegData.metadata.samplingRate}
            isPlaying={isPlaying}
            duration={eegData.metadata.duration}
            channelMetadata={channelMetadata}
            channelNames={channelNames}
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
        <p className="loading-text">Loading EEG data...</p>
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
        <button className="retry-btn" onClick={loadEEGData}>
          Retry
        </button>
      </div>
    );
  }

  // No data state
  if (!eegData) {
    return (
      <div className="multi-channel-viewer no-data">
        <p className="no-data-text">No EEG data loaded</p>
        <button className="load-btn" onClick={loadEEGData}>
          Load Data
        </button>
      </div>
    );
  }

  return (
    <div className="multi-channel-viewer">
      {/* Header */}
      <div className="viewer-main-header">
        <h1 className="viewer-main-title">
          {channelNames.length}-Channel EEG Viewer
        </h1>
        <div className="data-info">
          <span className="info-badge">
            {eegData.metadata.sampleCount.toLocaleString()} samples
          </span>
          <span className="info-badge">
            {eegData.metadata.duration.toFixed(1)}s duration
          </span>
          <span className="info-badge">
            {eegData.metadata.samplingRate}Hz
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
            channelNames={channelNames}
            channelMetadata={channelMetadata}
          />

          <TimeControlPanel
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={eegData.metadata.duration}
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

export default MultiChannelEEGViewer;
