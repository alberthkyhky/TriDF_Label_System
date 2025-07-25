# New Data Sampler Format Implementation

## Overview
Updated the labeling interface to handle the new data sampler format that contains multiple file keys with their corresponding file paths.

## New Data Format Example
```javascript
{
  'index': '3', 
  'tag': 'EMIME/XTTS/pair_0003', 
  'output_wav': '/Users/yangping/Studio/side-project/ICLR2026_MMID/multimodality-labeling-system/labeling-system/backend/taskData/EMIME/XTTS/pair_0003/output.wav', 
  'other_wav': '/Users/yangping/Studio/side-project/ICLR2026_MMID/multimodality-labeling-system/labeling-system/backend/taskData/EMIME/XTTS/pair_0003/MM6_MAN_0026_1of2.wav'
}
```

## Implementation Changes

### 1. **New Utility Functions** (`src/utils/mediaUtils.ts`)

- **`parseMediaFilesFromData()`** - Extracts file paths from raw data object
- **`getMediaTypeFromExtension()`** - Determines media type from file extension
- **`isFilePath()`** - Checks if a string is a valid file path
- **`formatKeyToDisplayName()`** - Converts keys to human-readable names
- **`sortMediaFilesByPriority()`** - Sorts files by type priority

### 2. **Updated MediaFile Interface**

Added new fields to support multiple file format:
```typescript
interface MediaFile {
  // ... existing fields
  key?: string; // Original key (e.g., 'output_wav', 'other_wav')
  display_name?: string; // Human-readable name (e.g., 'Output WAV', 'Other WAV')
}
```

### 3. **Enhanced API Processing** (`src/services/api.ts`)

Updated `getTaskQuestionsWithMedia()` to:
- Process `raw_data` field from backend response
- Extract file paths from all object keys
- Convert to MediaFile objects with display names
- Sort by media type priority (images → videos → audio)

### 4. **Updated UI Components**

#### MediaDisplay Component:
- Added display name chips overlaying media items
- Updated dialog titles to show both display name and key
- Enhanced visual hierarchy with better labeling

#### LazyMediaItem Component:
- Added display name chips for all media types
- Positioned chips to not interfere with controls
- Applied consistent styling across media types

### 5. **Media Type Detection**

Supports file extensions:
- **Images**: .jpg, .jpeg, .png, .gif, .bmp, .webp, .svg, .tiff, .ico
- **Videos**: .mp4, .avi, .mov, .wmv, .flv, .webm, .mkv, .m4v, .3gp
- **Audio**: .mp3, .wav, .ogg, .aac, .flac, .m4a, .wma, .opus

## Display Name Examples

| Original Key | Display Name |
|--------------|--------------|
| `output_wav` | "Output WAV" |
| `other_wav` | "Other WAV" |
| `reference_image` | "Reference Image" |
| `source_video` | "Source Video" |

## Backend Integration

The system expects the backend to provide:
1. **Raw data** containing file keys and paths
2. **Question structure** with `raw_data` field
3. **Media serving** endpoint that accepts file paths

Example expected API response:
```javascript
{
  "id": "question_123",
  "task_id": "task_456", 
  "question_text": "Compare the audio quality",
  "raw_data": {
    "index": "3",
    "tag": "EMIME/XTTS/pair_0003",
    "output_wav": "/path/to/output.wav",
    "other_wav": "/path/to/other.wav"
  },
  // ... other question fields
}
```

## Features

### ✅ **Implemented**
- Automatic file path detection from any object key
- Dynamic media type determination from file extensions
- Human-readable display names from keys
- Visual labeling with chips on media items
- Fallback to original format for backward compatibility
- Sorted media display (images first, then videos, then audio)

### 🚀 **Benefits**
- **Flexible**: Handles any number of file keys
- **Extensible**: Easy to add new file types
- **Backward Compatible**: Works with existing data format
- **User-Friendly**: Clear labeling of media sources
- **Performance Optimized**: Maintains existing lazy loading

## Testing

To test the implementation:
1. Backend should return questions with `raw_data` containing file keys
2. Frontend will automatically detect and process file paths
3. Media items will display with appropriate labels
4. All existing functionality remains intact

## File Structure
```
src/
├── utils/
│   └── mediaUtils.ts           # New utility functions
├── types/
│   └── labeling.ts            # Updated MediaFile interface
├── services/
│   └── api.ts                 # Enhanced API processing
└── components/Tasks/
    ├── MediaDisplay.tsx       # Updated with display names
    └── LazyMediaItem.tsx      # Updated with display names
```

The implementation is now ready to handle the new data sampler format while maintaining full backward compatibility with existing data structures.