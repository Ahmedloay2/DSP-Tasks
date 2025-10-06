/**
 * Multi-Channel ECG Configuration
 * Defines channel names, colors, and settings for 12-channel ECG
 * Uses CSS variables from index.css for consistent theming and dark mode support
 */

// Helper function to get CSS variable value
const getCSSVar = (varName) => {
  if (typeof window !== 'undefined') {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }
  return null;
};

// 12-channel ECG configuration using CSS variables from index.css
// Maps to signal colors that auto-adjust for dark mode
export const CHANNEL_CONFIG = {
  ch1: { name: 'Channel 1', color: 'var(--signal-primary)', cssVar: '--signal-primary', enabled: true },      // Blue
  ch2: { name: 'Channel 2', color: 'var(--signal-secondary)', cssVar: '--signal-secondary', enabled: true },  // Red
  ch3: { name: 'Channel 3', color: 'var(--signal-tertiary)', cssVar: '--signal-tertiary', enabled: true },    // Green
  ch4: { name: 'Channel 4', color: 'var(--signal-quaternary)', cssVar: '--signal-quaternary', enabled: true },// Purple
  ch5: { name: 'Channel 5', color: 'var(--signal-accent)', cssVar: '--signal-accent', enabled: true },        // Orange
  ch6: { name: 'Channel 6', color: 'var(--signal-info)', cssVar: '--signal-info', enabled: true },            // Cyan
  ch7: { name: 'Channel 7', color: 'var(--signal-pink)', cssVar: '--signal-pink', enabled: true },            // Pink
  ch8: { name: 'Channel 8', color: 'var(--primary)', cssVar: '--primary', enabled: true },                    // Primary Blue
  ch9: { name: 'Channel 9', color: 'var(--success)', cssVar: '--success', enabled: true },                    // Success Green
  ch10: { name: 'Channel 10', color: 'var(--warning)', cssVar: '--warning', enabled: true },                  // Warning Orange
  ch11: { name: 'Channel 11', color: 'var(--signal-neutral)', cssVar: '--signal-neutral', enabled: true },    // Gray
  ch12: { name: 'Channel 12', color: 'var(--error)', cssVar: '--error', enabled: true }                       // Error Red
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

// Default settings
export const DEFAULT_SETTINGS = {
  samplingRate: 500,
  viewportDuration: 10,
  playbackSpeed: 1,
  xorChunkSize: 5,
  polarMode: POLAR_MODES.LATEST_FIXED,
  selectedChannelX: 'ch1',
  selectedChannelY: 'ch2'
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
  WARM: [
    { light: '#dc2626', dark: '#f87171' },
    { light: '#ea580c', dark: '#fb923c' },
    { light: '#d97706', dark: '#fbbf24' },
    { light: '#e11d48', dark: '#fb7185' }
  ]
};

// Helper to get density color based on theme
export const getDensityColor = (scheme, index, isDarkMode = false) => {
  const colors = DENSITY_COLOR_SCHEMES[scheme] || DENSITY_COLOR_SCHEMES.VIRIDIS;
  const colorIndex = Math.min(index, colors.length - 1);
  const colorObj = colors[colorIndex];
  return isDarkMode ? colorObj.dark : colorObj.light;
};

export default {
  CHANNEL_CONFIG,
  CHANNEL_NAMES,
  VIEW_MODES,
  POLAR_MODES,
  PLAYBACK_SPEEDS,
  TIME_WINDOWS,
  DEFAULT_SETTINGS,
  DENSITY_COLOR_SCHEMES,
  getChannelColor,
  getDensityColor
};
