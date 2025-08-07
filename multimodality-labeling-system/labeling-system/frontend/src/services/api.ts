// Merged services/api.ts - Use FastAPI backend instead of direct Supabase
import { Task, TaskAssignment } from '../types/tasks';
import { TaskWithQuestionsData, TaskFormData, MediaFile } from '../types/createTask';
import { QuestionResponseCreate, QuestionResponseDetailed, QuestionWithMedia } from '../types/labeling';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
console.log('API_URL from env:', process.env.REACT_APP_API_URL);
console.log('Final API_URL:', API_URL);

// Enhanced TaskWithQuestionsResponse interface
interface TaskWithQuestionsResponse {
  id: string;
  title: string;
  description: string;
  instructions: string;
  example_media: string[];
  status: string;
  questions_per_user: number;
  required_agreements: number;
  question_template: {
    question_text: string;
    choices: {
      [key: string]: {
        text: string;
        options: string[];
        multiple_select: boolean;
      };
    };
  };
  created_by: string;
  created_at: string;
  updated_at?: string;
  deadline?: string;
  total_questions_generated: number;
}

// Get auth headers for FastAPI
const getAuthHeaders = async () => {
  const session = JSON.parse(localStorage.getItem('sb-rtbwupulnejwsdfgzuek-auth-token') || '{}');
  console.log(session);
  return {
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Required for ngrok free tier
  };
};

// Helper function to get auth token (alternative method)
export const getToken = (): string | null => {
  // First try the session storage approach
  const session = JSON.parse(localStorage.getItem('sb-rtbwupulnejwsdfgzuek-auth-token') || '{}');
  if (session?.access_token) {
    return session.access_token;
  }
  
  // Fallback to direct token storage
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
};

// Generic API helper with timeout
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const headers = await getAuthHeaders();
  const url = `${API_URL}/api/v1${endpoint}`;
  console.log(url);
  
  // Create timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`API call timeout after 10 seconds: ${url}`)), 10000);
  });
  
  // Create fetch promise
  const fetchPromise = fetch(url, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  
  try {
    // Race between fetch and timeout
    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('💥 API Call Failed:', error);
    throw error;
  }
};

