// Merged services/api.ts - Use FastAPI backend instead of direct Supabase
import { LabelClass, Task, TaskAssignment } from '../types/tasks';
import { TaskWithQuestionsData, MediaConfiguration, TaskFormData, MediaFile } from '../types/createTask';
import { QuestionResponseCreate, QuestionResponseDetailed, QuestionWithMedia } from '../types/labeling';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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
  media_config: MediaConfiguration;
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
  
  // Create timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`API call timeout after 5 seconds: ${url}`)), 5000);
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

  // Label Classes
  async getLabelClasses(): Promise<LabelClass[]> {
    return apiCall('/tasks/label-classes');
  },

  async createLabelClass(data: Omit<LabelClass, 'id'>): Promise<LabelClass> {
    return apiCall('/tasks/label-classes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateLabelClass(id: string, data: Partial<LabelClass>): Promise<LabelClass> {
    return apiCall(`/tasks/label-classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteLabelClass(id: string): Promise<void> {
    return apiCall(`/tasks/label-classes/${id}`, {
      method: 'DELETE',
    });
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
        'Authorization': `Bearer ${token}`
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
        throw new Error(`Validation error: ${errorMessage}`);
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
        'Authorization': `Bearer ${token}`
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
        'Authorization': `Bearer ${token}`
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
    assigned_classes: string[];
    target_labels: number;
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
    return apiCall('/assignments/all');
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
  
  async getUserAssignments(userId: string): Promise<any[]> {
    return apiCall(`/users/${userId}/assignments`);
  },
  
  async exportAssignmentReport(format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const headers = await getAuthHeaders();
    const url = `${API_URL}/api/v1/assignments/export?format=${format}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': headers.Authorization,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
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
        'Authorization': `Bearer ${token}`
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
        'Authorization': `Bearer ${token}`
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
        'Authorization': `Bearer ${token}`
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
            'Content-Type': 'application/json'
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
        'Authorization': `Bearer ${token}`
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

    return response.json();
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
        'Authorization': `Bearer ${token}`
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
        'Authorization': `Bearer ${token}`
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