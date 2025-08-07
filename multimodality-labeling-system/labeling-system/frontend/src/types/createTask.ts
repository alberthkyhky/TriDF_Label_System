// Update your src/types/createTask.ts file

export interface FailureChoice {
  text: string;
  options: string[];
  multiple_select: boolean;
}

export interface QuestionChoices {
  [key: string]: FailureChoice;
}


export interface TaskFormData {
  title: string;
  description: string;
  instructions: string;
  questions_number: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  example_media: string[];
  required_agreements: number;
  question_template: {
    question_text: string;
    choices: QuestionChoices;
  };
}

export interface TaskWithQuestionsData {
  id: string;
  title: string;
  description: string;
  status: string;
  instructions: string;
  example_media: string[];
  questions_number: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  required_agreements: number;
  created_at: string;
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
}

export interface TaskWithQuestionsResponse {
  id: string;
  title: string;
  description: string;
  instructions: string;
  example_media: string[];
  status: string;
  questions_number: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
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

// For media management
export interface MediaFile {
  filename: string;
  file_path: string;
  media_type: 'image' | 'video' | 'audio';
  file_size?: number;
  mime_type?: string;
  duration_seconds?: number;
  width?: number;
  height?: number;
  // tags: string[];
  // metadata: Record<string, any>;
}

export interface MediaAvailableResponse {
  images: MediaFile[];
  videos: MediaFile[];
  audios: MediaFile[];
  total_counts: {
    images: number;
    videos: number;
    audios: number;
    total: number;
  };
}

export interface MediaSampleResponse {
  sampled_media: MediaFile[];
  total_available: Record<string, number>;
}