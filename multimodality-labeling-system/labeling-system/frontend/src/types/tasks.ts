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

  export interface TaskWithQuestions {
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
    media_config: {
      num_images: number;
      num_videos: number;
      num_audios: number;
      total_questions: number;
    };
    created_by: string;
    created_at: string;
    updated_at?: string;
    deadline?: string;
    total_questions_generated: number;
  }