export const api = {
  // Auth endpoints
  async getUserProfile(): Promise<any> {
    return apiCall('/auth/profile');
  },

  async updateUserProfile(data: any): Promise<any> {
    return apiCall('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getUserStats(): Promise<any> {
    return apiCall('/auth/stats');
  },


  // Tasks
  async getTasks(): Promise<TaskWithQuestionsData[]> {
    return apiCall('/tasks/');
  },

  async getTask(id: string): Promise<TaskWithQuestionsData> {
    return apiCall(`/tasks/${id}`);
  },

  /**
   * Create basic task (legacy method for backward compatibility)
   */
  async createTask(data: {
    title: string;
    description?: string;
    questions_per_user: number;
    required_agreements: number;
  }): Promise<Task> {
    return apiCall('/tasks/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Create task with questions using the enhanced endpoint
   */
  async createTaskWithQuestions(taskData: TaskFormData): Promise<TaskWithQuestionsResponse> {
    console.log('Creating task with questions:', taskData);
    const token = getToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(`${API_URL}/api/v1/tasks/with-questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create task with questions';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        // If JSON parsing fails, use status text
        errorMessage = response.statusText || errorMessage;
      }
      
      // Handle specific error codes
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (response.status === 403) {
        throw new Error('Permission denied. Admin access required.');
      } else if (response.status === 422) {
        // For validation errors, try to get more detailed error information
        let detailedError = errorMessage;
        if (typeof errorMessage === 'object') {
          detailedError = JSON.stringify(errorMessage, null, 2);
        }
        console.error('422 Validation Error Details:', errorMessage);
        throw new Error(`Validation error: ${detailedError}`);
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  },

  /**
   * Get enhanced task by ID
   */
  async getTaskWithQuestions(taskId: string): Promise<TaskWithQuestionsData> {
    const token = getToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(`${API_URL}/api/v1/tasks/${taskId}/enhanced`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch enhanced task');
    }

    return response.json();
  },

  async updateTask(taskId: string, data: Partial<Task>): Promise<Task> {
    console.log('Updating task via API:', taskId, data);
    return apiCall(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update task with questions using the enhanced endpoint
   */
  async updateTaskWithQuestions(taskId: string, taskData: Partial<TaskWithQuestionsData>): Promise<TaskWithQuestionsData> {
    console.log('Updating task with questions:', taskId, taskData);
    const token = getToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(`${API_URL}/api/v1/tasks/${taskId}/with-questions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      let errorMessage = 'Failed to update task with questions';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        // If JSON parsing fails, use status text
        errorMessage = response.statusText || errorMessage;
      }
      
      // Handle specific error codes
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (response.status === 403) {
        throw new Error('Permission denied. Admin access required.');
      } else if (response.status === 404) {
        throw new Error('Task not found or endpoint not implemented.');
      } else if (response.status === 422) {
        throw new Error(`Validation error: ${errorMessage}`);
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  },

  async deleteTask(taskId: string): Promise<void> {
    return apiCall(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },

  // Task Assignments
  async getMyAssignments(): Promise<TaskAssignment[]> {
    return apiCall('/assignments/my');
  },

  async assignTask(taskId: string, data: {
    user_id_to_assign: string;
    question_range_start: number;
    question_range_end: number;
  }): Promise<TaskAssignment> {
    console.log('Assigning task:', taskId, data);
    return apiCall(`/assignments/task/${taskId}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getTaskAssignment(taskId: string): Promise<TaskAssignment> {
    return apiCall(`/assignments/task/${taskId}`);
  },

  async getAllAssignments(): Promise<any[]> {
    // Get all assignments with high limit to ensure we get everything
    return apiCall('/assignments/all?limit=1000');
  },

  async getUserAssignmentOverview(forceRefresh?: boolean): Promise<any> {
    // Get optimized user assignment overview data in single call
    const url = forceRefresh 
      ? `/assignments/user-assignment-overview?_t=${Date.now()}`
      : '/assignments/user-assignment-overview';
    return apiCall(url);
  },

  async getTaskAssignments(taskId: string): Promise<any[]> {
    console.log('Getting task assignments for taskId:', taskId);
    
    // Since /assignments/task/{taskId}/all doesn't exist, get all assignments and filter
    try {
      console.log('Trying /assignments/all endpoint...');
      const allAssignments = await apiCall('/assignments/all');
      console.log('All assignments received:', allAssignments);
      
      // Filter assignments by task_id
      const filteredAssignments = allAssignments.filter((assignment: any) => assignment.task_id === taskId);
      console.log('Filtered assignments for task:', filteredAssignments);
      
      return filteredAssignments;
    } catch (error) {
      console.error('Failed to get all assignments:', error);
      
      // Fallback: try to get single task assignment
      try {
        console.log('Trying fallback /assignments/task/{taskId} endpoint...');
        const singleAssignment = await apiCall(`/assignments/task/${taskId}`);
        console.log('Single assignment received:', singleAssignment);
        return singleAssignment ? [singleAssignment] : [];
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return [];
      }
    }
  },
  
  async getAssignmentStats(): Promise<any> {
    return apiCall('/assignments/stats');
  },
  
  async getAssignment(id: string): Promise<any> {
    return apiCall(`/assignments/${id}`);
  },
  
  async updateAssignmentStatus(id: string, isActive: boolean): Promise<any> {
    return apiCall(`/assignments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive }),
    });
  },
  
  async exportAssignmentReport(format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const headers = await getAuthHeaders();
    const url = `${API_URL}/api/v1/assignments/export?format=${format}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': headers.Authorization,
        'ngrok-skip-browser-warning': 'true'
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Export failed: ${response.status} - ${errorText}`);
    }
    
    return response.blob();
  },

  async exportTaskResponses(taskId: string, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const headers = await getAuthHeaders();
    const url = `${API_URL}/api/v1/tasks/${taskId}/responses/export?format=${format}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': headers.Authorization,
        'ngrok-skip-browser-warning': 'true'
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      
      // Handle specific error for not implemented endpoint
      if (response.status === 404) {
        throw new Error(`Export endpoint not implemented yet. Please contact your backend developer to implement: GET /api/v1/tasks/{taskId}/responses/export`);
      }
      
      throw new Error(`Export failed: ${response.status} - ${errorText}`);
    }
    
    return response.blob();
  },

  // Questions
  async getTaskQuestions(taskId: string): Promise<any[]> {
    return apiCall(`/questions/${taskId}/questions`);
  },

  async createQuestion(taskId: string, data: any): Promise<any> {
    return apiCall(`/questions/${taskId}/questions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Responses
  async submitResponse(data: any): Promise<any> {
    return apiCall('/responses/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMyResponses(taskId?: string): Promise<any[]> {
    const endpoint = taskId ? `/responses/my?task_id=${taskId}` : '/responses/my';
    return apiCall(endpoint);
  },

  // Media Management
  /**
   * Get available media files (for admin preview)
   */
  async getAvailableMedia() {
    const token = getToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(`${API_URL}/api/v1/tasks/media/available`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch available media');
    }

    return response.json();
  },

  /**
   * Sample media files for preview
   */
  async sampleMediaFiles(sampleRequest: {
    num_images: number;
    num_videos: number;
    num_audios: number;
  }) {
    const token = getToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(`${API_URL}/api/v1/tasks/media/sample`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(sampleRequest)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to sample media files');
    }

    return response.json();
  },

  /**
   * Create sample media files for testing (development only)
   */
  async createSampleMediaFiles() {
    const token = getToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(`${API_URL}/api/v1/tasks/media/create-samples`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to create sample media files');
    }

    return response.json();
  },

  // Users (Admin only)
  async getUsers(): Promise<any[]> {
    return apiCall('/users/');
  },

  async getUsersByRole(role: string): Promise<any[]> {
    return apiCall(`/users/by-role/${role}`);
  },

  async searchUsers(query: string, limit: number = 50): Promise<any[]> {
    return apiCall(`/users/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  },

  async getActiveUsers(days: number = 30): Promise<any[]> {
    return apiCall(`/users/active?days=${days}`);
  },

  async getUser(id: string): Promise<any> {
    return apiCall(`/users/${id}`);
  },

  async updateUser(id: string, data: any): Promise<any> {
    return apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async updateUserRole(id: string, role: string): Promise<any> {
    return apiCall(`/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  async deactivateUser(id: string): Promise<any> {
    return apiCall(`/users/${id}/deactivate`, {
      method: 'POST',
    });
  },

  async reactivateUser(id: string): Promise<any> {
    return apiCall(`/users/${id}/reactivate`, {
      method: 'POST',
    });
  },

  async getUserPerformance(id: string): Promise<any> {
    return apiCall(`/users/${id}/performance`);
  },

  async getUserActivity(id: string): Promise<any> {
    return apiCall(`/users/${id}/activity`);
  },

  async getMediaFile(taskId: string, mediaFile: MediaFile): Promise<string> {
    const token = getToken();
    if (!token) {
      throw new Error('Authentication required');
    }
  
    const mediaUrl = `${API_URL}/api/v1/media/${taskId}/serve`;
      
      try {
        const response = await fetch(mediaUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({
            file_path: mediaFile.file_path  // Send absolute file path
          })
        });
  
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
  
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        return blobUrl;
      } catch (error) {
        console.error('Error fetching media:', error);
        throw error;
      }
  },

  getTaskQuestionsWithMedia: async (taskId: string, idx?: number): Promise<QuestionWithMedia[]> => {
    const token = getToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    // Build URL with optional idx parameter
    let url = `${API_URL}/api/v1/questions/${taskId}/questions-with-media`;
    if (idx !== undefined) {
      url += `?idx=${idx}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch questions with media';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (response.status === 403) {
        throw new Error('Access denied to this task.');
      } else if (response.status === 404) {
        throw new Error('Task not found or no questions available.');
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    console.log('🔍 Raw API response from backend:', JSON.stringify(data, null, 2));
    
    // Process the response to handle new data format
    const processedQuestions = data.map((question: any) => {
      console.log('🔍 Processing question:', question.id);
      console.log('📋 Question structure:', {
        has_media_files: !!question.media_files,
        media_files_length: question.media_files?.length || 0,
        has_raw_data: !!question.raw_data,
        sample_media_file: question.media_files?.[0]
      });
      
      // Handle new format with _sample_local_media_for_task that returns key as caption
      if (question.media_files && Array.isArray(question.media_files)) {
        console.log('📁 Processing media_files array...');
        
        // Check if media_files already contain key information from backend
        const enhancedMediaFiles = question.media_files.map((mediaFile: any, index: number) => {
          console.log(`🎵 Processing media file ${index}:`, {
            filename: mediaFile.filename,
            has_key: !!mediaFile.key,
            has_caption: !!mediaFile.caption,
            key_value: mediaFile.key,
            caption_value: mediaFile.caption,
            all_fields: Object.keys(mediaFile)
          });
          
          // Use the key field from backend as the primary source
          if (mediaFile.key) {
            const { formatKeyToDisplayName } = require('../utils/mediaUtils');
            const displayName = formatKeyToDisplayName(mediaFile.key);
            
            console.log(`✅ Using backend key as caption: ${mediaFile.key} -> ${displayName}`);
            
            return {
              ...mediaFile,
              caption: mediaFile.key,  // Use key as caption
              display_name: displayName
            };
          }
          
          // Fallback to caption field if no key
          if (mediaFile.caption) {
            const { formatKeyToDisplayName } = require('../utils/mediaUtils');
            const displayName = formatKeyToDisplayName(mediaFile.caption);
            
            console.log(`✅ Using backend caption: ${mediaFile.caption} -> ${displayName}`);
            
            return {
              ...mediaFile,
              display_name: displayName
            };
          }
          
          console.log(`⚠️ No key/caption found for media file: ${mediaFile.filename}`);
          // Fallback to original filename-based approach
          return mediaFile;
        });
        
        const { sortMediaFilesByPriority } = require('../utils/mediaUtils');
        const sortedMediaFiles = sortMediaFilesByPriority(enhancedMediaFiles);
        
        console.log('🎯 Final processed media files:', sortedMediaFiles.map((mf: any) => ({
          filename: mf.filename,
          key: mf.key,
          display_name: mf.display_name
        })));
        
        return {
          ...question,
          media_files: sortedMediaFiles
        };
      }
      
      // If the question has raw data with multiple file keys, process it (legacy support)
      if (question.raw_data && typeof question.raw_data === 'object') {
        console.log('📦 Processing raw_data format...');
        const { parseMediaFilesFromData, sortMediaFilesByPriority } = require('../utils/mediaUtils');
        const mediaFiles = parseMediaFilesFromData(question.raw_data);
        const sortedMediaFiles = sortMediaFilesByPriority(mediaFiles);
        
        console.log('🎯 Processed from raw_data:', sortedMediaFiles.map((mf: any) => ({
          filename: mf.filename,
          key: mf.key,
          display_name: mf.display_name
        })));
        
        return {
          ...question,
          media_files: sortedMediaFiles
        };
      }
      
      console.log('❌ No processing needed for question');
      // Fallback to original format if no enhanced processing needed
      return question;
    });
    
    console.log('Processed questions with media:', processedQuestions);
    return processedQuestions;
  },

  /**
   * Submit detailed question response
   */
  createDetailedQuestionResponse: async (responseData: QuestionResponseCreate): Promise<QuestionResponseDetailed> => {
    const token = getToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(`${API_URL}/api/v1/responses/detailed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(responseData)
    });

    if (!response.ok) {
      let errorMessage = 'Failed to submit response';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (response.status === 403) {
        throw new Error('Permission denied. You may not have access to this task.');
      } else if (response.status === 422) {
        throw new Error(`Validation error: ${errorMessage}`);
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  },

  /**
   * Get user's detailed responses for a task (optional - for review)
   */
  getMyDetailedResponses: async (taskId?: string): Promise<QuestionResponseDetailed[]> => {
    const token = getToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const url = taskId 
      ? `${API_URL}/api/v1/responses/my?task_id=${taskId}`
      : `${API_URL}/api/v1/responses/my`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch detailed responses');
    }

    return response.json();
  }
};

// Export types for use in components
export type {
  TaskWithQuestionsResponse
};