/**
 * ECG Classification Service
 * Fetches ECG classification/detection results from the backend API
 */

const API_BASE_URL = 'https://semilunate-marcene-nonsustainable.ngrok-free.dev';

class ECGClassificationService {
  /**
   * Fetch ECG classification for a given record
   * @param {string} recordName - Name of the ECG record to classify
   * @returns {Promise<Object>} Classification results
   */
  static async fetchClassification(recordName = 'example') {
  try {
    const url = `${API_BASE_URL}/ecg_classification?name=${encodeURIComponent(recordName)}`;
    console.log('Fetching classification from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true' 
      },
    });

    // Check if the response is okay (status in 200-299 range)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get the Content-Type of the response
    const contentType = response.headers.get('content-type');
    
    // Check if the response is actually JSON before parsing
    if (!contentType || !contentType.includes('application/json')) {
      // If it's not JSON, get the response as text to see what it is
      const responseText = await response.text();
      console.error('Expected JSON but got:', contentType);
      console.error('Response text start:', responseText.substring(0, 200)); // Log first 200 chars
      
      throw new Error(`Server returned ${contentType || 'unknown type'} instead of JSON. The endpoint may be misconfigured.`);
    }

    // If we get here, it's safe to parse as JSON
    const jsonData = await response.json();
    console.log('Received JSON data:', jsonData);

    return {
      success: true,
      data: jsonData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching ECG classification:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

  /**
   * Parse classification string into structured data
   * @param {string} classificationString - Raw classification string from API
   * @returns {Object} Parsed classification data
   */
  static parseClassificationString(classificationData) {
  console.log('Parsing classification data:', classificationData);
  
  if (!classificationData) {
    return {
      className: 'Unknown',
      confidence: 0,
      isNormal: false,
      rawText: 'No data received'
    };
  }

  // Access properties directly from the object
  // Note: The API uses "confidience" (typo) instead of "confidence"
  const className = classificationData.predicted_class || 'Unknown';
  const confidenceStr = classificationData.confidience || '0%'; // Note the typo
  const confidence = parseFloat(confidenceStr) || 0;

  // Determine if normal based on class name
  const isNormal = className.toLowerCase().includes('normal') || 
                  className.toLowerCase().includes('healthy');
  
  return {
    className,
    confidence,
    isNormal,
    rawText: JSON.stringify(classificationData),
    displayText: `Predicted class: ${className} (Confidence: ${confidence}%)`
  };
}
}
export default ECGClassificationService;