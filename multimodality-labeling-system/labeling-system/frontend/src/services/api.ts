import { supabase } from '../lib/supabase';
import { LabelClass, Task, TaskAssignment } from '../types/tasks';

const API_URL = process.env.REACT_APP_API_URL;

// Get auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  };
};

export const api = {
  // Label Classes
  async getLabelClasses(): Promise<LabelClass[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/label-classes`, { headers });
    if (!response.ok) throw new Error('Failed to fetch label classes');
    return response.json();
  },

  async createLabelClass(data: Omit<LabelClass, 'id'>): Promise<LabelClass> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/label-classes`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create label class');
    return response.json();
  },

  // Tasks
  async getTasks(): Promise<Task[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/tasks`, { headers });
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  },

  async createTask(data: Omit<Task, 'id' | 'created_by' | 'created_at' | 'status'>): Promise<Task> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  },

  // Assignments
  async getMyAssignments(): Promise<TaskAssignment[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/my-assignments`, { headers });
    if (!response.ok) throw new Error('Failed to fetch assignments');
    return response.json();
  },

  async assignTask(taskId: string, userId: string, assignedClasses: string[], targetLabels: number) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/tasks/${taskId}/assign`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id_to_assign: userId,
        assigned_classes: assignedClasses,
        target_labels: targetLabels,
      }),
    });
    if (!response.ok) throw new Error('Failed to assign task');
    return response.json();
  },
};