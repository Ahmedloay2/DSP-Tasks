# EEG API Integration - Quick Testing Guide

## Quick Start

### 1. Prepare Test Files
Create test files with subject numbers in the filename:
- `S001_test.edf` → Will query subject_num=1
- `S002_recording.set` → Will query subject_num=2
- `subject_015_data.edf` → Will query subject_num=15

### 2. Upload File
1. Click "Choose File" in the EEG viewer
2. Select your test file (e.g., `S002_test.edf`)
3. Click "Upload EEG File"

### 3. Watch Console Logs
Open browser console (F12) to see:
```
📊 Processing file: S002_test.edf
👤 Extracted subject number: 2
🔍 Fetching channel 1 to determine total channels...
✅ Total channels detected: 19
📈 Sample count per channel: 15360
⚡ Fetching all 19 channels in parallel...
✅ All 19 channels loaded successfully!
🎉 Ready to visualize 19 channels with 15360 samples each!
```

### 4. Verify Data
Check that the viewer shows:
- ✅ Correct number of channels (e.g., "Channels: 19")
- ✅ All channels listed in selector
- ✅ Data renders immediately without loading spinners

## API Endpoint Testing

### Manual API Test
```bash
# Test endpoint with curl
curl "https://semilunate-marcene-nonsustainable.ngrok-free.dev/upload-eeg?subject_num=2&channel_num=1" \
  -H "ngrok-skip-browser-warning: true"

# Expected Response:
{
  "number_of_channels": 19,
  "single_channel": [158.544921875, 171.48437499999997, ...]
}
```

### Browser Console Test
```javascript
// Test API from browser console
fetch('https://semilunate-marcene-nonsustainable.ngrok-free.dev/upload-eeg?subject_num=2&channel_num=1', {
  headers: { 'ngrok-skip-browser-warning': 'true' }
})
  .then(r => r.json())
  .then(d => console.log('Channel count:', d.number_of_channels));
```

## Test Scenarios

### Scenario 1: Standard Upload (19 channels)
**File**: `S002_recording.edf`
**Expected**:
- Subject: 2
- Channels: 19
- Loading: ~2-3 seconds for all channels
- Result: Immediate visualization

### Scenario 2: Different Subject Number
**File**: `S005_test.set`
**Expected**:
- Subject: 5
- Channels: 19 (or different based on subject)
- All channels loaded

### Scenario 3: No Subject Number in Filename
**File**: `recording.edf`
**Expected**:
- Subject: 1 (default)
- Warning in console
- Channels: 19
- Successful load

### Scenario 4: Complex Filename
**File**: `patient_007_session_2_eyes_closed.edf`
**Expected**:
- Subject: 7 (first number found)
- Channels: 19
- Successful load

## Expected UI Behavior

### During Upload (2-3 seconds)
```
[Loading Spinner]
"Analyzing file and fetching channel data..."
```

Progress bar animates

### After Upload (Instant)
```
Record Name: S002_recording
Channels: 19

[Channel Selector showing ch1-ch19]
[Viewer with all data ready]
```

No additional loading when:
- Switching view modes
- Selecting/deselecting channels
- Playing/pausing
- Changing zoom level

## Troubleshooting Tests

### Test 1: Network Error
**Simulate**: Disconnect internet before upload
**Expected**: Error message "Failed to upload file: Failed to fetch"

### Test 2: Invalid Subject Number
**File**: `S999_test.edf` (subject doesn't exist on server)
**Expected**: API error with status code (404 or 500)

### Test 3: Malformed API Response
**Expected**: Error caught and displayed to user

### Test 4: Partial Channel Failure
**Expected**: If any channel fails, entire process fails with error

## Performance Benchmarks

### Target Performance
- File upload: < 1s
- Channel fetching (19 channels): < 3s
- Data assembly: < 0.5s
- Viewer initialization: < 0.1s
- **Total time to visualization**: < 5s

### Actual Measurements (to be filled during testing)
```
Test Run 1:
- Subject: 2
- Channels: 19
- Upload time: _____s
- Channel fetch: _____s
- Total time: _____s

Test Run 2:
- Subject: 5
- Channels: 19
- Upload time: _____s
- Channel fetch: _____s
- Total time: _____s
```

## Validation Checklist

After implementing, verify:

- [ ] Subject number extracted correctly from filename
- [ ] All channels fetched in parallel
- [ ] Console shows progress messages
- [ ] No loading spinners in viewer after initial upload
- [ ] Channel selector shows all channels
- [ ] All view modes work immediately (Continuous, XOR, Polar, Recurrence)
- [ ] Data displays correctly in all channels
- [ ] Playback works smoothly
- [ ] Reset button clears data and allows new upload
- [ ] Error messages display for failures
- [ ] Works with different subject numbers
- [ ] Works with different filename patterns
- [ ] Handles missing subject number (defaults to 1)

## Known Limitations

1. **Filename must contain subject number** or defaults to 1
2. **All channels must load successfully** - no partial data support
3. **No progress indicator** for individual channels (shows "all or nothing")
4. **No caching** - re-upload required for same file
5. **Network dependent** - slow network = slow loading

## Success Criteria

✅ **Feature Complete** when:
1. Subject number extraction works for all filename patterns
2. All channels load before viewer starts
3. Viewer renders instantly without API calls
4. Console logging is clear and helpful
5. Error handling is robust
6. User experience is smooth and professional

## Next Steps

After successful testing:
1. Document any new filename patterns needed
2. Optimize channel fetching if > 5s for 19 channels
3. Add progress bar showing "Loading X/N channels"
4. Implement data caching for faster re-visualization
5. Add subject number input field (manual override)
