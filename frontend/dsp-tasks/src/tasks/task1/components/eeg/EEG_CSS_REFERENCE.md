# EEG vs ECG CSS Class Reference

## Quick Reference Guide

This document provides a quick lookup for CSS class names used in EEG vs ECG components to prevent confusion and ensure proper styling.

---

## 🧠 EEG Component Classes (`task1-eeg-*`)

### Main Container & Layout
```css
.task1-eeg-container          /* Main EEG page container */
.task1-eeg-header             /* Header section */
.task1-eeg-viewer-wrapper     /* Viewer container after upload */
```

### File Upload Form
```css
.task1-eeg-upload-section     /* Upload form container */
.task1-eeg-form               /* Form element */
.task1-eeg-inputs-container   /* Input fields container */
.task1-eeg-input-group        /* Individual input group */
.task1-eeg-submit-btn         /* Submit button */
```

### Form Elements
```css
.task1-eeg-input-group label
.task1-eeg-input-group input[type="file"]
.task1-eeg-input-group input[type="file"]::file-selector-button
.task1-eeg-input-group input[type="file"]:hover
.task1-eeg-input-group input[type="file"]:disabled
```

### Button States
```css
.task1-eeg-submit-btn                /* Base button */
.task1-eeg-submit-btn::before        /* Button effect */
.task1-eeg-submit-btn:hover          /* Hover state */
.task1-eeg-submit-btn:active         /* Active state */
.task1-eeg-submit-btn:disabled       /* Disabled state */
```

---

## ❤️ ECG Component Classes (`task1-ecg-*`)

### Main Container & Layout
```css
.task1-ecg-container          /* Main ECG page container */
.task1-ecg-header             /* Header section */
.task1-ecg-viewer-wrapper     /* Viewer container after upload */
```

### File Upload Form
```css
.task1-ecg-upload-section     /* Upload form container */
.task1-ecg-form               /* Form element */
.task1-ecg-inputs-container   /* Input fields container */
.task1-ecg-input-group        /* Individual input group */
.task1-ecg-submit-btn         /* Submit button */
```

### Form Elements
```css
.task1-ecg-input-group label
.task1-ecg-input-group input[type="file"]
.task1-ecg-input-group input[type="file"]::file-selector-button
.task1-ecg-input-group input[type="file"]:hover
.task1-ecg-input-group input[type="file"]:disabled
```

### Button States
```css
.task1-ecg-submit-btn                /* Base button */
.task1-ecg-submit-btn::before        /* Button effect */
.task1-ecg-submit-btn:hover          /* Hover state */
.task1-ecg-submit-btn:active         /* Active state */
.task1-ecg-submit-btn:disabled       /* Disabled state */
```

---

## 🔍 Quick Search & Replace

### Converting ECG to EEG:
```bash
Find:    task1-ecg-
Replace: task1-eeg-
```

### Converting EEG to ECG:
```bash
Find:    task1-eeg-
Replace: task1-ecg-
```

---

## 📦 Shared Classes (Common to Both)

These classes are used by both EEG and ECG components but are component-agnostic:

### Common UI Elements
```css
.back-link                    /* Navigation back link */
.error-banner                 /* Error display */
.error-icon                   /* Error icon */
.error-close                  /* Error close button */
.record-info-bar             /* Record information bar */
.record-name                 /* Record name display */
.channel-info                /* Channel count display */
.reset-btn                   /* Reset button */
.file-selected               /* File selected indicator */
.file-name                   /* File name display */
.file-size                   /* File size display */
.file-help-text              /* Help text under inputs */
```

### Viewer Components (Shared Structure)
```css
.multi-channel-viewer        /* Main viewer container */
.viewer-main-header          /* Viewer header */
.viewer-main-title           /* Viewer title */
.data-info                   /* Data information */
.info-badge                  /* Information badge */
.view-mode-selector          /* Mode selector */
.view-mode-btn               /* Mode button */
.viewer-content              /* Content area */
.viewer-sidebar              /* Sidebar controls */
.viewer-main                 /* Main viewer area */
```

---

## 🎯 Usage Guidelines

### For EEG Development:
1. Always use `task1-eeg-*` prefix for new EEG-specific styles
2. Import from `eeg/Components/UI/EEGFileUploader.css`
3. Reference EEG-specific class names in JSX

### For ECG Development:
1. Always use `task1-ecg-*` prefix for new ECG-specific styles
2. Import from `ecg/Components/UI/ECGFileUploader.css`
3. Reference ECG-specific class names in JSX

### For Shared Components:
1. Use generic class names without prefix
2. Define in shared/common CSS files
3. Avoid EEG/ECG-specific styling

---

## ⚠️ Common Pitfalls

### ❌ Don't Do This:
```jsx
// Mixing EEG and ECG classes
<div className="task1-ecg-container"> {/* ECG class */}
  <EEGFileUploader />                 {/* EEG component */}
</div>
```

### ✅ Do This Instead:
```jsx
// Using matching classes
<div className="task1-eeg-container"> {/* EEG class */}
  <EEGFileUploader />                 {/* EEG component */}
</div>
```

---

## 🔧 Maintenance Tips

1. **Search Before Creating**: Always check if a class exists before creating new ones
2. **Consistent Naming**: Follow the established `task1-{type}-{component}` pattern
3. **Documentation**: Update this file when adding new classes
4. **Code Review**: Verify correct prefix usage in pull requests
5. **Testing**: Test both EEG and ECG pages after style changes

---

## 📊 Class Count Summary

- **EEG-specific classes**: ~30 classes with `task1-eeg-` prefix
- **ECG-specific classes**: ~30 classes with `task1-ecg-` prefix
- **Shared classes**: ~20 generic classes
- **Total**: ~80 unique CSS classes

---

**File Location**: `/src/tasks/task1/components/eeg/EEG_CSS_REFERENCE.md`  
**Last Updated**: October 6, 2025
