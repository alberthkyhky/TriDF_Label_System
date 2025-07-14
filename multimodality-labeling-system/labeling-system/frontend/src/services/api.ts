// Fixed services/api.ts - Use FastAPI backend instead of direct Supabase
import { LabelClass, Task, TaskAssignment } from '../types/tasks';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Get auth headers for FastAPI
const getAuthHeaders = async () => {
  const session = JSON.parse(localStorage.getItem('sb-rtbwupulnejwsdfgzuek-auth-token') || '{}');
  return {
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  };
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
  async getTasks(): Promise<Task[]> {
    return apiCall('/tasks/');
  },

  async getTask(id: string): Promise<Task> {
    return apiCall(`/tasks/${id}`);
  },

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

  async updateTask(taskId: string, data: Partial<Task>): Promise<Task> {
    return apiCall(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteTask(taskId: string): Promise<void> {
    return apiCall(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },

  // Task Assignments
  async getMyAssignments(): Promise<TaskAssignment[]> {
    return apiCall('/tasks/assignments/my');
  },

  async assignTask(taskId: string, data: {
    user_id_to_assign: string;  // ← Fixed field name
    assigned_classes: string[];
    target_labels: number;
  }): Promise<TaskAssignment> {
    console.log('Assigning task:', taskId, data);
    return apiCall(`/tasks/${taskId}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getTaskAssignments(taskId: string): Promise<TaskAssignment[]> {
    return apiCall(`/tasks/${taskId}/assignments`);
  },

  // Questions
  async getTaskQuestions(taskId: string): Promise<any[]> {
    return apiCall(`/tasks/${taskId}/questions`);
  },

  async createQuestion(taskId: string, data: any): Promise<any> {
    return apiCall(`/tasks/${taskId}/questions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Responses
  async submitResponse(data: any): Promise<any> {
    return apiCall('/tasks/responses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMyResponses(taskId?: string): Promise<any[]> {
    const endpoint = taskId ? `/tasks/responses/my?task_id=${taskId}` : '/tasks/responses/my';
    return apiCall(endpoint);
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
  
  async getAllAssignments(): Promise<any[]> {
    return apiCall('/assignments/all');
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
};

