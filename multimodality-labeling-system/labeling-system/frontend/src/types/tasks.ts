export interface LabelClass {
    id: string;
    name: string;
    description?: string;
    color_hex: string;
    is_active: boolean;
  }
  
  export interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'draft' | 'active' | 'paused' | 'completed';
    rule_image_path?: string;
    rule_description?: string;
    questions_per_user: number;
    required_agreements: number;
    created_by: string;
    created_at: string;
    deadline?: string;
  }
  
  export interface TaskAssignment {
    id: string;
    task_id: string;
    user_id: string;
    assigned_classes: string[];
    target_labels: number;
    completed_labels: number;
    assigned_at: string;
    is_active: boolean;
  }