import { MediaFile } from '../types/labeling';

// File extension mappings
const MEDIA_EXTENSIONS = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.ico'],
  video: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp'],
  audio: ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a', '.wma', '.opus']
};

/**
 * Determine media type from file extension
 */
export const getMediaTypeFromExtension = (filePath: string): 'image' | 'video' | 'audio' | null => {
  const extension = getFileExtension(filePath);
  
  for (const [mediaType, extensions] of Object.entries(MEDIA_EXTENSIONS)) {
    if (extensions.includes(extension)) {
      return mediaType as 'image' | 'video' | 'audio';
    }
  }
  
  return null;
};

/**
 * Get file extension from path
 */
export const getFileExtension = (filePath: string): string => {
  return filePath.toLowerCase().substring(filePath.lastIndexOf('.')).toLowerCase();
};

/**
 * Get filename from path
 */
export const getFilename = (filePath: string): string => {
  return filePath.substring(filePath.lastIndexOf('/') + 1);
};

/**
 * Check if a string looks like a file path
 */
export const isFilePath = (value: string): boolean => {
  // Check if the string contains a file extension
  const hasExtension = /\.[a-zA-Z0-9]{2,4}$/.test(value);
  
  // Check if it contains path separators
  const hasPathSeparator = value.includes('/') || value.includes('\\');
  
  // Should have both extension and path separator to be considered a file path
  return hasExtension && hasPathSeparator;
};

/**
 * Convert new data format to MediaFile array
 * Input: {'index': '3', 'tag': 'EMIME/XTTS/pair_0003', 'output_wav': '/path/to/output.wav', 'other_wav': '/path/to/other.wav'}
 * Output: MediaFile[]
 */
export const parseMediaFilesFromData = (data: Record<string, any>): MediaFile[] => {
  const mediaFiles: MediaFile[] = [];
  
  // Iterate through all key-value pairs
  for (const [key, value] of Object.entries(data)) {
    // Skip non-string values and non-file-path values
    if (typeof value !== 'string' || !isFilePath(value)) {
      continue;
    }
    
    const mediaType = getMediaTypeFromExtension(value);
    if (!mediaType) {
      // If we can't determine media type, skip this file
      continue;
    }
    
    const filename = getFilename(value);
    const displayName = formatKeyToDisplayName(key);
    
    mediaFiles.push({
      filename,
      file_path: value,
      media_type: mediaType,
      key,
      display_name: displayName
    });
  }
  
  return mediaFiles;
};

/**
 * Format a key to a human-readable display name
 * Examples: 
 * - 'output_wav' -> 'Output WAV'
 * - 'other_wav' -> 'Other WAV' 
 * - 'reference_image' -> 'Reference Image'
 */
export const formatKeyToDisplayName = (key: string): string => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Sort media files by type priority (images first, then videos, then audio)
 */
export const sortMediaFilesByPriority = (mediaFiles: MediaFile[]): MediaFile[] => {
  const priority = { image: 0, video: 1, audio: 2 };
  
  return [...mediaFiles].sort((a, b) => {
    const priorityDiff = priority[a.media_type] - priority[b.media_type];
    if (priorityDiff !== 0) return priorityDiff;
    
    // If same media type, sort by key name
    return (a.key || '').localeCompare(b.key || '');
  });
};