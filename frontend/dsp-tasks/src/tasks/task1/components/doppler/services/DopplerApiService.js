/**
 * Real Doppler API Service
 * Integrates with the actual Doppler sound generation API
 */
export class DopplerApiService {
    static API_ENDPOINT = 'https://semilunate-marcene-nonsustainable.ngrok-free.dev/generate-doppler-sound';
    static currentSession = null;
    static generatedAudio = null;

    /**
     * Generate Doppler shifted audio using the real API
     * @param {Object} params - Generation parameters
     * @param {number} params.source_velocity - Velocity of source in m/s
     * @param {number} params.source_freq - Original frequency in Hz
     * @param {number} params.normal_distance - Normal distance in meters
     * @param {number} params.half_simulation_duration - Half simulation duration in seconds
     * @returns {Promise<Object>} Generated audio data
     */
    static async generateDopplerSound(params) {
        const {
            source_velocity = 50,
            source_freq = 550,
            normal_distance = 1,
            half_simulation_duration = 3
        } = params;

        // Validate parameters
        this.validateParameters({
            source_velocity,
            source_freq,
            normal_distance,
            half_simulation_duration
        });

        try {
            // Build URL with query parameters
            const url = new URL(this.API_ENDPOINT);
            url.searchParams.append('source_velocity', source_velocity);
            url.searchParams.append('source_freq', source_freq);
            url.searchParams.append('normal_distance', normal_distance);
            url.searchParams.append('half_simulation_duration', half_simulation_duration);

            // Make GET request to API
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: {
                    'Accept': 'audio/wav',
                    'ngrok-skip-browser-warning': 'true' // Skip ngrok warning page
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorText}`);
            }

            // Get the WAV file blob from response
            const wavBlob = await response.blob();
            
            // Verify it's actually a WAV file
            if (!wavBlob.type.includes('audio') && wavBlob.type !== 'application/octet-stream') {
                console.warn('Response may not be audio:', wavBlob.type);
            }

            // Create a new blob with correct MIME type if needed
            const audioBlob = wavBlob.type.includes('audio') 
                ? wavBlob 
                : new Blob([wavBlob], { type: 'audio/wav' });

            // Create object URL for playback
            const audioUrl = URL.createObjectURL(audioBlob);

            // Generate session ID
            const sessionId = `doppler_session_${Date.now()}`;
            
            // Calculate total duration
            const totalDuration = half_simulation_duration * 2;

            // Store the generated audio
            this.currentSession = sessionId;
            this.generatedAudio = {
                sessionId,
                audioUrl,
                blob: audioBlob,
                metadata: {
                    sourceFrequency: source_freq,
                    sourceVelocity: source_velocity,
                    normalDistance: normal_distance,
                    halfDuration: half_simulation_duration,
                    totalDuration,
                    timestamp: new Date().toISOString(),
                    blobSize: audioBlob.size,
                    blobType: audioBlob.type
                }
            };

            return {
                success: true,
                sessionId,
                audioUrl,
                blob: audioBlob,
                metadata: this.generatedAudio.metadata
            };

        } catch (error) {
            console.error('Doppler API Error:', error);
            
            // Provide user-friendly error messages
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Network error: Unable to reach the Doppler API. Please check your internet connection.');
            } else if (error.message.includes('CORS')) {
                throw new Error('CORS error: The API server may need to enable CORS headers.');
            } else {
                throw new Error(`Audio generation failed: ${error.message}`);
            }
        }
    }

    /**
     * Validate input parameters
     * @param {Object} params - Parameters to validate
     * @throws {Error} If parameters are invalid
     */
    static validateParameters(params) {
        const {
            source_velocity,
            source_freq,
            normal_distance,
            half_simulation_duration
        } = params;

        if (source_freq < 100 || source_freq > 2000) {
            throw new Error('Source frequency must be between 100 and 2000 Hz');
        }

        if (source_velocity < 0 || source_velocity > 100) {
            throw new Error('Source velocity must be between 0 and 100 m/s');
        }

        if (normal_distance <= 0) {
            throw new Error('Normal distance must be greater than 0 meters');
        }

        if (half_simulation_duration <= 0 || half_simulation_duration > 10) {
            throw new Error('Half simulation duration must be between 0 and 10 seconds');
        }
    }

    /**
     * Download the generated audio file
     * @param {string} filename - Name for the downloaded file
     */
    static downloadAudio(filename = 'doppler_sound.wav') {
        if (!this.generatedAudio || !this.generatedAudio.blob) {
            throw new Error('No audio available to download');
        }

        try {
            // Create download link
            const url = URL.createObjectURL(this.generatedAudio.blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            return true;
        } catch (error) {
            console.error('Download error:', error);
            throw new Error(`Download failed: ${error.message}`);
        }
    }

    /**
     * Get current session metadata
     * @returns {Object|null} Current session metadata or null
     */
    static getCurrentSession() {
        return this.generatedAudio;
    }

    /**
     * Clear current session
     */
    static clearSession() {
        if (this.generatedAudio && this.generatedAudio.audioUrl) {
            URL.revokeObjectURL(this.generatedAudio.audioUrl);
        }
        this.currentSession = null;
        this.generatedAudio = null;
    }

    /**
     * Test API connectivity
     * @returns {Promise<boolean>} True if API is reachable
     */
    static async testConnection() {
        try {
            const url = new URL(this.API_ENDPOINT);
            url.searchParams.append('source_velocity', 50);
            url.searchParams.append('source_freq', 550);
            url.searchParams.append('normal_distance', 1);
            url.searchParams.append('half_simulation_duration', 1);
            
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'audio/wav',
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            return response.ok;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }
}

export default DopplerApiService;