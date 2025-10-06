/**
 * Mock Doppler Shift API Service
 * Simulates Doppler effect sound generation and analysis
 */
export class MockDopplerApiService {
    static currentSession = null;
    static audioContext = null;
    static generatedAudio = null;

    /**
     * Initialize audio context
     */
    static initializeAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }

    /**
     * Generate Doppler shifted audio based on parameters
     * @param {Object} params - Generation parameters
     * @param {number} params.sourceFrequency - Original frequency in Hz
     * @param {number} params.sourceVelocity - Velocity of source in m/s
     * @param {number} params.duration - Duration in seconds
     * @returns {Promise<Object>} Generated audio data
     */
    static async generateDopplerAudio(params) {
        const {
            sourceFrequency = 440,
            sourceVelocity = 0,
            duration = 3
        } = params;

        const soundSpeed = 343; // Fixed speed of sound

        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 800));

            // Calculate Doppler shifted frequency (simplified formula)
            // f' = f * v / (v + v_source)
            const dopplerFrequency = sourceFrequency * soundSpeed / (soundSpeed + sourceVelocity);

            // Generate audio buffer
            const audioContext = this.initializeAudioContext();
            const sampleRate = audioContext.sampleRate;
            const bufferLength = sampleRate * duration;
            const buffer = audioContext.createBuffer(1, bufferLength, sampleRate);
            const channelData = buffer.getChannelData(0);

            // Generate sine wave with Doppler effect
            for (let i = 0; i < bufferLength; i++) {
                const time = i / sampleRate;
                // Apply gradual frequency change to simulate moving source
                const currentFreq = sourceFrequency + 
                    (dopplerFrequency - sourceFrequency) * (time / duration);
                
                // Add envelope to make it sound more natural
                const envelope = Math.exp(-time * 0.3);
                channelData[i] = Math.sin(2 * Math.PI * currentFreq * time) * envelope * 0.3;
            }

            // Convert to WAV blob
            const wavBlob = this.audioBufferToWav(buffer);
            const audioUrl = URL.createObjectURL(wavBlob);

            const sessionId = `doppler_session_${Date.now()}`;
            this.currentSession = sessionId;
            this.generatedAudio = {
                sessionId,
                audioUrl,
                blob: wavBlob,
                metadata: {
                    sourceFrequency,
                    dopplerFrequency: parseFloat(dopplerFrequency.toFixed(2)),
                    sourceVelocity,
                    duration,
                    soundSpeed,
                    frequencyShift: parseFloat((dopplerFrequency - sourceFrequency).toFixed(2)),
                    percentageChange: parseFloat((((dopplerFrequency - sourceFrequency) / sourceFrequency) * 100).toFixed(2))
                }
            };

            return {
                success: true,
                sessionId,
                audioUrl,
                metadata: this.generatedAudio.metadata
            };

        } catch (error) {
            throw new Error(`Audio generation failed: ${error.message}`);
        }
    }

    /**
     * Analyze uploaded audio file to determine frequency and velocity
     * @param {File} audioFile - MP3 audio file
     * @returns {Promise<Object>} Analysis results
     */
    static async analyzeAudioFile(audioFile) {
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // In a real implementation, this would use FFT and signal processing
            // For mock, we'll generate realistic-looking results
            
            const mockResults = this.generateMockAnalysisResults();
            
            const sessionId = `analysis_session_${Date.now()}`;
            
            return {
                success: true,
                sessionId,
                fileName: audioFile.name,
                fileSize: audioFile.size,
                analysis: mockResults
            };

        } catch (error) {
            throw new Error(`Audio analysis failed: ${error.message}`);
        }
    }

    /**
     * Generate mock analysis results
     */
    static generateMockAnalysisResults() {
        // Generate realistic random values
        const baseFrequency = 300 + Math.random() * 500; // 300-800 Hz
        const velocity = -30 + Math.random() * 60; // -30 to +30 m/s
        
        return {
            estimatedSourceFrequency: parseFloat(baseFrequency.toFixed(1)),
            estimatedSourceVelocity: parseFloat(velocity.toFixed(1)),
            confidence: 0.80 + Math.random() * 0.15, // 80-95%
            duration: 2 + Math.random() * 4, // 2-6 seconds
            analysisMethod: 'FFT + Peak Detection',
            qualityScore: 0.85 + Math.random() * 0.10
        };
    }

    /**
     * Convert AudioBuffer to WAV blob
     */
    static audioBufferToWav(buffer) {
        const length = buffer.length;
        const arrayBuffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(arrayBuffer);
        const channelData = buffer.getChannelData(0);

        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, buffer.sampleRate, true);
        view.setUint32(28, buffer.sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * 2, true);

        // Convert float samples to 16-bit PCM
        let offset = 44;
        for (let i = 0; i < length; i++) {
            const sample = Math.max(-1, Math.min(1, channelData[i]));
            view.setInt16(offset, sample * 0x7FFF, true);
            offset += 2;
        }

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    /**
     * Download generated audio file
     */
    static downloadAudio(filename = 'doppler_audio.wav') {
        if (!this.generatedAudio) {
            throw new Error('No audio available for download');
        }

        const link = document.createElement('a');
        link.href = this.generatedAudio.audioUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Clean up resources
     */
    static cleanup() {
        if (this.generatedAudio?.audioUrl) {
            URL.revokeObjectURL(this.generatedAudio.audioUrl);
        }
        this.generatedAudio = null;
        this.currentSession = null;
    }

    /**
     * Get current session data
     */
    static getCurrentSession() {
        return this.generatedAudio;
    }
}

export default MockDopplerApiService;