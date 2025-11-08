/**
 * Synthetic Signal Examples
 * 
 * Pre-configured synthetic signals for testing the equalizer.
 * Each signal has known frequency components for validation.
 * 
 * @author AI Assistant
 * @version 1.0.0
 */

/**
 * Musical Scale Signal
 * Contains notes from C4 to C5 (Do-Re-Mi-Fa-Sol-La-Si-Do)
 */
export const musicalScaleSignal = {
  name: 'Musical Scale (C4-C5)',
  description: 'Eight musical notes in sequence',
  components: [
    { frequency: 261.63, amplitude: 1.0, label: 'C4 (Do)' },
    { frequency: 293.66, amplitude: 0.9, label: 'D4 (Re)' },
    { frequency: 329.63, amplitude: 0.9, label: 'E4 (Mi)' },
    { frequency: 349.23, amplitude: 0.9, label: 'F4 (Fa)' },
    { frequency: 392.00, amplitude: 0.9, label: 'G4 (Sol)' },
    { frequency: 440.00, amplitude: 1.0, label: 'A4 (La)' },
    { frequency: 493.88, amplitude: 0.9, label: 'B4 (Si)' },
    { frequency: 523.25, amplitude: 1.0, label: 'C5 (Do)' }
  ],
  duration: 4,
  sampleRate: 44100
};

/**
 * Frequency Range Test Signal
 * Covers full human hearing range (20Hz - 20kHz)
 */
export const fullRangeSignal = {
  name: 'Full Range Test',
  description: 'Covers 20Hz to 20kHz in octaves',
  components: [
    { frequency: 20, amplitude: 0.5, label: 'Sub Bass' },
    { frequency: 40, amplitude: 0.5, label: 'Bass' },
    { frequency: 80, amplitude: 0.6, label: 'Low Bass' },
    { frequency: 160, amplitude: 0.7, label: 'Mid Bass' },
    { frequency: 320, amplitude: 0.8, label: 'Low Mid' },
    { frequency: 640, amplitude: 1.0, label: 'Midrange' },
    { frequency: 1280, amplitude: 0.9, label: 'High Mid' },
    { frequency: 2560, amplitude: 0.8, label: 'Presence' },
    { frequency: 5120, amplitude: 0.7, label: 'Brilliance' },
    { frequency: 10240, amplitude: 0.6, label: 'Air' }
  ],
  duration: 5,
  sampleRate: 44100
};

/**
 * Instrument Simulation Signal
 * Mimics typical instrument frequency distributions
 */
export const instrumentSimulation = {
  name: 'Instrument Simulation',
  description: 'Simulated instrument frequency profiles',
  components: [
    // Bass guitar (low frequencies)
    { frequency: 82, amplitude: 1.0, label: 'Bass fundamental' },
    { frequency: 164, amplitude: 0.7, label: 'Bass 2nd harmonic' },
    
    // Rhythm guitar (mid frequencies)
    { frequency: 330, amplitude: 0.8, label: 'Guitar fundamental' },
    { frequency: 660, amplitude: 0.6, label: 'Guitar 2nd harmonic' },
    
    // Vocals (presence range)
    { frequency: 440, amplitude: 1.0, label: 'Vocal fundamental' },
    { frequency: 880, amplitude: 0.5, label: 'Vocal 2nd harmonic' },
    
    // Hi-hat/cymbals (high frequencies)
    { frequency: 5000, amplitude: 0.4, label: 'Cymbal low' },
    { frequency: 10000, amplitude: 0.3, label: 'Cymbal high' }
  ],
  duration: 5,
  sampleRate: 44100
};

/**
 * Voice Simulation Signal
 * Different voice types and formants
 */
export const voiceSimulation = {
  name: 'Voice Types',
  description: 'Simulated human voice frequency profiles',
  components: [
    // Male bass voice
    { frequency: 98, amplitude: 0.9, label: 'Male bass F0' },
    { frequency: 196, amplitude: 0.6, label: 'Male bass H1' },
    
    // Male tenor voice
    { frequency: 147, amplitude: 0.8, label: 'Male tenor F0' },
    { frequency: 294, amplitude: 0.5, label: 'Male tenor H1' },
    
    // Female alto voice
    { frequency: 220, amplitude: 0.9, label: 'Female alto F0' },
    { frequency: 440, amplitude: 0.6, label: 'Female alto H1' },
    
    // Female soprano voice
    { frequency: 330, amplitude: 1.0, label: 'Female soprano F0' },
    { frequency: 660, amplitude: 0.7, label: 'Female soprano H1' },
    
    // Formants (resonances)
    { frequency: 800, amplitude: 0.5, label: 'F1 (vowel)' },
    { frequency: 1200, amplitude: 0.4, label: 'F2 (vowel)' }
  ],
  duration: 4,
  sampleRate: 44100
};

