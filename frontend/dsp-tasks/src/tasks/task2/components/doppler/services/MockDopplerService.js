/**
 * Mock Doppler Shift API Service
 * Simulates Doppler effect sound generation and analysis
 */
export class MockDopplerService {
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
     * Analyze uploaded audio file to determine frequency and velocity
     * @param {File} audioFile - MP3 audio file
     * @returns {Promise<Object>} Analysis results
     */
    static async analyzeAudioFile(audioFile) {
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Generate realistic-looking results
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
}

export default MockDopplerService;
