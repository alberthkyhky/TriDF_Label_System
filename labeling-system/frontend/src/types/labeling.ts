import { ExampleImage } from './createTask';

export interface Question {
    id: string;
    task_id: string;
    question_text: string;
    media_files: string[];
    choices: {
      [key: string]: {
        text: string;
        options: string[];
        multiple_select: boolean;
      }
    };
  }
  
export interface QuestionResponse {
question_id: string;
task_id: string;
responses: {
    [failureType: string]: string[];
};
media_files: string[];
}

export interface Task {
id: string;
title: string;
description: string;
instructions: string;
example_images?: ExampleImage[];
}

export interface MediaFile {
  filename: string;
  file_path: string;
  media_type: 'image' | 'video' | 'audio';
  file_size?: number;
  mime_type?: string;
  duration_seconds?: number;
  width?: number;
  height?: number;
  // New fields for multiple file format
  key?: string; // The original key from the data (e.g., 'output_wav', 'other_wav')
  caption?: string; // Alternative to key field (from backend)
  display_name?: string; // Human-readable display name
}

export interface FailureChoice {
  text: string;
  options: string[];
  multiple_select: boolean;
  order?: number;
}

export interface QuestionWithMedia {
  id: string;
  task_id: string;
  question_text: string;
  question_order: number;
  status: string;
  target_classes: string[];
  media_files: MediaFile[];
  choices: {
    [key: string]: FailureChoice;
  };
  created_at: string;
  updated_at?: string;
}

export interface QuestionResponseCreate {
  question_id: number;
  task_id: string;
  responses: {
    [failureType: string]: string[];
  };
  time_spent_seconds?: number;
  started_at?: string;
}

export interface QuestionResponseDetailed {
  id: string;
  question_id: string;
  user_id: string;
  task_id: string;
  task_assignment_id: string;
  responses: {
    [failureType: string]: string[];
  };
  confidence_level?: number;
  time_spent_seconds?: number;
  started_at?: string;
  submitted_at: string;
  media_files: string[];
  is_honeypot_response: boolean;
  is_flagged: boolean;
  flag_reason?: string;
  metadata: Record<string, any>;
}