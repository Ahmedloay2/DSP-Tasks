/**
 * Mock SAR API Service
 * 
 * Simulates a backend API for SAR image analysis.
 * In production, this would connect to a real machine learning service
 * that processes SAR imagery using algorithms like:
 * - Threshold-based classification
 * - Machine learning classifiers (Random Forest, SVM, Neural Networks)
 * - Deep learning models (U-Net, SegNet for semantic segmentation)
 */

class MockSARApiService {
  /**
   * Analyzes a SAR image to estimate water and earth percentages
   * @param {File} imageFile - The SAR image file to analyze
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeSARImage(imageFile) {
    // Simulate API delay
    await this.delay(2000);

    // In real implementation, we would:
    // 1. Send image to backend API
    // 2. Backend processes the image using ML models
    // 3. Return classification results

    // For mock purposes, generate realistic-looking random results
    return this.generateMockAnalysis(imageFile);
  }

  /**
   * Generates mock analysis results
   * @param {File} imageFile - The image file
   * @returns {Object} Mock analysis results
   */
  generateMockAnalysis(imageFile) {
    // Create an image element to get dimensions
    const reader = new FileReader();
    
    return new Promise((resolve) => {
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Generate realistic percentages
          // SAR images of coastal areas typically show 20-60% water coverage
          const waterPercentage = this.generateRealisticPercentage(20, 60);
          const earthPercentage = 100 - waterPercentage;
          
          // Simulate processing time based on image size
          const pixelCount = img.width * img.height;
          const processingTime = 1.5 + (pixelCount / 1000000) * 0.5; // Scales with image size

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
              polarization: 'VV', // Vertical-Vertical polarization
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
    // Use a weighted random to create more realistic distributions
    const random1 = Math.random();
    const random2 = Math.random();
    const average = (random1 + random2) / 2; // Creates a more centered distribution
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
    // Typical SAR backscatter values range from -30 to 0 dB
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

  /**
   * Validates image before processing
   * @param {File} imageFile - The image file to validate
   * @returns {Object} Validation result
   */
  validateImage(imageFile) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/tiff', 'image/jpg'];

    if (!imageFile) {
      return { valid: false, error: 'No image provided' };
    }

    if (imageFile.size > maxSize) {
      return { valid: false, error: 'Image size exceeds 10MB limit' };
    }

    if (!allowedTypes.includes(imageFile.type)) {
      return { valid: false, error: 'Invalid image format. Supported: JPEG, PNG, TIFF' };
    }

    return { valid: true };
  }

  /**
   * Gets available SAR analysis algorithms
   * @returns {Array<Object>} List of available algorithms
   */
  getAvailableAlgorithms() {
    return [
      {
        id: 'threshold',
        name: 'Threshold-based Classification',
        description: 'Simple intensity-based classification',
        accuracy: 0.75
      },
      {
        id: 'ml_rf',
        name: 'Random Forest Classifier',
        description: 'Machine learning ensemble method',
        accuracy: 0.85
      },
      {
        id: 'dl_unet',
        name: 'U-Net Deep Learning',
        description: 'Semantic segmentation neural network',
        accuracy: 0.92
      }
    ];
  }

  /**
   * Simulates fetching real SAR data info
   * @returns {Object} Information about SAR satellites and data
   */
  getSARDataInfo() {
    return {
      satellites: [
        { name: 'Sentinel-1', agency: 'ESA', frequency: 'C-band', resolution: '5-20m' },
        { name: 'RADARSAT-2', agency: 'CSA', frequency: 'C-band', resolution: '3-100m' },
        { name: 'TerraSAR-X', agency: 'DLR', frequency: 'X-band', resolution: '1-16m' },
        { name: 'ALOS-2', agency: 'JAXA', frequency: 'L-band', resolution: '3-10m' }
      ],
      applications: [
        'Flood monitoring',
        'Ship detection',
        'Ice monitoring',
        'Land cover classification',
        'Deformation mapping',
        'Agriculture monitoring'
      ]
    };
  }
}

// Export singleton instance
export const mockSARApiService = new MockSARApiService();
