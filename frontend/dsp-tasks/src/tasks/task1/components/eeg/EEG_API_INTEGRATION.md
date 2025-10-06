# EEG API Integration Documentation

## Overview
The EEG viewer has been optimized to work with the new API endpoint that provides channel-by-channel data retrieval. All channel data is now **pre-loaded** before the viewer starts, ensuring smooth visualization without any loading delays.

## API Endpoint

### Base URL
```
https://semilunate-marcene-nonsustainable.ngrok-free.dev
```

### Endpoint
```
GET /upload-eeg?subject_num={subject_num}&channel_num={channel_num}
```

### Parameters
- `subject_num` (integer): Subject identifier extracted from filename
- `channel_num` (integer): Channel number (1 to N)

### Response Format
```json
{
    "number_of_channels": 19,
    "single_channel": [
        158.544921875,
        171.48437499999997,
        168.84765625,
        ...
    ]
}
```

## Implementation Details

### 1. Subject Number Extraction

The system automatically extracts the subject number from the uploaded filename using multiple pattern matching strategies:

**Pattern 1: S prefix** (e.g., `S001.edf`, `S01.set`, `S1.edf`)
```
S001 → subject_num = 1
S023 → subject_num = 23
```

**Pattern 2: Subject/Sub prefix** (e.g., `subject_001.edf`, `sub_05.set`)
```
subject_001 → subject_num = 1
sub_05 → subject_num = 5
```

**Pattern 3: Any number** (e.g., `patient_15.edf`, `recording_003.set`)
```
patient_15 → subject_num = 15
recording_003 → subject_num = 3
```

**Default:** If no number is found, defaults to `subject_num = 1`

### 2. Data Loading Workflow

#### Step 1: File Upload
User uploads an EEG file (.edf or .set)

#### Step 2: Subject Extraction
```javascript
const subjectNum = extractSubjectNumber(file.name);
// e.g., "S002_recording.edf" → subjectNum = 2
```

#### Step 3: First Channel Fetch
```javascript
const response = await fetch(
  `${API_BASE_URL}/upload-eeg?subject_num=2&channel_num=1`
);
const data = await response.json();
const totalChannels = data.number_of_channels; // e.g., 19
```

#### Step 4: Parallel Channel Fetch
Fetches all remaining channels (2 to N) simultaneously:
```javascript
// Fetch channels 2-19 in parallel
const promises = [];
for (let ch = 2; ch <= 19; ch++) {
  promises.push(
    fetch(`${API_BASE_URL}/upload-eeg?subject_num=2&channel_num=${ch}`)
  );
}
const results = await Promise.all(promises);
```

#### Step 5: Data Assembly
```javascript
const allChannelData = {
  ch1: [158.54, 171.48, ...],  // Channel 1 data
  ch2: [145.23, 156.78, ...],  // Channel 2 data
  ch3: [167.89, 172.45, ...],  // Channel 3 data
  // ... all channels
  ch19: [180.12, 165.34, ...]  // Channel 19 data
};
```

#### Step 6: Instant Visualization
All data is ready - viewer starts immediately with no loading delays!

## Code Structure

### Files Modified

#### 1. `RealEEGDataService.js`
**New Methods:**
- `extractSubjectNumber(filename)` - Extracts subject number from filename
- `uploadEEGFile(file)` - Complete workflow: extract, fetch, assemble
  - Returns pre-loaded channel data
  - No separate fetching needed

**Deprecated Methods:**
- `fetchEEGData()` - No longer used (data pre-loaded)

#### 2. `Task1EEG.jsx`
**New State:**
```javascript
const [preloadedChannelData, setPreloadedChannelData] = useState(null);
```

**Enhanced Upload Handler:**
```javascript
const handleSubmit = async (event) => {
  // Upload file
  const response = await RealEEGDataService.uploadEEGFile(uploadedFile);
  
  // Store metadata
  setChannelMetadata({
    channelCount: response.channelCount,
    channelNames: response.channelNames,
    samplingRate: response.samplingRate,
    duration: response.duration,
    sampleCount: response.sampleCount,
    subjectNumber: response.subjectNumber
  });
  
  // Store pre-loaded data
  setPreloadedChannelData({
    channels: response.channels,
    metadata: response.metadata
  });
};
```

#### 3. `MultiChannelEEGViewer.jsx`
**New Props:**
```javascript
const MultiChannelEEGViewer = ({ 
  recordName, 
  channelMetadata, 
  preloadedData  // ← New prop with all channel data
}) => {
  // ...
};
```

**Instant Data Loading:**
```javascript
useEffect(() => {
  if (preloadedData && preloadedData.channels) {
    setEegData({
      channels: preloadedData.channels,
      metadata: preloadedData.metadata,
      stats: calculateStats(preloadedData.channels)
    });
  }
}, [preloadedData]);
```

