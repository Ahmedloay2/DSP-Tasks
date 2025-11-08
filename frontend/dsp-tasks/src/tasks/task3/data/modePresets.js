/**
 * Mode Presets Data
 * Predefined frequency ranges for specialized modes
 * 
 * @author AI Assistant
 * @version 1.0.0
 */

/**
 * Musical Instrument Presets
 * Based on fundamental frequency ranges of common instruments
 */
export const INSTRUMENT_PRESETS = [
  { 
    name: 'Piano (Soft 100 BPM)', 
    minFreq: 27.5,  // A0
    maxFreq: 4186,  // C8
    gain: 1.0,
    icon: '🎹'
  },
  { 
    name: 'Guitar', 
    minFreq: 82.4,  // E2
    maxFreq: 1319,  // E6
    gain: 1.0,
    icon: '🎸'
  },
  { 
    name: 'Drums/Beat', 
    minFreq: 40, 
    maxFreq: 16000,  // Includes cymbals
    gain: 1.0,
    icon: '🥁'
  },
  { 
    name: 'Trumpet', 
    minFreq: 185,  // F#3
    maxFreq: 1500, 
    gain: 1.0,
    icon: '🎺'
  },
  {
    name: 'Bass Guitar',
    minFreq: 41,  // E1
    maxFreq: 392,  // G4
    gain: 1.0,
    icon: '🎸'
  },
  {
    name: 'Violin',
    minFreq: 196,  // G3
    maxFreq: 3136,  // G7
    gain: 1.0,
    icon: '🎻'
  }
];

/**
 * Animal Sound Presets
 * Frequency ranges for various animal vocalizations
 */
export const ANIMAL_PRESETS = [
  { 
    name: 'Dog Bark', 
    minFreq: 300, 
    maxFreq: 4000,
    gain: 1.0,
    icon: '🐕'
  },
  { 
    name: 'Cat Meow', 
    minFreq: 250, 
    maxFreq: 4000,
    gain: 1.0,
    icon: '🐱'
  },
  { 
    name: 'Crow Caw', 
    minFreq: 300, 
    maxFreq: 5000,
    gain: 1.0,
    icon: '🐦'
  },
  { 
    name: 'Elephant Trumpet', 
    minFreq: 400, 
    maxFreq: 8000,
    gain: 1.0,
    icon: '🐘'
  },
  { 
    name: 'Elk Call', 
    minFreq: 200, 
    maxFreq: 4000,
    gain: 1.0,
    icon: '🦌'
  },
  { 
    name: 'Gull/Seagull', 
    minFreq: 500, 
    maxFreq: 4500,
    gain: 1.0,
    icon: '🦅'
  },
  { 
    name: 'Horse Neigh', 
    minFreq: 200, 
    maxFreq: 3500,
    gain: 1.0,
    icon: '🐴'
  },
  { 
    name: 'Owl Hoot', 
    minFreq: 150, 
    maxFreq: 800,
    gain: 1.0,
    icon: '🦉'
  }
];

/**
 * Voice/Speech Presets
 * Frequency ranges for human voice characteristics
 */
export const VOICE_PRESETS = [
  { 
    name: 'Male Speech', 
    minFreq: 85, 
    maxFreq: 180,
    gain: 1.0,
    description: 'Male fundamental frequency',
    icon: '👨'
  },
  { 
    name: 'Female Speech', 
    minFreq: 165, 
    maxFreq: 255,
    gain: 1.0,
    description: 'Female fundamental frequency',
    icon: '👩'
  },
  { 
    name: 'Child Voice', 
    minFreq: 250, 
    maxFreq: 400,
    gain: 1.0,
    description: 'Child fundamental frequency',
    icon: '👶'
  },
  { 
    name: 'Voice Harmonics', 
    minFreq: 300, 
    maxFreq: 3000,
    gain: 1.0,
    description: 'Main formant regions',
    icon: '🎤'
  },
  { 
    name: 'Speech Clarity', 
    minFreq: 2000, 
    maxFreq: 4000,
    gain: 1.0,
    description: 'Intelligibility range',
    icon: '💬'
  },
  { 
    name: 'Sibilance', 
    minFreq: 4000, 
    maxFreq: 8000,
    gain: 1.0,
    description: 'S and T sounds',
    icon: '🗣️'
  }
];

/**
 * Get preset by mode
 * @param {string} mode - Mode name ('musical', 'animal', 'voice')
 * @returns {Array} Array of presets for the mode
 */
export function getPresetsByMode(mode) {
  switch (mode) {
    case 'musical':
      return INSTRUMENT_PRESETS;
    case 'animal':
      return ANIMAL_PRESETS;
    case 'voice':
      return VOICE_PRESETS;
    default:
      return [];
  }
}
