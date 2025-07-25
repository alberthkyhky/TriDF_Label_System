# JSON Task Creation Guide

The admin dashboard now supports creating tasks by uploading JSON files. This feature allows for programmatic task creation and easier batch task setup.

## How to Use

1. **Access Admin Dashboard**: Navigate to the admin dashboard
2. **Click "Upload JSON"**: Find the "Upload JSON" button next to "Create New Task" 
3. **Select JSON File**: Choose a properly formatted JSON file from your computer
4. **Automatic Creation**: The task will be created automatically if the JSON is valid

## JSON File Structure

### Required Fields

```json
{
  "title": "Task Title",                    // string: Name of the task
  "description": "Task description",       // string: Detailed description  
  "instructions": "Task instructions",     // string: Instructions for labelers
  "questions_number": 50,                  // number: Number of questions to generate
  "required_agreements": 2,                // number: Required agreements per question
  "example_media": [],                     // array: Example media file paths (optional)
  "question_template": {                   // object: Question structure
    "question_text": "Question to ask",   // string: The question text
    "choices": {                           // object: Answer choices
      "choice_key": {                      // string: Unique identifier for choice
        "text": "Choice label",            // string: Display text for choice
        "options": ["Option1", "Option2"], // array: Available options
        "multiple_select": true            // boolean: Allow multiple selections
      }
    }
  },
  "media_config": {                        // object: Media sampling configuration
    "num_images": 0,                       // number: Number of images per question
    "num_videos": 0,                       // number: Number of videos per question  
    "num_audios": 2                        // number: Number of audio files per question
  }
}
```

### Validation Rules

1. **Required Fields**: All fields listed above must be present
2. **Question Template**: Must have `question_text` and `choices`
3. **Choice Structure**: Each choice must have `text`, `options` array, and `multiple_select` boolean
4. **Media Config**: Must have numeric values for `num_images`, `num_videos`, `num_audios`
5. **Options Array**: Must include "None" as first option (added automatically if missing)

## Example Files

### Audio Quality Assessment Task
```json
{
  "title": "Audio Quality Assessment Task",
  "description": "Evaluate the quality of generated audio samples compared to reference audio.",
  "instructions": "Listen to both audio samples and identify any quality issues in the generated audio.",
  "questions_number": 50,
  "required_agreements": 2,
  "example_media": ["example_audio_1.wav", "example_audio_2.wav"],
  "question_template": {
    "question_text": "Compare the generated audio with the reference audio. What quality issues do you observe?",
    "choices": {
      "structural_issues": {
        "text": "Structural Issues (A-type failures)",
        "options": ["None", "Audio truncation", "Silent segments", "Incomplete generation"],
        "multiple_select": true
      },
      "quality_issues": {
        "text": "Quality Issues (C-type failures)", 
        "options": ["None", "Background noise", "Audio artifacts", "Volume inconsistency"],
        "multiple_select": true
      }
    }
  },
  "media_config": {
    "num_images": 0,
    "num_videos": 0, 
    "num_audios": 2
  }
}
```

### Multimodal Content Analysis Task
```json
{
  "title": "Multimodal Content Analysis Task",
  "description": "Analyze images, videos, and audio content to identify quality issues.",
  "instructions": "Review each media item carefully and classify different types of failures.",
  "questions_number": 100,
  "required_agreements": 3,
  "example_media": ["example_image.jpg", "example_video.mp4", "example_audio.wav"],
  "question_template": {
    "question_text": "Analyze the provided media content and identify any quality issues or failures present.",
    "choices": {
      "technical_failures": {
        "text": "Technical Failures",
        "options": ["None", "Corruption or artifacts", "Resolution issues", "Format problems"],
        "multiple_select": true
      },
      "overall_rating": {
        "text": "Overall Quality Rating",
        "options": ["Excellent", "Good", "Fair", "Poor", "Unacceptable"],
        "multiple_select": false
      }
    }
  },
  "media_config": {
    "num_images": 2,
    "num_videos": 1,
    "num_audios": 1
  }
}
```

## Features

### ✅ **Comprehensive Validation**
- Validates all required fields before creation
- Checks data types and structure
- Provides detailed error messages for invalid JSON

### ✅ **User Feedback**
- Success notification shows created task name
- Error alerts display specific validation failures
- Loading states during file processing

### ✅ **Automatic Integration**
- Tasks appear immediately in task list after creation
- Uses existing backend API (`createTaskWithQuestions`)
- Maintains consistency with manual task creation

### ✅ **Error Handling**
- File parsing errors
- JSON structure validation
- API creation failures
- User-friendly error messages

## Error Messages

Common validation errors you might encounter:

- `"Missing required field: [field_name]"` - Required field is missing
- `"Invalid question_template structure"` - Question template format is incorrect
- `"Invalid media_config structure"` - Media config must have numeric values
- `"Choice [key] must have text, options, and multiple_select"` - Choice format is invalid
- `"Failed to create task from JSON file"` - API creation failed

## Best Practices

1. **Test JSON Structure**: Validate your JSON in a JSON validator before uploading
2. **Use Example Files**: Start with the provided examples and modify as needed
3. **Meaningful Names**: Use descriptive choice keys and titles
4. **Appropriate Media Config**: Set realistic numbers for media files per question
5. **Clear Instructions**: Provide detailed instructions for labelers

## File Location

Example JSON files are located in the frontend directory:
- `example-task.json` - Audio quality assessment example
- `example-multimodal-task.json` - Multimodal content analysis example

You can use these as templates for creating your own task JSON files.