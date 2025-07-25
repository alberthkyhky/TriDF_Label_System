# Backend Media Caption Integration

## Overview
Updated the frontend to handle backend responses where `_sample_local_media_for_task` returns media files with keys as captions, providing better context for media sources in the labeling interface.

## Expected Backend Response Format

### Method 1: Enhanced MediaFile Objects (Recommended)
```javascript
{
  "id": "question_123",
  "task_id": "task_456",
  "question_text": "Compare the audio quality",
  "media_files": [
    {
      "filename": "output.wav",
      "file_path": "/path/to/output.wav",
      "media_type": "audio",
      "key": "output_wav",           // Backend provides the source key
      "caption": "Generated Output", // Alternative to key
      "file_size": 1024000,
      "duration_seconds": 5.2
    },
    {
      "filename": "MM6_MAN_0026_1of2.wav", 
      "file_path": "/path/to/other.wav",
      "media_type": "audio",
      "key": "reference_wav",
      "caption": "Reference Audio",
      "file_size": 2048000,
      "duration_seconds": 8.1
    }
  ]
}
```

### Method 2: Raw Data Processing (Legacy Support)
```javascript
{
  "id": "question_123",
  "raw_data": {
    "index": "3",
    "tag": "EMIME/XTTS/pair_0003", 
    "output_wav": "/path/to/output.wav",
    "other_wav": "/path/to/other.wav"
  }
}
```

## Frontend Processing Logic

### 1. **Enhanced API Processing** (`src/services/api.ts`)

The `getTaskQuestionsWithMedia()` method now handles multiple formats:

```typescript
// Priority order:
1. Enhanced media_files with key/caption fields
2. Raw data processing (legacy)
3. Original media_files format (fallback)

// Processing logic:
if (question.media_files && Array.isArray(question.media_files)) {
  // Check for key/caption fields from backend
  const enhancedMediaFiles = question.media_files.map((mediaFile) => {
    if (mediaFile.key || mediaFile.caption) {
      return {
        ...mediaFile,
        key: mediaFile.key || mediaFile.caption,
        display_name: formatKeyToDisplayName(mediaFile.key || mediaFile.caption)
      };
    }
    return mediaFile;
  });
}
```

### 2. **Updated MediaFile Interface**

Added support for caption field:
```typescript
interface MediaFile {
  filename: string;
  file_path: string;
  media_type: 'image' | 'video' | 'audio';
  key?: string;           // Original key from data
  caption?: string;       // Alternative caption from backend
  display_name?: string;  // Human-readable name
  // ... other fields
}
```

## UI Enhancements

### 1. **Dual Caption Display**

**Top Overlay**: Human-readable display name
- Converted from key/caption (e.g., "output_wav" → "Output WAV")
- White chip with clean styling
- Positioned at top-left

**Bottom Overlay**: Source information  
- Shows original key/caption from backend
- Dark overlay with "Source: [key]" format
- Positioned at bottom for context

### 2. **Media Type Specific Rendering**

#### Images & Videos:
- Display name chip at top-left
- Source caption at bottom as overlay
- Maintains zoom/controls functionality

#### Audio:
- Display name as main title
- Source caption as colored badge below controls
- Preserves duration and other info

### 3. **Dialog Enhancement**

**Title Structure**:
```
[Display Name]
filename.ext (source_key)
audio • 1024 KB • duration info
```

## Visual Layout

```
┌─────────────────────────────────┐
│ ┌─────────────┐           [i] □ │ ← Top: Display name chip + controls
│ │ Output WAV  │                 │
│ └─────────────┘                 │
│                                 │
│        [Media Content]          │
│                                 │
│         ┌─────────────┐         │ ← Bottom: Source caption
│         │Source: output_wav│     │
│         └─────────────┘         │
└─────────────────────────────────┘
```

## Backend Integration Requirements

### For `_sample_local_media_for_task`:

1. **Return format**: Include `key` or `caption` field in media objects
2. **Key preservation**: Maintain original data keys (e.g., "output_wav", "reference_audio")
3. **Consistent naming**: Use descriptive keys that make sense to users

### Example Backend Implementation:
```python
def _sample_local_media_for_task(task_data):
    media_files = []
    
    for key, file_path in task_data.items():
        if is_media_file(file_path):
            media_files.append({
                "filename": os.path.basename(file_path),
                "file_path": file_path,
                "media_type": detect_media_type(file_path),
                "key": key,  # ← Include the original key as caption
                "file_size": os.path.getsize(file_path),
                # ... other metadata
            })
    
    return {
        "media_files": media_files,
        # ... other question data
    }
```

## Features Implemented

### ✅ **Dual Caption System**
- Primary display name (formatted from key)
- Secondary source information (original key)
- Contextual positioning per media type

### ✅ **Backward Compatibility**
- Supports legacy raw_data format
- Handles missing key/caption gracefully
- Maintains existing functionality

### ✅ **Enhanced UX**
- Clear visual hierarchy
- Non-intrusive overlay design
- Consistent across all media types

### ✅ **Flexible Processing** 
- Handles both `key` and `caption` fields
- Automatic formatting of display names
- Robust fallback mechanisms

## Testing Guide

### Backend Response Test Cases:

1. **With key field**:
   ```json
   {"key": "output_wav", "filename": "output.wav", ...}
   ```
   Expected: Display "Output WAV" + "Source: output_wav"

2. **With caption field**:
   ```json
   {"caption": "reference_audio", "filename": "ref.wav", ...}
   ```
   Expected: Display "Reference Audio" + "Source: reference_audio"

3. **Without key/caption**:
   ```json
   {"filename": "file.wav", ...}
   ```
   Expected: Display filename only (fallback behavior)

### UI Verification:
- [ ] Display name chip appears at top-left
- [ ] Source caption appears at bottom
- [ ] Dialog shows complete information
- [ ] All media types render correctly
- [ ] Overlays don't interfere with controls

## File Changes

```
src/
├── services/api.ts                 # Enhanced processing logic
├── types/labeling.ts              # Added caption field
└── components/Tasks/
    ├── MediaDisplay.tsx           # Added dual caption display
    ├── LazyMediaItem.tsx          # Added caption overlays
    └── LabelingInterface.tsx      # Updated interface
```

The implementation is ready to receive and display backend media captions while maintaining full backward compatibility.