/**
 * Animal Sound Simulation
 * Approximate frequency ranges for different animals
 */
export const animalSimulation = {
  name: 'Animal Sounds',
  description: 'Simulated animal vocalization frequencies',
  components: [
    // Elephant (infrasound + rumble)
    { frequency: 20, amplitude: 0.8, label: 'Elephant rumble' },
    { frequency: 40, amplitude: 0.6, label: 'Elephant overtone' },
    
    // Lion (low roar)
    { frequency: 80, amplitude: 0.9, label: 'Lion roar fundamental' },
    { frequency: 160, amplitude: 0.5, label: 'Lion roar harmonic' },
    
    // Wolf (howl)
    { frequency: 200, amplitude: 0.8, label: 'Wolf howl low' },
    { frequency: 600, amplitude: 0.6, label: 'Wolf howl mid' },
    
    // Frog (croak)
    { frequency: 1000, amplitude: 0.7, label: 'Frog croak' },
    { frequency: 2000, amplitude: 0.4, label: 'Frog overtone' },
    
    // Bird (chirp)
    { frequency: 4000, amplitude: 0.8, label: 'Bird chirp fundamental' },
    { frequency: 8000, amplitude: 0.5, label: 'Bird chirp harmonic' }
  ],
  duration: 5,
  sampleRate: 44100
};

/**
 * Equalizer Test Signal
 * Designed specifically to test equalizer bands
 */
export const equalizerTestSignal = {
  name: 'Equalizer Test',
  description: 'One frequency per typical EQ band',
  components: [
    { frequency: 31.5, amplitude: 1.0, label: '31.5 Hz' },
    { frequency: 63, amplitude: 1.0, label: '63 Hz' },
    { frequency: 125, amplitude: 1.0, label: '125 Hz' },
    { frequency: 250, amplitude: 1.0, label: '250 Hz' },
    { frequency: 500, amplitude: 1.0, label: '500 Hz' },
    { frequency: 1000, amplitude: 1.0, label: '1 kHz' },
    { frequency: 2000, amplitude: 1.0, label: '2 kHz' },
    { frequency: 4000, amplitude: 1.0, label: '4 kHz' },
    { frequency: 8000, amplitude: 1.0, label: '8 kHz' },
    { frequency: 16000, amplitude: 1.0, label: '16 kHz' }
  ],
  duration: 5,
  sampleRate: 44100
};

/**
 * Complex Harmonic Signal
 * Rich harmonic content for testing
 */
export const harmonicSignal = {
  name: 'Harmonic Series',
  description: 'Fundamental at 110Hz with harmonics',
  components: [
    { frequency: 110, amplitude: 1.0, label: 'Fundamental (A2)' },
    { frequency: 220, amplitude: 0.8, label: '2nd harmonic' },
    { frequency: 330, amplitude: 0.6, label: '3rd harmonic' },
    { frequency: 440, amplitude: 0.5, label: '4th harmonic' },
    { frequency: 550, amplitude: 0.4, label: '5th harmonic' },
    { frequency: 660, amplitude: 0.3, label: '6th harmonic' },
    { frequency: 770, amplitude: 0.25, label: '7th harmonic' },
    { frequency: 880, amplitude: 0.2, label: '8th harmonic' }
  ],
  duration: 4,
  sampleRate: 44100
};

/**
 * All preset signals
 */
export const presetSignals = [
  musicalScaleSignal,
  fullRangeSignal,
  instrumentSimulation,
  voiceSimulation,
  animalSimulation,
  equalizerTestSignal,
  harmonicSignal
];

/**
 * Get signal by name
 */
export function getSignalByName(name) {
  return presetSignals.find(signal => signal.name === name);
}

/**
 * Generate description for UI
 */
export function getSignalDescription(signal) {
  const freqList = signal.components.map(c => `${c.frequency}Hz`).join(', ');
  return `${signal.description}\nFrequencies: ${freqList}`;
}

export default {
  musicalScaleSignal,
  fullRangeSignal,
  instrumentSimulation,
  voiceSimulation,
  animalSimulation,
  equalizerTestSignal,
  harmonicSignal,
  presetSignals,
  getSignalByName,
  getSignalDescription
};
