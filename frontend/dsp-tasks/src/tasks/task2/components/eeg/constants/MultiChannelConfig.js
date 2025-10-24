/**
 * Multi-Channel EEG Configuration
 * Defines channel names, colors, and settings for 12-channel EEG
 * Uses CSS variables from index.css for consistent theming and dark mode support
 */

// Helper function to get CSS variable value
const getCSSVar = (varName) => {
  if (typeof window !== 'undefined') {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }
  return null;
};

// 12-channel EEG configuration using CSS variables from index.css
// Maps to signal colors that auto-adjust for dark mode
// Channels represent standard 10-20 EEG electrode positions
export const CHANNEL_CONFIG = {
  ch1: { name: 'Fp1', region: 'Frontal', color: 'var(--signal-primary)', cssVar: '--signal-primary', enabled: true },      // Blue
  ch2: { name: 'Fp2', region: 'Frontal', color: 'var(--signal-secondary)', cssVar: '--signal-secondary', enabled: true },  // Red
  ch3: { name: 'F7', region: 'Frontal', color: 'var(--signal-tertiary)', cssVar: '--signal-tertiary', enabled: true },     // Green
  ch4: { name: 'F3', region: 'Frontal', color: 'var(--signal-quaternary)', cssVar: '--signal-quaternary', enabled: true }, // Purple
  ch5: { name: 'Fz', region: 'Frontal', color: 'var(--signal-accent)', cssVar: '--signal-accent', enabled: true },         // Orange
  ch6: { name: 'F4', region: 'Frontal', color: 'var(--signal-info)', cssVar: '--signal-info', enabled: true },             // Cyan
  ch7: { name: 'F8', region: 'Frontal', color: 'var(--signal-pink)', cssVar: '--signal-pink', enabled: true },             // Pink
  ch8: { name: 'T3', region: 'Temporal', color: 'var(--primary)', cssVar: '--primary', enabled: true },                    // Primary Blue
  ch9: { name: 'C3', region: 'Central', color: 'var(--success)', cssVar: '--success', enabled: true },                     // Success Green
  ch10: { name: 'Cz', region: 'Central', color: 'var(--warning)', cssVar: '--warning', enabled: true },                    // Warning Orange
  ch11: { name: 'C4', region: 'Central', color: 'var(--signal-neutral)', cssVar: '--signal-neutral', enabled: true },      // Gray
  ch12: { name: 'T4', region: 'Temporal', color: 'var(--error)', cssVar: '--error', enabled: true }                        // Error Red
};

// Get resolved color values (for canvas rendering)
export const getChannelColor = (channelKey) => {
  const config = CHANNEL_CONFIG[channelKey];
  if (!config) return '#2563eb'; // fallback to blue
  
  // Try to get computed CSS variable value
  const resolvedColor = getCSSVar(config.cssVar);
  return resolvedColor || config.color;
};

// Channel names array
export const CHANNEL_NAMES = Object.keys(CHANNEL_CONFIG);

// Visualization modes
export const VIEW_MODES = {
  CONTINUOUS: 'continuous',
  XOR: 'xor',
  POLAR: 'polar',
  RECURRENCE: 'recurrence'
};

// Polar visualization modes
export const POLAR_MODES = {
  LATEST_FIXED: 'latest_fixed',
  CUMULATIVE: 'cumulative'
};

// Playback speed options
export const PLAYBACK_SPEEDS = [0.5, 1, 2, 4];

// Time window sizes (in seconds)
export const TIME_WINDOWS = {
  CONTINUOUS: 10, // Fixed 10-second viewport
  MIN_CHUNK: 1,   // Minimum XOR chunk size
  MAX_CHUNK: 10   // Maximum XOR chunk size
};

// Default settings for EEG
export const DEFAULT_SETTINGS = {
  samplingRate: 256,  // Common EEG sampling rate (256 Hz)
  viewportDuration: 10,
  playbackSpeed: 1,
  xorChunkSize: 5,
  polarMode: POLAR_MODES.LATEST_FIXED,
  selectedChannelX: 'ch1',
  selectedChannelY: 'ch2'
};

