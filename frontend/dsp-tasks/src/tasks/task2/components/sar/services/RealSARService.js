/**
 * Real SAR API Service
 * 
 * Connects to the actual SAR image analysis API endpoint
 * Endpoint: https://semilunate-marcene-nonsustainable.ngrok-free.dev/upload-sar-image
 */

const API_BASE_URL = 'https://semilunate-marcene-nonsustainable.ngrok-free.dev';

class RealSARService {
  /**
   * Analyzes a SAR image using the real API
   * @param {File} imageFile - The SAR image file to analyze
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeSARImage(imageFile) {
    try {
      // Create FormData to send the image
      const formData = new FormData();
      formData.append('sar_image', imageFile);

      // Send request to API
      const response = await fetch(`${API_BASE_URL}/upload-sar-image`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true' // Skip ngrok warning page
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Parse and format the response
      return this.formatAnalysisResult(data, imageFile);
    } catch (error) {
      console.error('Failed to analyze SAR image:', error);
      throw error;
    }
  }

  /**
   * Format API response to match expected structure
   * @param {Object} apiResponse - Raw API response
   * @param {File} imageFile - Original image file
   * @returns {Promise<Object>} Formatted analysis results
   */
  async formatAnalysisResult(apiResponse, imageFile) {
    // Get image dimensions
    const dimensions = await this.getImageDimensions(imageFile);
    
    // Parse percentages from API response (format: "44.42%")
    const landPercentage = parseFloat(apiResponse.land.replace('%', ''));
    const waterPercentage = parseFloat(apiResponse.water.replace('%', ''));

    return {
      landPercentage,
      waterPercentage,
      imageWidth: dimensions.width,
      imageHeight: dimensions.height,
      fileName: imageFile.name,
      fileSize: imageFile.size,
      timestamp: new Date().toISOString(),
      // Raw API response
      rawResponse: apiResponse
    };
  }

  /**
   * Get image dimensions from file
   * @param {File} imageFile - Image file
   * @returns {Promise<Object>} Width and height
   */
  getImageDimensions(imageFile) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            width: img.width,
            height: img.height
          });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(imageFile);
    });
  }

  /**
   * Validate image file before upload
   * @param {File} file - File to validate
   * @returns {Object} Validation result
   */
  validateImageFile(file) {
    const errors = [];

    // Check file type
    if (!file.type.startsWith('image/')) {
      errors.push('File must be an image');
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('File size must be less than 10MB');
    }

    // Check file extension
    const validExtensions = ['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.bmp'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      errors.push('File must be a valid image format (JPG, PNG, TIF, BMP)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const realSARService = new RealSARService();
export default RealSARService;
