/**
 * Mock SAR API Service
 * 
 * Simulates a backend API for SAR image analysis.
 */

class MockSARService {
  /**
   * Analyzes a SAR image to estimate water and earth percentages
   * @param {File} imageFile - The SAR image file to analyze
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeSARImage(imageFile) {
    // Simulate API delay
    await this.delay(2000);

    return this.generateMockAnalysis(imageFile);
  }

  /**
   * Generates mock analysis results
   * @param {File} imageFile - The image file
   * @returns {Object} Mock analysis results
   */
  generateMockAnalysis(imageFile) {
    const reader = new FileReader();
    
    return new Promise((resolve) => {
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Generate realistic percentages
          const waterPercentage = this.generateRealisticPercentage(20, 60);
          const earthPercentage = 100 - waterPercentage;
          
          // Simulate processing time based on image size
          const pixelCount = img.width * img.height;
          const processingTime = 1.5 + (pixelCount / 1000000) * 0.5;

          resolve({
            waterPercentage,
            earthPercentage,
            imageWidth: img.width,
            imageHeight: img.height,
            processingTime,
            confidence: this.generateConfidence(),
            algorithm: 'Threshold-based Classification with Machine Learning',
            timestamp: new Date().toISOString(),
            additionalMetrics: {
              meanBackscatter: this.generateBackscatter(),
              texture: this.generateTexture(),
              polarization: 'VV',
            }
          });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(imageFile);
    });
  }

  /**
   * Generates a realistic percentage within a range
   * @param {number} min - Minimum percentage
   * @param {number} max - Maximum percentage
   * @returns {number} Random percentage
   */
  generateRealisticPercentage(min, max) {
    const random1 = Math.random();
    const random2 = Math.random();
    const average = (random1 + random2) / 2;
    return min + average * (max - min);
  }

  /**
   * Generates a confidence score
   * @returns {number} Confidence between 0.75 and 0.98
   */
  generateConfidence() {
    return 0.75 + Math.random() * 0.23;
  }

  /**
   * Generates mock backscatter coefficient
   * @returns {number} Backscatter in dB
   */
  generateBackscatter() {
    return -30 + Math.random() * 30;
  }

  /**
   * Generates texture measure
   * @returns {string} Texture classification
   */
  generateTexture() {
    const textures = ['Smooth', 'Moderate', 'Rough', 'Very Rough'];
    return textures[Math.floor(Math.random() * textures.length)];
  }

  /**
   * Simulates API delay
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const mockSARService = new MockSARService();
export default MockSARService;