#### 4. `EEGFileUploader.jsx`
**New Props:**
```javascript
<EEGFileUploader
  loadingProgress={ui.loadingProgress}  // Shows progress messages
/>
```

**Progress Display:**
```html
<span className="progress-text">
  {loadingProgress || 'Processing EEG data...'}
</span>
```

## Performance Benefits

### Before Optimization
1. Upload file
2. Viewer starts
3. User selects view mode
4. **Wait for channel data to load** ⏳
5. Render visualization

### After Optimization
1. Upload file
2. **ALL channels loaded during upload** ⚡
3. Viewer starts with complete data
4. User selects view mode
5. **Instant render** - no waiting! 🎉

### Metrics
- **Loading Time**: 0ms in viewer (pre-loaded during upload)
- **Channel Fetching**: Parallel (19 channels fetch simultaneously)
- **User Experience**: Seamless - no loading spinners in viewer
- **Data Availability**: 100% from the moment viewer opens

## Dynamic Channel Support

The system supports **any number of channels** (not limited to 12 or 19):

```javascript
// Works with any channel count returned by API
if (response.number_of_channels === 32) {
  // Creates ch1, ch2, ..., ch32
}

if (response.number_of_channels === 64) {
  // Creates ch1, ch2, ..., ch64
}
```

### Color System
- Channels 1-12: Predefined colors
- Channels 13+: Dynamically generated colors (cycling through palette)

## Error Handling

### Network Errors
```javascript
try {
  const response = await uploadEEGFile(file);
} catch (error) {
  // Shows user-friendly error message
  setUI({ error: `Failed to upload file: ${error.message}` });
}
```

### Missing Subject Number
```javascript
// Filename: "recording.edf" (no number found)
// Result: Uses default subject_num = 1
console.warn('Could not extract subject number. Using default: 1');
```

### API Timeout
```javascript
// Each channel fetch has built-in timeout
// Failed channels trigger error and stop process
```

## Testing

### Test Cases

**TC1: Standard filename with S prefix**
```
Input: "S002_rest_eyes_closed.edf"
Expected: subject_num = 2
```

**TC2: EEGLAB filename with subject prefix**
```
Input: "subject_015_task1.set"
Expected: subject_num = 15
```

**TC3: Generic filename with number**
```
Input: "patient_007_recording.edf"
Expected: subject_num = 7
```

**TC4: No number in filename**
```
Input: "baseline_recording.edf"
Expected: subject_num = 1 (default)
```

**TC5: Multiple numbers**
```
Input: "S003_session_2.edf"
Expected: subject_num = 3 (first match)
```

## Console Logs

The system provides detailed logging:

```
📊 Processing file: S002_recording.edf
👤 Extracted subject number: 2
🔍 Fetching channel 1 to determine total channels...
✅ Total channels detected: 19
📈 Sample count per channel: 15360
⚡ Fetching all 19 channels in parallel...
✅ All 19 channels loaded successfully!
🎉 Ready to visualize 19 channels with 15360 samples each!
```

## API Response Examples

### Example 1: 19-Channel EEG
```json
{
  "number_of_channels": 19,
  "single_channel": [158.54, 171.48, ..., 180.12]
}
```

### Example 2: 32-Channel System
```json
{
  "number_of_channels": 32,
  "single_channel": [145.23, 156.78, ..., 165.89]
}
```

## Future Enhancements

1. **Progress Bar**: Show channel fetch progress (e.g., "Loading 5/19 channels...")
2. **Caching**: Store loaded data to avoid re-fetching on view changes
3. **Partial Loading**: Start visualizing first N channels while others load
4. **Compression**: Request compressed channel data to reduce bandwidth
5. **Batch API**: Single API call for all channels (if backend supports)

## Troubleshooting

### Issue: "Could not extract subject number"
**Solution**: Rename file to include subject number (e.g., "S001_data.edf")

### Issue: Slow loading with many channels
**Solution**: System fetches in parallel - check network speed and API response time

### Issue: API returns wrong channel count
**Solution**: Verify API response format matches expected structure

### Issue: Missing data in some channels
**Solution**: Check API logs - may indicate incomplete data for subject

## Summary

The optimized EEG system now:
- ✅ **Extracts subject number** from filename automatically
- ✅ **Fetches all channels** during file upload
- ✅ **Loads data in parallel** for maximum speed
- ✅ **Provides instant visualization** with zero loading delays
- ✅ **Supports any number of channels** dynamically
- ✅ **Shows progress updates** to keep user informed
- ✅ **Handles errors gracefully** with clear messages

**Result**: Seamless, professional user experience with fast, reliable EEG data visualization! 🎉
