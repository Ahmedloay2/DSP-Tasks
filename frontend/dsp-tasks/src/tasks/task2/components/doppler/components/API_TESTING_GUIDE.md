# Drone Detector API Testing Guide

## API Endpoint
```
POST https://semilunate-marcene-nonsustainable.ngrok-free.dev/upload-drone-wav
```

## Request Format
- **Method**: POST
- **Content-Type**: multipart/form-data
- **Form Key**: `wav_file`
- **File Type**: .wav audio files

## Response Format
The API returns a plain text string indicating whether a drone was detected or not.

Example responses:
- `"Drone detected"`
- `"No drone detected"`
- Or any string containing the word "drone" (case-insensitive)

## Testing with cURL

### Windows PowerShell:
```powershell
$file = "path\to\your\audio.wav"
curl.exe -X POST `
  -H "ngrok-skip-browser-warning: true" `
  -F "wav_file=@$file" `
  https://semilunate-marcene-nonsustainable.ngrok-free.dev/upload-drone-wav
```

### Command Prompt:
```cmd
curl -X POST ^
  -H "ngrok-skip-browser-warning: true" ^
  -F "wav_file=@path\to\your\audio.wav" ^
  https://semilunate-marcene-nonsustainable.ngrok-free.dev/upload-drone-wav
```

### Linux/Mac:
```bash
curl -X POST \
  -H "ngrok-skip-browser-warning: true" \
  -F "wav_file=@path/to/your/audio.wav" \
  https://semilunate-marcene-nonsustainable.ngrok-free.dev/upload-drone-wav
```

## Implementation Details

### File Validation
The component validates:
1. File format must be `.wav`
2. File size must be less than 50MB

### Detection Logic
The response is parsed to check if it contains the word "drone" (case-insensitive):
- If "drone" is found → Detected = true
- If "drone" is not found → Detected = false

### Error Handling
The component handles:
- Network errors
- API errors (non-200 responses)
- Invalid file formats
- File size limitations
- Missing files

## Features Implemented

### 1. File Upload
- Drag and drop support
- Click to browse
- File validation
- Visual feedback

### 2. Audio Preview
- Built-in audio player
- Shows uploaded file info

### 3. Detection Results
- Clear visual indication (✅ or ❌)
- Large, prominent result display
- Drone icon when detected
- Full API response shown
- File metadata display

### 4. User Experience
- Loading state during API call
- Error messages
- Responsive design
- Dark mode support
- Clear file removal option

## Component Usage

```jsx
import DroneDetector from './components/DroneDetector';

function MyComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDetectionComplete = (result) => {
    console.log('Detection complete:', result);
    // Handle the result
  };

  return (
    <DroneDetector
      onDetectionComplete={handleDetectionComplete}
      isLoading={isLoading}
      setIsLoading={setIsLoading}
      setError={setError}
    />
  );
}
```

## Result Object Structure

```javascript
{
  detected: boolean,           // true if drone detected
  result: string,              // Full API response text
  vehicleType: string,         // "Drone" or "Not a Drone"
  timestamp: string,           // ISO timestamp
  fileName: string,            // Uploaded file name
  fileSize: number            // File size in bytes
}
```

## Troubleshooting

### Common Issues:

1. **CORS Errors**: The ngrok endpoint should handle CORS. If issues persist, check ngrok configuration.

2. **File Format Errors**: Ensure the file is a valid WAV format. Other audio formats are not supported.

3. **Network Timeouts**: Large files may take time to upload. The component shows a loading state.

4. **API Down**: If the ngrok URL is not accessible, verify the backend is running and the ngrok tunnel is active.

## Design Optimizations

The design has been optimized to:
1. **Emphasize Results**: Large, prominent display when detection completes
2. **Visual Clarity**: Clear icons and colors (green for detected, grey for not detected)
3. **Information Hierarchy**: Most important info (result) is displayed first and largest
4. **Responsive**: Works on all screen sizes
5. **Accessible**: Good contrast, clear labels, keyboard navigation support
