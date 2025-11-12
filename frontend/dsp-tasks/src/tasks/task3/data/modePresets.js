

/**
 * Musical Instrument Presets
 * Based on fundamental frequency ranges of common instruments
 */
export const INSTRUMENT_PRESETS = [
  {
    name: 'Double Bass',
    minFreq: 41,  // E2
    maxFreq: 392,  // E6
    gain: 1.0,
    icon: '🎸',
    audioFile: '613389__elzozo__double-bass-thriller-tense-music-loop.mp3'
  },
  {
    name: 'Drums/Beat',
    minFreq: 50,
    maxFreq: 172,  // Includes cymbals
    gain: 1.0,
    icon: '🥁',
    audioFile: '#shorts #snaredrums #snare #snares #snaredrum #drumming #drumsolo #drummer #drums #drum #drumcam.mp3'
  },
  {
    name: 'Flute',
    minFreq: 300,  // F#3
    maxFreq: 561,
    gain: 1.0,
    icon: '🎺',
    audioFile: '354974__mtg__flute-e-natural-minor.wav'
  },
  {
    name: 'cello',
    minFreq: 120,  // E1
    maxFreq: 202,  // G4
    gain: 1.0,
    icon: '🎻',
    audioFile: '195552__flcellogrl__9_cello_g3_ab3.wav'
  },
  {
    name: 'Violin',
    minFreq: 200,  // G3
    maxFreq: 1000,  // G7
    gain: 1.0,
    icon: '🎻',
    audioFile: '356247__mtg__violin-g-major-bad-pitch-staccato.wav'
  }
];

/**
 * Animal Sound Presets
 * Frequency ranges for various animal vocalizations
 */
export const ANIMAL_PRESETS = [
  {
    name: 'Elephant',
    minFreq: 150,
    maxFreq: 1000,
    gain: 1.0,
    icon: '🐘',
    audioFile: '713066__sound_design_freak__elephant-sound.mp3'
  },
  {
    name: 'Bird',
    minFreq: 2900,
    maxFreq: 9000,
    gain: 1.0,
    icon: '🐦',
    audioFile: '507262__spacejoe__bird-noise-4.mp3'
  },
  {
    name: 'Dog',
    minFreq: 300,
    maxFreq: 5000,
    gain: 1.0,
    icon: '🐕‍🦺',
    audioFile: '483182__spacejoe__barking-dog-2.mp3'
  },
  {
    name: 'Tiger',
    minFreq: 0,
    maxFreq: 300,
    gain: 1.0,
    icon: '🐅',
    audioFile: '149190__videog__tiger-roar.mp3'
  }
];

/**
 * Voice/Speech Presets
 * Frequency ranges for human voice characteristics
 */
export const VOICE_PRESETS = [
  {
    name: 'Male Speech',
    minFreq: 0,
    maxFreq: 586,
    gain: 1.0,
    description: 'Male fundamental frequency',
    icon: '👨',
    audioFile: 'Male_speech.mp3'
  },
  {
    name: 'Female Speech',
    minFreq: 194,
    maxFreq: 500,
    gain: 1.0,
    description: 'Female fundamental frequency',
    icon: '👩',
    audioFile: 'Female_Speech.mp3'
  },
  {
    name: 'Child Female',
    minFreq: 345,
    maxFreq: 700,
    gain: 1.0,
    description: 'Child female frequency',
    icon: '👶',
    audioFile: 'Female_Child.mp3'
  },
  {
    name: 'Child Male ',
    minFreq: 0,
    maxFreq: 125,
    gain: 1.0,
    description: 'Child male frequency',
    icon: '🎤',
    audioFile: 'Male_Child.mp3'
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
