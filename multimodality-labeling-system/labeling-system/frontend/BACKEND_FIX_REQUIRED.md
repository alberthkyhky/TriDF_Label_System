# Backend Fix Required: Preserve Keys from raw_data.items()

## Problem Analysis

After tracing the complete pipeline from frontend to backend, I found that the keys from `raw_data.items()` in `_sample_local_media_for_task` are being **completely lost** during processing.

### Current Backend Flow (BROKEN)

```python
# In question_service.py line 79-82
raw_data = sampler.sample_by_idx(task_name, idx)
# raw_data = {'output_wav': '/path/to/output.wav', 'other_wav': '/path/to/other.wav'}

for key, data_path in raw_data.items():  # key = 'output_wav', 'other_wav'
    if os.path.isfile(data_path):
        # ❌ PROBLEM: The 'key' is lost here!
        sampled_media.append(await self._create_media_file_from_path(Path(data_path)))
```

The `_create_media_file_from_path` method only receives the file path, not the original key.

## Required Backend Changes

### 1. Update MediaFile Model

**File:** `backend/app/models/tasks.py` (line 133)

**Current:**
```python
class MediaFile(BaseModel):
    filename: str
    file_path: str
    media_type: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    duration_seconds: Optional[float] = None
    width: Optional[int] = None  
    height: Optional[int] = None
    tags: List[str] = []
    metadata: Dict[str, Any] = {}
```

**Add this field:**
```python
class MediaFile(BaseModel):
    filename: str
    file_path: str
    media_type: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    duration_seconds: Optional[float] = None
    width: Optional[int] = None  
    height: Optional[int] = None
    caption: Optional[str] = None  # ← ADD THIS FIELD
    tags: List[str] = []
    metadata: Dict[str, Any] = {}
```

### 2. Update _create_media_file_from_path Method

**File:** `backend/app/services/question_service.py` (line 111)

**Current:**
```python
async def _create_media_file_from_path(self, file_path: Path) -> MediaFile:
```

**Change to:**
```python  
async def _create_media_file_from_path(self, file_path: Path, caption: Optional[str] = None) -> MediaFile:
```

**And update the return statement (line 139):**
```python
return MediaFile(
    filename=file_path.name,
    file_path=str(file_path),
    media_type=media_type,
    file_size=stat.st_size,
    mime_type=mime_type,
    caption=caption,  # ← ADD THIS LINE
    tags=[],
    metadata={
        "created_at": stat.st_mtime,
        "last_modified": stat.st_mtime,
        "task_folder": file_path.parent.name
    }
)
```

### 3. Update _sample_local_media_for_task Method  

**File:** `backend/app/services/question_service.py` (line 75)

**Current:**
```python
async def _sample_local_media_for_task(self, task_name: str, idx: int = 0) -> List[MediaFile]:
    try:
        sampled_media = []
        raw_data = sampler.sample_by_idx(task_name, idx)
        for key, data_path in raw_data.items():
            if os.path.isfile(data_path):
                sampled_media.append(await self._create_media_file_from_path(Path(data_path)))
        return sampled_media
```

**Change to:**
```python
async def _sample_local_media_for_task(self, task_name: str, idx: int = 0) -> List[MediaFile]:
    try:
        sampled_media = []
        raw_data = sampler.sample_by_idx(task_name, idx)
        for key, data_path in raw_data.items():
            if os.path.isfile(data_path):
                # ✅ PASS THE KEY AS CAPTION
                sampled_media.append(await self._create_media_file_from_path(Path(data_path), caption=key))
        return sampled_media
```

## Expected Result

After these changes, the API response will include the original keys:

```json
{
  "media_files": [
    {
      "filename": "output.wav",
      "file_path": "/path/to/output.wav", 
      "media_type": "audio",
      "caption": "output_wav",
      "file_size": 1024000
    },
    {
      "filename": "MM6_MAN_0026_1of2.wav",
      "file_path": "/path/to/other.wav",
      "media_type": "audio", 
      "caption": "other_wav",
      "file_size": 2048000
    }
  ]
}
```

## Frontend is Already Ready

The frontend already has complete support for displaying these captions:

- ✅ MediaFile interface includes `caption?: string` field
- ✅ UI components render both display names and source captions
- ✅ Debug logging shows caption processing
- ✅ All media types (image/video/audio) support caption display

## Test Data Flow

With these backend changes, the data flow will be:

1. **CSV Data:** `output_wav` → `/path/to/output.wav`
2. **sampler.sample_by_idx():** Returns dict with keys
3. **_sample_local_media_for_task():** Preserves keys as captions  
4. **API Response:** Includes `caption: "output_wav"`
5. **Frontend:** Renders "Output Wav" and "Source: output_wav"

## Next Steps

1. Make the 3 backend changes above
2. Restart the backend server  
3. Test in frontend - the debug logs will show captions being processed
4. Verify that media items display both display names and source captions

The frontend implementation is complete and ready to receive and display these captions!