// EEG Frequency bands configuration
export const FREQUENCY_BANDS = {
  DELTA: { min: 0.5, max: 4, name: 'Delta', color: '#8B4513' },
  THETA: { min: 4, max: 8, name: 'Theta', color: '#9370DB' },
  ALPHA: { min: 8, max: 13, name: 'Alpha', color: '#4169E1' },
  BETA: { min: 13, max: 30, name: 'Beta', color: '#32CD32' },
  GAMMA: { min: 30, max: 100, name: 'Gamma', color: '#FF4500' }
};

// Color schemes for density maps (optimized for both light and dark modes)
export const DENSITY_COLOR_SCHEMES = {
  VIRIDIS: [
    { light: '#440154', dark: '#440154' },
    { light: '#31688e', dark: '#31688e' },
    { light: '#35b779', dark: '#35b779' },
    { light: '#fde724', dark: '#fde724' }
  ],
  PLASMA: [
    { light: '#0d0887', dark: '#0d0887' },
    { light: '#7e03a8', dark: '#7e03a8' },
    { light: '#cc4778', dark: '#cc4778' },
    { light: '#f89540', dark: '#f89540' },
    { light: '#f0f921', dark: '#f0f921' }
  ],
  COOL: [
    { light: '#2563eb', dark: '#60a5fa' },
    { light: '#0891b2', dark: '#22d3ee' },
    { light: '#059669', dark: '#34d399' },
    { light: '#7c3aed', dark: '#a78bfa' }
  ],
  BRAIN: [
    { light: '#8B4513', dark: '#A0522D' },  // Delta - Brown
    { light: '#9370DB', dark: '#BA55D3' },  // Theta - Purple
    { light: '#4169E1', dark: '#6495ED' },  // Alpha - Blue
    { light: '#32CD32', dark: '#7FFF00' },  // Beta - Green
    { light: '#FF4500', dark: '#FF6347' }   // Gamma - Red
  ]
};

// Brain regions
export const BRAIN_REGIONS = {
  FRONTAL: ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7'],
  TEMPORAL: ['ch8', 'ch12'],
  CENTRAL: ['ch9', 'ch10', 'ch11']
};

// Color palette for dynamic channels (cycles through these)
const DYNAMIC_CHANNEL_COLORS = [
  'var(--signal-primary)',
  'var(--signal-secondary)',
  'var(--signal-tertiary)',
  'var(--signal-quaternary)',
  'var(--signal-accent)',
  'var(--signal-info)',
  'var(--signal-pink)',
  'var(--primary)',
  'var(--success)',
  'var(--warning)',
  'var(--signal-neutral)',
  'var(--error)'
];

/**
 * Get channel configuration for any channel (static or dynamic)
 * @param {string} channelId - Channel ID (e.g., 'ch1', 'ch2', ...)
 * @param {number} index - Index of the channel (for color cycling)
 * @param {Array<string>} apiChannelNames - Optional array of channel names from API
 * @returns {Object} Channel configuration with name, region, color, enabled
 */
export const getDynamicChannelConfig = (channelId, index = 0, apiChannelNames = null) => {
  // If channel exists in static config, use it
  if (CHANNEL_CONFIG[channelId]) {
    return CHANNEL_CONFIG[channelId];
  }
  
  // Generate dynamic config for channels beyond the static config
  const colorIndex = index % DYNAMIC_CHANNEL_COLORS.length;
  const channelNumber = parseInt(channelId.replace('ch', ''));
  const apiChannelName = apiChannelNames?.[channelNumber - 1];
  
  return {
    name: apiChannelName || `CH${channelNumber}`,
    region: 'Unknown',
    color: DYNAMIC_CHANNEL_COLORS[colorIndex],
    cssVar: null,
    enabled: true
  };
};

// Export for backward compatibility
export { CHANNEL_CONFIG as default };
